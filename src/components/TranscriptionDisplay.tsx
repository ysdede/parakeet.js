import { Component, Show, createMemo, onMount, onCleanup } from 'solid-js';

export interface TranscriptionDisplayProps {
    confirmedText: string;
    pendingText: string;
    isRecording: boolean;
    lcsLength?: number;
    anchorValid?: boolean;
    showConfidence?: boolean;
    placeholder?: string;
    class?: string;
}

export const TranscriptionDisplay: Component<TranscriptionDisplayProps> = (props) => {
    let containerRef: HTMLDivElement | undefined;

    const scrollToBottom = () => {
        if (containerRef) {
            containerRef.scrollTop = containerRef.scrollHeight;
        }
    };

    const hasContent = createMemo(() =>
        (props.confirmedText?.length ?? 0) > 0 || (props.pendingText?.length ?? 0) > 0
    );

    let observer: MutationObserver | undefined;

    onMount(() => {
        if (containerRef) {
            observer = new MutationObserver(scrollToBottom);
            observer.observe(containerRef, { childList: true, subtree: true, characterData: true });
        }
    });

    onCleanup(() => {
        observer?.disconnect();
    });

    return (
        <div class={`flex flex-col h-full bg-transparent ${props.class ?? ''}`}>
            {/* Main transcript area */}
            <div
                ref={containerRef}
                class="flex-1 overflow-y-auto scroll-smooth"
            >
                <Show
                    when={hasContent()}
                    fallback={
                        <div class="flex flex-col items-center justify-center h-full opacity-40">
                            <span class="material-symbols-outlined text-6xl mb-4">graphic_eq</span>
                            <p class="text-xl italic font-medium">
                                {props.placeholder ?? 'Ready to transcribe...'}
                            </p>
                        </div>
                    }
                >
                    <div class="space-y-10 py-4">
                        {/* Primary Message Block */}
                        <div class="group">
                            <div class="flex items-center gap-3 mb-4">
                                <span class="px-2.5 py-1 bg-blue-50 text-primary rounded text-[11px] font-extrabold uppercase tracking-wider">Speaker</span>
                                <span class="text-xs text-slate-400 font-medium">Real-time Session</span>
                            </div>

                            <div class="pl-4 border-l-2 border-slate-100 group-hover:border-blue-100 transition-colors duration-300">
                                {/* Confirmed text */}
                                <p class="text-[18px] leading-relaxed text-slate-700 font-normal inline">
                                    {props.confirmedText}
                                </p>

                                {/* Pending text */}
                                <Show when={props.pendingText}>
                                    <p class="text-[18px] leading-relaxed text-primary/60 font-medium italic inline ml-1 transition-all duration-300">
                                        {props.pendingText}
                                        <span class="inline-block w-[2px] h-[18px] bg-primary align-middle ml-1 animate-pulse"></span>
                                    </p>
                                </Show>
                            </div>
                        </div>

                        {/* Listening indicator when idle but recording */}
                        <Show when={props.isRecording && !props.pendingText && !props.confirmedText}>
                            <div class="flex items-center gap-3">
                                <span class="px-2.5 py-1 bg-slate-900 text-white rounded text-[10px] font-extrabold uppercase tracking-widest">Live</span>
                                <div class="flex gap-1">
                                    <div class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                    <div class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>

            {/* Merge Stats / Legend (Floating style inside container) */}
            <Show when={props.showConfidence && props.isRecording && (props.lcsLength !== undefined)}>
                <div class="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-sm self-start px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    <div class="flex items-center gap-1.5">
                        <span class={`w-2 h-2 rounded-full ${props.anchorValid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span>LCS: {props.lcsLength}</span>
                    </div>
                    <div class="w-px h-3 bg-slate-200"></div>
                    <div class="flex items-center gap-1.5 grayscale opacity-60">
                        <span class="material-symbols-outlined text-xs">merging_cells</span>
                        <span>PTFA Merged</span>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default TranscriptionDisplay;

