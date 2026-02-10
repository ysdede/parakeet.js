#!/usr/bin/env python3
"""
Comprehensive Chrome trace analyzer for boncukjs.

Analyzes Chrome performance traces for:
- Main thread long tasks and rendering pipeline
- Web Worker activity and GC pressure
- WebGPU command patterns and stalls
- AudioWorklet timing precision and jitter
- WASM compilation overhead
- Worker message passing overhead
- Frame rate and rendering analysis
- JS function call hotspots

Usage:
    python analyze_chrome_trace.py [trace_file.json]

If no file is given, defaults to trace_boncuk-tracing.json in the same directory.
Outputs a JSON summary to trace_analysis_summary.json and prints a human-readable report.
"""
import json
import os
import sys
import statistics
from collections import defaultdict
from pathlib import Path


def load_trace(path):
    print(f"Loading trace file: {path}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    events = data.get("traceEvents", data if isinstance(data, list) else [])
    print(f"Loaded {len(events)} events")
    return events


def build_maps(events):
    """Build PID -> process name and (PID, TID) -> thread name mappings."""
    pid_names = {}
    tid_names = {}
    for e in events:
        if e.get("ph") != "M":
            continue
        args = e.get("args", {})
        if e.get("name") == "process_name":
            pid_names[e["pid"]] = args.get("name", "")
        elif e.get("name") == "thread_name":
            tid_names[(e["pid"], e["tid"])] = args.get("name", "")
    return pid_names, tid_names


def identify_renderer(pid_names, tid_names):
    """Find the main renderer PID and key thread IDs."""
    renderer_pids = [pid for pid, name in pid_names.items() if name == "Renderer"]
    gpu_pid = next((pid for pid, name in pid_names.items() if name == "GPU Process"), None)
    audio_service_pid = next(
        (pid for pid, name in pid_names.items() if "audio" in name.lower()), None
    )

    # The main renderer is the one with the most threads (workers, AudioWorklet, etc.)
    thread_counts = defaultdict(int)
    for (pid, _tid), _name in tid_names.items():
        if pid in renderer_pids:
            thread_counts[pid] += 1
    if thread_counts:
        renderer_pid = max(thread_counts, key=thread_counts.get)
    elif renderer_pids:
        renderer_pid = renderer_pids[0]
    else:
        renderer_pid = None

    main_tid = None
    compositor_tid = None
    audio_worklet_tid = None
    worker_tids = []

    if renderer_pid:
        for (pid, tid), name in tid_names.items():
            if pid != renderer_pid:
                continue
            if name == "CrRendererMain":
                main_tid = tid
            elif name == "Compositor":
                compositor_tid = tid
            elif "AudioWorklet" in name:
                audio_worklet_tid = tid
            elif name == "DedicatedWorker thread":
                worker_tids.append(tid)

    return {
        "renderer_pid": renderer_pid,
        "main_tid": main_tid,
        "compositor_tid": compositor_tid,
        "audio_worklet_tid": audio_worklet_tid,
        "worker_tids": sorted(worker_tids),
        "gpu_pid": gpu_pid,
        "audio_service_pid": audio_service_pid,
    }


def analyze_thread_events(events, pid, tid, label="Thread"):
    """Analyze all X (complete) events on a specific thread."""
    thread_events = [
        e for e in events
        if e.get("pid") == pid and e.get("tid") == tid and e.get("ph") == "X"
    ]
    if not thread_events:
        return {"label": label, "event_count": 0, "total_dur_ms": 0, "top_names": []}

    total_dur = sum(e.get("dur", 0) for e in thread_events)
    name_stats = defaultdict(lambda: {"count": 0, "total": 0, "max": 0})
    for e in thread_events:
        n = e.get("name", "?")
        d = e.get("dur", 0)
        s = name_stats[n]
        s["count"] += 1
        s["total"] += d
        s["max"] = max(s["max"], d)

    top_names = sorted(name_stats.items(), key=lambda x: -x[1]["total"])[:15]

    return {
        "label": label,
        "event_count": len(thread_events),
        "total_dur_ms": round(total_dur / 1000, 1),
        "top_names": [
            {
                "name": n,
                "count": s["count"],
                "total_ms": round(s["total"] / 1000, 1),
                "max_ms": round(s["max"] / 1000, 2),
            }
            for n, s in top_names
        ],
    }


def analyze_long_tasks(events, pid, tid, threshold_us=50000):
    """Find tasks exceeding the threshold on a specific thread."""
    long = []
    for e in events:
        if (
            e.get("pid") == pid
            and e.get("tid") == tid
            and e.get("ph") == "X"
            and e.get("dur", 0) > threshold_us
        ):
            long.append(e)
    long.sort(key=lambda x: -x.get("dur", 0))
    return [
        {
            "dur_ms": round(e["dur"] / 1000, 1),
            "name": e.get("name", "?"),
            "cat": e.get("cat", "?"),
        }
        for e in long[:25]
    ]


def analyze_gc(events, pid, tids=None):
    """Analyze garbage collection events."""
    gc_events = []
    for e in events:
        if e.get("pid") != pid or e.get("ph") != "X":
            continue
        if tids and e.get("tid") not in tids:
            continue
        name = e.get("name", "")
        if "GC" in name or "gc" in e.get("cat", ""):
            gc_events.append(e)

    if not gc_events:
        return {"count": 0, "total_ms": 0, "by_thread": {}}

    by_thread = defaultdict(lambda: {"count": 0, "total": 0, "max": 0})
    for e in gc_events:
        tid = e.get("tid", 0)
        d = e.get("dur", 0)
        s = by_thread[tid]
        s["count"] += 1
        s["total"] += d
        s["max"] = max(s["max"], d)

    return {
        "count": len(gc_events),
        "total_ms": round(sum(e.get("dur", 0) for e in gc_events) / 1000, 1),
        "by_thread": {
            str(tid): {
                "count": s["count"],
                "total_ms": round(s["total"] / 1000, 1),
                "max_ms": round(s["max"] / 1000, 2),
            }
            for tid, s in by_thread.items()
        },
    }


def analyze_webgpu(events, gpu_pid):
    """Analyze WebGPU command patterns."""
    webgpu = sorted(
        [
            e for e in events
            if e.get("pid") == gpu_pid
            and e.get("ph") == "X"
            and "WebGPU" in e.get("name", "")
        ],
        key=lambda e: e["ts"],
    )
    if not webgpu:
        return {"count": 0}

    durs = [e["dur"] for e in webgpu]
    ts_list = [e["ts"] for e in webgpu]
    n = len(durs)
    dur_sorted = sorted(durs)

    # Detect bursts (gaps < 500us)
    gaps = [ts_list[i + 1] - ts_list[i] for i in range(len(ts_list) - 1)]
    burst_lens = []
    cur = 1
    for g in gaps:
        if g < 500:
            cur += 1
        else:
            if cur > 5:
                burst_lens.append(cur)
            cur = 1
    if cur > 5:
        burst_lens.append(cur)

    high_dur = [e for e in webgpu if e["dur"] > 5000]

    return {
        "count": len(webgpu),
        "time_span_s": round((ts_list[-1] - ts_list[0]) / 1e6, 1),
        "rate_per_s": round(len(webgpu) / max((ts_list[-1] - ts_list[0]) / 1e6, 0.001), 1),
        "total_ms": round(sum(durs) / 1000, 1),
        "percentiles": {
            "p50_us": dur_sorted[n // 2],
            "p90_us": dur_sorted[int(n * 0.9)],
            "p95_us": dur_sorted[int(n * 0.95)],
            "p99_us": dur_sorted[int(n * 0.99)],
            "max_us": dur_sorted[-1],
        },
        "histogram": {
            "lt_100us": sum(1 for d in durs if d < 100),
            "100_500us": sum(1 for d in durs if 100 <= d < 500),
            "500_1ms": sum(1 for d in durs if 500 <= d < 1000),
            "1_5ms": sum(1 for d in durs if 1000 <= d < 5000),
            "5_50ms": sum(1 for d in durs if 5000 <= d < 50000),
            "gt_50ms": sum(1 for d in durs if d >= 50000),
        },
        "burst_count": len(burst_lens),
        "burst_sizes": {
            "min": min(burst_lens) if burst_lens else 0,
            "max": max(burst_lens) if burst_lens else 0,
            "avg": round(statistics.mean(burst_lens), 1) if burst_lens else 0,
        },
        "high_dur_gt5ms": len(high_dur),
    }


def analyze_audioworklet(events, pid, tid):
    """Analyze AudioWorklet scheduling precision."""
    if tid is None:
        return {"note": "No AudioWorklet thread found"}

    runs = sorted(
        [
            e for e in events
            if e.get("pid") == pid
            and e.get("tid") == tid
            and e.get("ph") == "X"
            and e.get("name") == "ThreadControllerImpl::RunTask"
        ],
        key=lambda e: e["ts"],
    )
    if not runs:
        return {"count": 0}

    durs = [e["dur"] for e in runs]
    ts_list = [e["ts"] for e in runs]
    intervals = [ts_list[i + 1] - ts_list[i] for i in range(len(ts_list) - 1)]

    dur_sorted = sorted(durs)
    n = len(durs)

    # Expected interval for 128 samples @ 48kHz = 2667us
    expected_128 = 2666.67
    # Expected interval for 480 samples @ 48kHz = 10000us
    expected_480 = 10000.0

    avg_interval = statistics.mean(intervals) if intervals else 0
    # Auto-detect buffer size
    if avg_interval > 8000:
        expected = expected_480
        buffer_samples = round(avg_interval * 48)  # approximate
    else:
        expected = expected_128
        buffer_samples = 128

    jitter = [abs(i - expected) for i in intervals] if intervals else []

    return {
        "callback_count": len(runs),
        "estimated_buffer_samples": buffer_samples,
        "task_duration": {
            "avg_us": round(statistics.mean(durs)),
            "max_us": max(durs),
            "p99_us": dur_sorted[int(n * 0.99)] if n > 100 else dur_sorted[-1],
        },
        "interval": {
            "avg_us": round(statistics.mean(intervals)) if intervals else 0,
            "max_us": max(intervals) if intervals else 0,
            "stddev_us": round(statistics.stdev(intervals)) if len(intervals) > 1 else 0,
        },
        "jitter_vs_expected": {
            "expected_us": round(expected),
            "avg_us": round(statistics.mean(jitter)) if jitter else 0,
            "max_us": round(max(jitter)) if jitter else 0,
            "p99_us": round(sorted(jitter)[int(len(jitter) * 0.99)]) if len(jitter) > 100 else round(max(jitter)) if jitter else 0,
        },
        "late_callbacks_gt_expected_x1_5": sum(1 for i in intervals if i > expected * 1.5),
        "very_late_callbacks_gt_expected_x3": sum(1 for i in intervals if i > expected * 3),
    }


def analyze_worker_inference(events, pid, tid):
    """Analyze inference pattern on a specific worker."""
    js_calls = sorted(
        [
            e for e in events
            if e.get("pid") == pid
            and e.get("tid") == tid
            and e.get("ph") == "X"
            and e.get("name") == "v8.callFunction"
        ],
        key=lambda e: e["ts"],
    )
    if not js_calls:
        return {"js_calls": 0}

    durs = [e["dur"] for e in js_calls]
    ts_list = [e["ts"] for e in js_calls]
    intervals = [ts_list[i + 1] - ts_list[i] for i in range(len(ts_list) - 1)]

    return {
        "js_calls": len(js_calls),
        "duration_ms": {
            "avg": round(statistics.mean(durs) / 1000, 2),
            "max": round(max(durs) / 1000, 2),
            "total": round(sum(durs) / 1000, 1),
        },
        "interval_ms": {
            "avg": round(statistics.mean(intervals) / 1000, 1) if intervals else 0,
            "max": round(max(intervals) / 1000, 1) if intervals else 0,
            "p50": round(sorted(intervals)[len(intervals) // 2] / 1000, 1) if intervals else 0,
        },
    }


def analyze_message_passing(events, pid):
    """Analyze SerializedScriptValueFactory create/deserialize overhead."""
    create_by_tid = defaultdict(lambda: {"count": 0, "total": 0})
    deser_by_tid = defaultdict(lambda: {"count": 0, "total": 0})

    for e in events:
        if e.get("pid") != pid or e.get("ph") != "X":
            continue
        name = e.get("name", "")
        tid = e.get("tid", 0)
        dur = e.get("dur", 0)
        if "SerializedScriptValueFactory::create" in name:
            s = create_by_tid[tid]
            s["count"] += 1
            s["total"] += dur
        elif "SerializedScriptValueFactory::deserialize" in name:
            s = deser_by_tid[tid]
            s["count"] += 1
            s["total"] += dur

    all_tids = sorted(set(list(create_by_tid.keys()) + list(deser_by_tid.keys())))
    result = {}
    for tid in all_tids:
        c = create_by_tid[tid]
        d = deser_by_tid[tid]
        result[str(tid)] = {
            "serialize_ms": round(c["total"] / 1000, 1),
            "serialize_count": c["count"],
            "deserialize_ms": round(d["total"] / 1000, 1),
            "deserialize_count": d["count"],
        }
    return result


def analyze_wasm(events):
    """Find WASM-related events."""
    wasm = [
        e for e in events
        if e.get("ph") == "X" and "wasm" in str(e.get("args", {})).lower()
    ]
    wasm.sort(key=lambda x: -x.get("dur", 0))
    return [
        {
            "dur_ms": round(e.get("dur", 0) / 1000, 2),
            "name": e.get("name", "?"),
            "tid": e.get("tid"),
            "src_func": e.get("args", {}).get("src_func", "")[:80],
        }
        for e in wasm[:15]
    ]


def analyze_frames(events, pid, compositor_tid):
    """Analyze frame pacing from compositor draw events."""
    draws = sorted(
        [
            e for e in events
            if e.get("pid") == pid
            and e.get("tid") == compositor_tid
            and e.get("ph") == "X"
            and e.get("name") == "ProxyImpl::ScheduledActionDraw"
        ],
        key=lambda e: e["ts"],
    )
    if len(draws) < 2:
        return {"draw_count": len(draws)}

    ts_list = [e["ts"] for e in draws]
    intervals = [ts_list[i + 1] - ts_list[i] for i in range(len(ts_list) - 1)]
    avg_interval = statistics.mean(intervals)

    return {
        "draw_count": len(draws),
        "effective_fps": round(1e6 / avg_interval, 1) if avg_interval > 0 else 0,
        "interval_ms": {
            "avg": round(avg_interval / 1000, 1),
            "max": round(max(intervals) / 1000, 1),
            "min": round(min(intervals) / 1000, 1),
        },
        "janky_frames_gt_2x_avg": sum(1 for i in intervals if i > 2 * avg_interval),
        "total_frames": len(draws),
    }


def print_report(summary):
    """Print a human-readable report from the summary dict."""
    s = summary
    ids = s["thread_ids"]

    print("\n" + "=" * 75)
    print("BONCUKJS CHROME TRACE ANALYSIS REPORT")
    print("=" * 75)

    print(f"\nTrace duration: {s['trace_duration_s']:.1f}s  |  Events: {s['total_events']}")

    print("\n--- Process/Thread Map ---")
    print(f"  Renderer PID: {ids['renderer_pid']}")
    print(f"  Main Thread TID: {ids['main_tid']}")
    print(f"  Compositor TID: {ids['compositor_tid']}")
    print(f"  AudioWorklet TID: {ids['audio_worklet_tid']}")
    print(f"  Worker TIDs: {ids['worker_tids']}")
    print(f"  GPU Process PID: {ids['gpu_pid']}")

    print("\n--- Thread CPU Time ---")
    for info in s["thread_activity"]:
        print(f"  {info['label']:40s}: {info['total_dur_ms']:8.1f}ms")

    # Main thread
    mt = s["main_thread"]
    print(f"\n--- Main Thread ({mt['event_count']} events, {mt['total_dur_ms']}ms) ---")
    for item in mt["top_names"][:15]:
        print(f"  {item['total_ms']:8.1f}ms  {item['max_ms']:6.1f}ms max  {item['count']:6d}x  {item['name']}")

    # Long tasks
    lt = s["main_thread_long_tasks"]
    print(f"\n--- Main Thread Long Tasks (>50ms): {len(lt)} ---")
    for t in lt[:10]:
        print(f"  {t['dur_ms']:8.1f}ms  {t['name']}  cat={t['cat']}")

    # Workers
    for w in s["workers"]:
        label = w["label"]
        print(f"\n--- {label} ({w['event_count']} events, {w['total_dur_ms']}ms) ---")
        for item in w["top_names"][:8]:
            print(f"  {item['total_ms']:8.1f}ms  {item['max_ms']:6.1f}ms max  {item['count']:5d}x  {item['name']}")

    # GC
    gc = s["gc"]
    print(f"\n--- Garbage Collection: {gc['count']} events, {gc['total_ms']}ms ---")
    for tid_str, info in gc["by_thread"].items():
        print(f"  tid={tid_str}: {info['count']}x  {info['total_ms']}ms  max={info['max_ms']}ms")

    # WebGPU
    wg = s["webgpu"]
    print(f"\n--- WebGPU: {wg['count']} commands, {wg.get('total_ms', 0)}ms GPU time ---")
    if wg["count"] > 0:
        p = wg["percentiles"]
        print(f"  Rate: {wg['rate_per_s']}/s  Bursts: {wg['burst_count']}")
        print(f"  P50={p['p50_us']}us  P90={p['p90_us']}us  P95={p['p95_us']}us  P99={p['p99_us']}us  Max={p['max_us']}us")
        print(f"  Commands >5ms: {wg['high_dur_gt5ms']}")

    # AudioWorklet
    aw = s["audioworklet"]
    print(f"\n--- AudioWorklet ---")
    if aw.get("callback_count", 0) > 0:
        print(f"  Callbacks: {aw['callback_count']}  Buffer: ~{aw['estimated_buffer_samples']} samples")
        td = aw["task_duration"]
        print(f"  Task dur: avg={td['avg_us']}us  max={td['max_us']}us  P99={td['p99_us']}us")
        iv = aw["interval"]
        print(f"  Interval: avg={iv['avg_us']}us  max={iv['max_us']}us  stddev={iv['stddev_us']}us")
        j = aw["jitter_vs_expected"]
        print(f"  Jitter vs {j['expected_us']}us: avg={j['avg_us']}us  max={j['max_us']}us")
        print(f"  Late (>1.5x): {aw['late_callbacks_gt_expected_x1_5']}  Very late (>3x): {aw['very_late_callbacks_gt_expected_x3']}")

    # Frames
    fr = s["frames"]
    print(f"\n--- Rendering ---")
    print(f"  Draws: {fr['draw_count']}  FPS: {fr.get('effective_fps', '?')}")
    if "interval_ms" in fr:
        iv = fr["interval_ms"]
        print(f"  Frame interval: avg={iv['avg']}ms  max={iv['max']}ms  min={iv['min']}ms")
        print(f"  Janky frames: {fr['janky_frames_gt_2x_avg']}")

    # WASM
    print(f"\n--- WASM: {len(s['wasm'])} events ---")
    for w in s["wasm"][:5]:
        print(f"  {w['dur_ms']}ms  {w['name']}  {w['src_func']}")

    # Message passing
    print(f"\n--- Worker Message Passing ---")
    for tid_str, info in s["message_passing"].items():
        print(f"  tid={tid_str}: ser={info['serialize_ms']}ms({info['serialize_count']}x)  deser={info['deserialize_ms']}ms({info['deserialize_count']}x)")

    print("\n" + "=" * 75)
    print("END OF REPORT")
    print("=" * 75)


def main():
    # Determine trace file path
    if len(sys.argv) > 1:
        trace_path = sys.argv[1]
    else:
        script_dir = Path(__file__).parent
        trace_path = str(script_dir / "trace_boncuk-tracing.json")

    if not os.path.exists(trace_path):
        print(f"Error: Trace file not found: {trace_path}")
        sys.exit(1)

    events = load_trace(trace_path)
    pid_names, tid_names = build_maps(events)
    ids = identify_renderer(pid_names, tid_names)

    rpid = ids["renderer_pid"]
    mtid = ids["main_tid"]
    ctid = ids["compositor_tid"]
    awtid = ids["audio_worklet_tid"]
    wtids = ids["worker_tids"]
    gpid = ids["gpu_pid"]

    print(f"Renderer PID: {rpid}, Main TID: {mtid}, Workers: {wtids}, AudioWorklet: {awtid}, GPU: {gpid}")

    # Trace duration
    all_ts = [e.get("ts", 0) for e in events if e.get("ts", 0) > 0]
    trace_dur_s = (max(all_ts) - min(all_ts)) / 1e6 if all_ts else 0

    # Analyze each thread
    print("Analyzing main thread...")
    main_thread = analyze_thread_events(events, rpid, mtid, "Main Thread")
    main_long = analyze_long_tasks(events, rpid, mtid)

    print("Analyzing compositor...")
    compositor = analyze_thread_events(events, rpid, ctid, "Compositor")

    print("Analyzing workers...")
    workers = []
    worker_inference = {}
    for wt in wtids:
        label = f"Worker-{wt}"
        w = analyze_thread_events(events, rpid, wt, label)
        workers.append(w)
        wi = analyze_worker_inference(events, rpid, wt)
        worker_inference[str(wt)] = wi

    print("Analyzing GC...")
    all_tids = set(wtids) | {mtid, awtid} if awtid else set(wtids) | {mtid}
    gc = analyze_gc(events, rpid, all_tids)

    print("Analyzing WebGPU...")
    webgpu = analyze_webgpu(events, gpid) if gpid else {"count": 0}

    print("Analyzing AudioWorklet...")
    audioworklet = analyze_audioworklet(events, rpid, awtid)

    print("Analyzing frames...")
    frames = analyze_frames(events, rpid, ctid) if ctid else {"draw_count": 0}

    print("Analyzing WASM...")
    wasm = analyze_wasm(events)

    print("Analyzing message passing...")
    msg = analyze_message_passing(events, rpid)

    # Thread activity summary
    thread_activity = [main_thread, compositor] + workers
    if awtid:
        aw_thread = analyze_thread_events(events, rpid, awtid, "AudioWorklet")
        thread_activity.append(aw_thread)

    # Build summary
    summary = {
        "trace_file": os.path.basename(trace_path),
        "total_events": len(events),
        "trace_duration_s": round(trace_dur_s, 1),
        "thread_ids": ids,
        "process_names": {str(k): v for k, v in pid_names.items()},
        "thread_activity": [
            {"label": t["label"], "total_dur_ms": t["total_dur_ms"]}
            for t in sorted(thread_activity, key=lambda x: -x["total_dur_ms"])
        ],
        "main_thread": main_thread,
        "main_thread_long_tasks": main_long,
        "compositor": compositor,
        "workers": workers,
        "worker_inference": worker_inference,
        "gc": gc,
        "webgpu": webgpu,
        "audioworklet": audioworklet,
        "frames": frames,
        "wasm": wasm,
        "message_passing": msg,
    }

    # Print human-readable report
    print_report(summary)

    # Write JSON summary
    out_path = os.path.join(os.path.dirname(trace_path), "trace_analysis_summary.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"\nJSON summary written to: {out_path}")


if __name__ == "__main__":
    main()
