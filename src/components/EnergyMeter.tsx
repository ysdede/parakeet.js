import { Component, createSignal, createEffect, onCleanup } from 'solid-js';
import { AudioEngine } from '../lib/audio/types';
import { appStore } from '../stores/appStore';

interface EnergyMeterProps {
    audioEngine?: AudioEngine;
}

export const EnergyMeter: Component<EnergyMeterProps> = (props) => {
    const [energy, setEnergy] = createSignal(0);
    const [metrics, setMetrics] = createSignal({ noiseFloor: 0, snr: 0, threshold: 0.02, snrThreshold: 3.0 });
    const [isSpeaking, setIsSpeaking] = createSignal(false);

    const updateFromEngine = (engine: AudioEngine) => {
        const currentE = engine.getCurrentEnergy();
        const currentM = engine.getSignalMetrics();

        setEnergy(currentE);
        setMetrics(currentM);
        // Check if speaking based on SNR threshold (matching VAD logic)
        setIsSpeaking(currentM.snr > currentM.snrThreshold || currentE > currentM.threshold);
    };

    createEffect(() => {
        const engine = props.audioEngine;
        if (!engine) return;

        updateFromEngine(engine);
        const unsubscribe = engine.onVisualizationUpdate(() => {
            updateFromEngine(engine);
        });

        onCleanup(() => unsubscribe());
    });

    // Logarithmic scaling for better visualization
    const toPercent = (val: number) => {
        // e.g. mapping 0.0001 -> 1.0 to 0% -> 100% log scale
        // log10(0.0001) = -4, log10(1) = 0
        const minLog = -4;
        const maxLog = 0;
        const v = Math.max(0.0001, val);
        const log = Math.log10(v);
        return Math.max(0, Math.min(100, ((log - minLog) / (maxLog - minLog)) * 100));
    };

    return (
        <div class="flex flex-col gap-4 p-5 nm-inset rounded-3xl bg-slate-500/5 transition-all">
            <div class="flex items-center justify-between px-1">
                <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Signal_Analysis</h3>
                {/* Speaking indicator - Neumorphic LED style */}
                <div class={`flex items-center gap-2 px-3 py-1 rounded-full nm-flat transition-all ${isSpeaking()
                        ? 'text-emerald-500'
                        : 'text-slate-500 opacity-60'
                    }`}>
                    <div class={`w-1.5 h-1.5 rounded-full ${isSpeaking() ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-400'}`} />
                    <span class="text-[9px] font-black tracking-widest">
                        {isSpeaking() ? 'SPEECH' : 'SILENCE'}
                    </span>
                </div>
            </div>

            {/* Energy Bar */}
            <div class="relative w-full h-3 nm-inset bg-slate-900/10 rounded-full overflow-hidden p-0.5">
                {/* Energy Fill - color based on speech state */}
                <div
                    class={`h-full rounded-full transition-all duration-75 ${isSpeaking() ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                        }`}
                    style={{ width: `${toPercent(energy())}%` }}
                />

                {/* Noise Floor Marker */}
                <div
                    class="absolute top-0 bottom-0 w-0.5 bg-amber-500 opacity-50 z-20"
                    style={{ left: `${toPercent(metrics().noiseFloor)}%` }}
                />

                {/* Energy Threshold Marker */}
                <div
                    class="absolute top-0 bottom-0 w-px bg-red-500 z-30"
                    style={{ left: `${toPercent(metrics().threshold)}%` }}
                />
            </div>

            <div class="grid grid-cols-3 items-center px-1">
                <div class="flex flex-col">
                    <span class="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Noise</span>
                    <span class="text-[10px] font-bold text-slate-400">{metrics().noiseFloor.toFixed(5)}</span>
                </div>
                <div class="flex flex-col items-center">
                    <span class="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Energy</span>
                    <span class="text-[10px] font-bold text-slate-400">{energy().toFixed(4)}</span>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-[8px] font-black text-slate-500 uppercase tracking-tighter">SNR_Ratio</span>
                    <span class={`text-[10px] font-black ${metrics().snr > metrics().snrThreshold ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {metrics().snr.toFixed(1)} dB
                    </span>
                </div>
            </div>
        </div>
    );
};
