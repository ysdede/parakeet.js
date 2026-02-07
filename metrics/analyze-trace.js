import fs from 'fs';
import path from 'path';

const TRACE_FILE = 'N:\\github\\ysdede\\boncukjs\\metrics\\trace_boncuk-tracing.json';

try {
    console.log('Reading trace file...');
    const data = fs.readFileSync(TRACE_FILE, 'utf8');
    console.log('Parsing JSON...');
    let trace;
    try {
        trace = JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse JSON:', e);
        process.exit(1);
    }

    const events = trace.traceEvents || trace;
    console.log(`Total events: ${events.length}`);

    // 1. Identify Threads
    const threadNames = {};
    events.forEach(e => {
        if (e.name === 'thread_name' && e.ph === 'M') {
            const key = `${e.pid}:${e.tid}`;
            threadNames[key] = e.args.name;
        }
    });

    // 2. Group events by thread
    const threadEvents = {};
    events.forEach(e => {
        if (!e.pid || !e.tid) return;
        const key = `${e.pid}:${e.tid}`;
        if (!threadEvents[key]) threadEvents[key] = [];
        threadEvents[key].push(e);
    });

    // 3. Analyze Threads
    console.log('\n--- Thread Analysis ---');

    // Sort threads by total active time (rough heuristic)
    const threadStats = Object.keys(threadEvents).map(key => {
        const evts = threadEvents[key];
        const durationEvents = evts.filter(e => typeof e.dur === 'number');
        const totalDur = durationEvents.reduce((acc, e) => acc + e.dur, 0); // microseconds

        // Attempt to guess thread name if not in metadata
        let name = threadNames[key];
        if (!name) {
            if (evts.some(e => e.name === 'CrRendererMain')) name = 'CrRendererMain';
            else if (evts.some(e => e.name === 'AudioWorkletThread')) name = 'AudioWorkletThread';
            else if (evts.some(e => e.name === 'Compositor')) name = 'Compositor';
            else name = 'Unknown';
        }

        return { key, name, evts, durationEvents, totalDur };
    }).sort((a, b) => b.totalDur - a.totalDur);

    threadStats.forEach(({ key, name, evts, durationEvents, totalDur }) => {
        if (totalDur < 100000) return; // Skip idle threads (<100ms total activity)

        console.log(`\nThread ${key} (${name}):`);
        console.log(`  Total Active Time: ${(totalDur / 1000).toFixed(2)}ms`); // dur is microseconds
        console.log(`  Event Count: ${evts.length}`);

        // Detect Long Tasks (>50ms)
        const longTasks = durationEvents
            .filter(e => e.dur > 50000)
            .sort((a, b) => b.dur - a.dur);

        if (longTasks.length > 0) {
            console.log(`  Long Tasks (>50ms): ${longTasks.length}`);
            longTasks.slice(0, 5).forEach(t => {
                console.log(`    - [${t.cat}] ${t.name}: ${(t.dur / 1000).toFixed(2)}ms`);
            });
        }

        // WASM Analysis
        const wasmEvents = evts.filter(e => (e.cat && e.cat.includes('wasm')) || (e.name && e.name.toLowerCase().includes('wasm')));
        if (wasmEvents.length > 0) {
            console.log(`  WASM Events: ${wasmEvents.length}`);
            // specific WASM functions often in 'args'
        }

        // Audio Analysis
        const audioEvents = evts.filter(e => (e.cat && e.cat.includes('audio')) || (e.name && e.name.toLowerCase().includes('audio')));
        if (audioEvents.length > 0) {
            console.log(`  Audio Events: ${audioEvents.length}`);
        }

        // JS Execution (V8)
        const v8Events = evts.filter(e => e.cat === 'v8' || e.name === 'V8.Execute');
        if (v8Events.length > 0) {
            const v8Time = v8Events.reduce((acc, e) => acc + (e.dur || 0), 0);
            console.log(`  V8 Execution Time: ${(v8Time / 1000).toFixed(2)}ms`);
        }

        // User Timing
        const userTiming = evts.filter(e => e.cat === 'blink.user_timing' || e.cat === 'blink.console');
        if (userTiming.length > 0) {
            console.log(`  User Timing/Console Marks: ${userTiming.length}`);
        }
    });

} catch (err) {
    console.error('Error processing trace:', err);
}
