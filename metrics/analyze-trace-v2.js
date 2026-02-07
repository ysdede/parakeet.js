import fs from 'fs';
import path from 'path';

const TRACE_FILE = 'N:\\github\\ysdede\\boncukjs\\metrics\\trace_boncuk-tracing.json';

try {
    const data = fs.readFileSync(TRACE_FILE, 'utf8');
    let trace;
    try { trace = JSON.parse(data); }
    catch (e) { process.exit(1); }

    const events = trace.traceEvents || trace;

    // Clean events
    const cleanedEvents = events.filter(e => e.ts !== undefined);
    if (cleanedEvents.length === 0) { console.log("No events with timestamp"); process.exit(0); }

    cleanedEvents.sort((a, b) => a.ts - b.ts);

    const startTime = cleanedEvents[0].ts;
    const endTime = cleanedEvents[cleanedEvents.length - 1].ts;
    const traceDurationMs = (endTime - startTime) / 1000;

    console.log(`Trace Duration: ${traceDurationMs.toFixed(2)}ms (${(traceDurationMs / 1000).toFixed(2)}s)`);

    // Group by thread
    const threads = {};
    const threadNames = {};

    cleanedEvents.forEach(e => {
        if (e.name === 'thread_name' && e.ph === 'M') {
            threadNames[`${e.pid}:${e.tid}`] = e.args.name;
        }
        if (e.pid && e.tid) {
            const key = `${e.pid}:${e.tid}`;
            if (!threads[key]) threads[key] = [];
            threads[key].push(e);
        }
    });

    console.log('\n--- Deep Dive Analysis ---');

    // 1. AudioWorklet Stability
    // Find AudioWorklet thread
    const audioThreadKey = Object.keys(threadNames).find(k => threadNames[k].includes('AudioWorklet')) ||
        Object.keys(threads).find(k => threads[k].some(e => e.name === 'AudioWorkletProcessor::process'));

    if (audioThreadKey) {
        console.log(`\n[AudioWorklet Analysis] Thread ${audioThreadKey} (${threadNames[audioThreadKey] || 'Guessed'})`);
        const threadEvts = threads[audioThreadKey];

        // Look for process calls
        // Note: Trace events for 'process' might vary. 'AudioWorkletProcessor::process' is common.
        const processEvents = threadEvts.filter(e => e.name.includes('process') || (e.args && e.args.name && e.args.name.includes('process')));

        if (processEvents.length > 1) {
            console.log(`  Process Calls: ${processEvents.length}`);
            let intervals = [];
            for (let i = 1; i < processEvents.length; i++) {
                intervals.push((processEvents[i].ts - processEvents[i - 1].ts) / 1000);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const maxInterval = Math.max(...intervals);
            const minInterval = Math.min(...intervals);

            console.log(`  Avg Interval: ${avgInterval.toFixed(3)}ms`);
            console.log(`  Min Interval: ${minInterval.toFixed(3)}ms`);
            console.log(`  Max Interval: ${maxInterval.toFixed(3)}ms`);

            // Glitch detection (e.g. > 1.5x avg)
            const glitches = intervals.filter(i => i > avgInterval * 1.5 && i > 5); // > 5ms to avoid noise
            console.log(`  Potential Glitches (>1.5x avg): ${glitches.length}`);
            if (glitches.length > 0) {
                console.log(`  Top 5 Glitch Intervals: ${glitches.sort((a, b) => b - a).slice(0, 5).map(i => i.toFixed(2) + 'ms').join(', ')}`);
            }
        } else {
            console.log("  No 'process' events found in AudioWorklet thread.");
            // List top event names
            const names = {};
            threadEvts.forEach(e => names[e.name] = (names[e.name] || 0) + 1);
            console.log("  Top events: ", Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 5));
        }
    } else {
        console.log("\n[AudioWorklet Analysis] No AudioWorklet thread identified.");
    }

    // 2. ThreadPool Long Tasks Details
    console.log('\n[Background Worker Long Tasks]');
    Object.keys(threads).forEach(key => {
        const name = threadNames[key] || 'Unknown';
        if (name.includes('ThreadPool') || name.includes('Worker')) {
            const evts = threads[key].filter(e => e.dur && e.dur > 50000); // > 50ms
            evts.forEach(e => {
                console.log(`  ${name} (${key}): ${e.name} took ${(e.dur / 1000).toFixed(2)}ms`);
                if (e.args) console.log(`    Args: ${JSON.stringify(e.args).slice(0, 100)}...`);
            });
        }
    });

    // 3. WebGPU Usage
    const allEvents = cleanedEvents;
    const gpuEvents = allEvents.filter(e => e.cat && (e.cat.includes('gpu') || e.name.includes('Device') || e.name.includes('Queue')));
    if (gpuEvents.length > 0) {
        console.log(`\n[WebGPU/GPU Activity] ${gpuEvents.length} events`);
        // check for long GPU tasks
    }

} catch (err) {
    console.error(err);
}
