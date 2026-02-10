import ijson, re, json, sys, traceback, time
p=r'N:\\github\\ysdede\\boncukjs\\metrics\\trace_boncuk-tracing.json'

start=time.time()
thread_name={}
process_name={}

try:
    with open(p,'rb') as f:
        for i,ev in enumerate(ijson.items(f, 'traceEvents.item')):
            if ev.get('ph')=='M':
                name=ev.get('name')
                pid=ev.get('pid')
                tid=ev.get('tid')
                args=ev.get('args') or {}
                if name=='thread_name' and tid is not None:
                    thread_name[(pid,tid)] = args.get('name')
                elif name=='process_name' and pid is not None:
                    process_name[pid] = args.get('name')
            if (i+1) % 1000000 == 0:
                print('meta pass events', i+1, 'elapsed', round(time.time()-start,1), 's', flush=True)
except Exception as e:
    print('meta pass error', e, flush=True)
    traceback.print_exc()
    sys.exit(1)

print('meta pass done', len(thread_name), 'threads', len(process_name), 'processes', flush=True)

# helpers

def tname(pid,tid):
    return thread_name.get((pid,tid), f'{pid}:{tid}')

def pname(pid):
    return process_name.get(pid, str(pid))

wasm_re=re.compile(r'wasm|webassembly', re.I)
webgpu_re=re.compile(r'webgpu|gpu', re.I)
audio_re=re.compile(r'audio', re.I)

by_name={}
by_cat={}
by_thread={}
long_16_count=0
long_50_count=0

import heapq
_top=[]
TOPN=50

main_threads=set()
for (pid,tid),name in thread_name.items():
    if name in ('CrRendererMain','RendererMain','MainThread','CrRendererMainThread'):
        main_threads.add((pid,tid))

main_total=0.0
main_long=[]
by_kind={'wasm':0.0,'webgpu':0.0,'audio':0.0,'js':0.0}

start=time.time()
try:
    with open(p,'rb') as f:
        for i,ev in enumerate(ijson.items(f, 'traceEvents.item')):
            if ev.get('ph')!='X':
                continue
            dur=ev.get('dur')
            if dur is None:
                continue
            dur_ms=dur/1000.0
            name=ev.get('name') or 'unknown'
            cat=ev.get('cat') or 'unknown'
            pid=ev.get('pid')
            tid=ev.get('tid')
            key=(pid,tid)

            by_name[name]=by_name.get(name,0.0)+dur_ms
            by_cat[cat]=by_cat.get(cat,0.0)+dur_ms
            by_thread[key]=by_thread.get(key,0.0)+dur_ms

            if dur_ms>=16.0:
                long_16_count+=1
            if dur_ms>=50.0:
                long_50_count+=1

            item=(dur_ms,name,cat,pid,tid)
            if len(_top)<TOPN:
                heapq.heappush(_top,item)
            else:
                if item[0]>_top[0][0]:
                    heapq.heapreplace(_top,item)

            if wasm_re.search(name) or wasm_re.search(cat):
                by_kind['wasm']+=dur_ms
            if webgpu_re.search(name) or webgpu_re.search(cat) or pname(pid)=='GPU Process':
                by_kind['webgpu']+=dur_ms
            if audio_re.search(name) or audio_re.search(cat) or 'Audio' in tname(pid,tid):
                by_kind['audio']+=dur_ms
            if name in ('RunTask','FunctionCall','EvaluateScript','TimerFire','V8.Execute','ExecuteScript') or ('v8' in (cat.lower() if isinstance(cat,str) else '')):
                by_kind['js']+=dur_ms

            if key in main_threads:
                main_total+=dur_ms
                if dur_ms>=16.0:
                    main_long.append((dur_ms,name,cat,pid,tid,ev.get('ts')))

            if (i+1) % 1000000 == 0:
                print('event pass items', i+1, 'elapsed', round(time.time()-start,1), 's', flush=True)
except Exception as e:
    print('event pass error', e, flush=True)
    traceback.print_exc()
    sys.exit(1)

# finalize

def top_n(d,n=15):
    return sorted(d.items(), key=lambda x:x[1], reverse=True)[:n]

summary={
    'top_names': top_n(by_name,15),
    'top_cats': top_n(by_cat,15),
    'top_threads': sorted([(tname(pid,tid), pname(pid), dur) for (pid,tid),dur in by_thread.items()], key=lambda x:x[2], reverse=True)[:10],
    'long_16_count': long_16_count,
    'long_50_count': long_50_count,
    'top_events': sorted(_top, key=lambda x:x[0], reverse=True)[:20],
    'kind_time_ms': by_kind,
    'main_total_ms': main_total,
    'main_long_tasks_top': sorted(main_long, key=lambda x:x[0], reverse=True)[:20],
}

out_path='metrics/trace_summary.json'
with open(out_path,'w',encoding='utf-8') as f:
    json.dump(summary,f,indent=2)

print('Wrote', out_path)
