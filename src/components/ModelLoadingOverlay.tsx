import { Component, Show, For } from 'solid-js';

interface ModelLoadingOverlayProps {
    isVisible: boolean;
    progress: number;
    message: string;
    file?: string;
    backend: 'webgpu' | 'wasm';
    state: 'unloaded' | 'loading' | 'ready' | 'error';
    selectedModelId: string;
    onModelSelect: (id: string) => void;
    onStart: () => void;
    onLocalLoad: (files: FileList) => void;
    onClose?: () => void;
}

const MODELS = [
    { id: 'parakeet-tdt-0.6b-v2', name: 'Parakeet v2', desc: 'English optimized' },
    { id: 'parakeet-tdt-0.6b-v3', name: 'Parakeet v3', desc: 'Multilingual Streaming' },
];

export const ModelLoadingOverlay: Component<ModelLoadingOverlayProps> = (props) => {
    const progressWidth = () => `${Math.max(0, Math.min(100, props.progress))}%`;
    let fileInput: HTMLInputElement | undefined;

    const handleFileChange = (e: Event) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
            props.onLocalLoad(files);
        }
    };

    return (
        <Show when={props.isVisible}>
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
                <input
                    type="file"
                    multiple
                    ref={fileInput}
                    class="hidden"
                    onChange={handleFileChange}
                />

                <div class="w-full max-w-lg mx-4">
                    <div class="relative nm-flat rounded-[40px] overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                        {/* Close Button */}
                        <Show when={props.onClose && props.state === 'unloaded'}>
                            <button
                                onClick={() => props.onClose?.()}
                                class="absolute top-8 right-8 neu-square-btn text-slate-400 hover:text-red-500 transition-all z-10"
                            >
                                <span class="material-symbols-outlined text-xl">close</span>
                            </button>
                        </Show>

                        {/* Header */}
                        <div class="p-10 pb-6 text-center">
                            <div class="w-20 h-20 mx-auto mb-8 rounded-[32px] nm-inset flex items-center justify-center">
                                <Show
                                    when={props.state !== 'error'}
                                    fallback={<span class="material-symbols-outlined text-red-500 text-4xl">warning</span>}
                                >
                                    <span class={`material-symbols-outlined text-primary text-4xl ${props.state === 'loading' ? 'animate-pulse' : ''}`}>
                                        {props.state === 'loading' ? 'downloading' : 'neurology'}
                                    </span>
                                </Show>
                            </div>

                            <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">
                                {props.state === 'unloaded' ? 'Engine Selection' :
                                    props.state === 'error' ? 'Loading Failed' : 'Model Installation'}
                            </h2>

                            <p class="text-sm text-slate-500 font-medium mt-3 px-10">
                                {props.state === 'unloaded' ? 'Select the AI engine for this transcription session.' : props.message}
                            </p>
                        </div>

                        {/* Content */}
                        <div class="px-10 pb-10">
                            <Show when={props.state === 'unloaded'}>
                                <div class="space-y-4">
                                    <div class="grid gap-4">
                                        <For each={MODELS}>
                                            {(model) => (
                                                <button
                                                    onClick={() => props.onModelSelect(model.id)}
                                                    class={`flex items-center text-left p-6 rounded-3xl transition-all ${props.selectedModelId === model.id
                                                        ? 'nm-inset text-primary ring-2 ring-primary/10'
                                                        : 'nm-flat text-slate-600 hover:shadow-neu-btn-hover'
                                                        }`}
                                                >
                                                    <div class={`w-6 h-6 rounded-full nm-inset mr-5 flex flex-none items-center justify-center ${props.selectedModelId === model.id ? 'text-primary' : 'text-slate-300'
                                                        }`}>
                                                        <Show when={props.selectedModelId === model.id}>
                                                            <div class="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]" />
                                                        </Show>
                                                    </div>
                                                    <div>
                                                        <div class="font-bold text-lg leading-tight">{model.name}</div>
                                                        <div class="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">{model.desc}</div>
                                                    </div>
                                                </button>
                                            )}
                                        </For>

                                        <button
                                            onClick={() => fileInput?.click()}
                                            class="flex items-center text-left p-6 rounded-3xl nm-flat opacity-70 hover:opacity-100 transition-all hover:shadow-neu-btn-hover"
                                        >
                                            <div class="w-10 h-10 rounded-2xl nm-inset flex items-center justify-center mr-5">
                                                <span class="material-symbols-outlined text-slate-400 text-xl">file_open</span>
                                            </div>
                                            <div>
                                                <div class="font-bold text-lg leading-tight">Local Model</div>
                                                <div class="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">Load from disk</div>
                                            </div>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => props.onStart()}
                                        class="w-full mt-6 py-5 bg-primary text-white font-extrabold rounded-3xl shadow-xl active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                                    >
                                        Initialize AI Engine
                                    </button>
                                </div>
                            </Show>

                            {/* Progress */}
                            <Show when={props.state === 'loading'}>
                                <div class="mt-4">
                                    <div class="h-4 nm-inset rounded-full overflow-hidden p-1">
                                        <div
                                            class="h-full bg-primary rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_var(--color-primary)]"
                                            style={{ width: progressWidth() }}
                                        />
                                    </div>

                                    <div class="flex justify-between items-center mt-6 px-1">
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Downloaded</span>
                                            <span class="text-primary font-black text-2xl">{props.progress}%</span>
                                        </div>
                                        <div class="flex flex-col text-right">
                                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active File</span>
                                            <span class="text-slate-500 font-bold text-[11px] truncate max-w-[200px]">
                                                {props.file || 'Preparing assets...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Show>

                            <Show when={props.state === 'error'}>
                                <div>
                                    <button
                                        onClick={() => props.onStart()}
                                        class="w-full py-5 nm-flat text-red-500 font-black rounded-3xl shadow-none hover:text-red-600 transition-all"
                                    >
                                        Retry Connection
                                    </button>
                                </div>
                            </Show>
                        </div>

                        {/* Footer */}
                        <div class="px-10 py-6 border-t border-slate-100 flex items-center justify-between opacity-80">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-base text-slate-400">offline_bolt</span>
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {props.backend === 'webgpu' ? 'GPU Accelerated' : 'WASM Native'}
                                </span>
                            </div>
                            <span class="text-[10px] text-slate-300 font-black tracking-widest">
                                PRIVACY SECURED
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Show>
    );
};


