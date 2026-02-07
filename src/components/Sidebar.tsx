import { Component, For, Show, createSignal } from 'solid-js';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  // Recording controls
  isRecording: boolean;
  onToggleRecording: () => void;
  // Model state
  isModelReady: boolean;
  onLoadModel: () => void;
  modelState: string;
  // Device selection
  availableDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onDeviceSelect: (id: string) => void;
  // Audio feedback
  audioLevel: number;
}

export const Sidebar: Component<SidebarProps> = (props) => {
  const [showDevices, setShowDevices] = createSignal(false);

  return (
    <aside class="w-20 min-w-[80px] bg-neu-bg flex flex-col items-center py-6 h-full border-r border-sidebar-border/30">
      {/* Power Button - Reflects System Readiness */}
      <div class="mb-8 relative">
        <button
          onClick={() => props.onLoadModel()}
          class="neu-circle-btn text-slate-600 transition-all active:scale-95"
          title={props.isModelReady ? "Model Loaded" : "Load Model"}
        >
          <span class="material-symbols-outlined text-xl">power_settings_new</span>
          <span class={`status-led ${props.isModelReady ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-300'}`}></span>
        </button>
      </div>

      <nav class="flex flex-col gap-6 items-center w-full px-2">
        {/* Record Button - Always enabled, recording works even before model is loaded */}
        <button
          onClick={() => props.onToggleRecording()}
          class={`neu-circle-btn transition-all active:scale-95 ${props.isRecording ? 'text-red-500 active' : 'text-slate-500'}`}
          title={props.isRecording ? "Stop Recording" : "Start Recording"}
        >
          <span class="material-symbols-outlined text-xl">mic</span>
        </button>

        <div class="w-8 h-[1px] bg-slate-300/60 my-2"></div>

        {/* Model Selection Icon */}
        <button
          onClick={() => props.onLoadModel()}
          class={`neu-square-btn transition-all active:scale-95 ${props.activeTab === 'ai' ? 'active' : 'text-slate-500'}`}
          title="AI Model Selection"
        >
          <span class="material-symbols-outlined text-xl">psychology</span>
        </button>

        {/* Device Selection Popover Trigger */}
        <div class="relative">
          <button
            class={`neu-square-btn transition-all active:scale-95 ${showDevices() ? 'active' : 'text-slate-500'}`}
            onClick={() => setShowDevices(!showDevices())}
            title="Audio Input Selection"
          >
            <span class="material-symbols-outlined text-xl">settings_input_composite</span>
          </button>

          {/* Device Selection Popover */}
          <Show when={showDevices()}>
            <div class="absolute left-full bottom-0 ml-6 w-64 nm-flat rounded-[32px] p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-200">
              <div class="text-[9px] font-black text-slate-400 p-2 uppercase tracking-widest mb-2 border-b border-slate-200">Mechanical_Input</div>
              <div class="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                <For each={props.availableDevices}>
                  {(device) => (
                    <button
                      class={`w-full text-left px-4 py-3 rounded-2xl text-xs transition-all flex items-center gap-3 ${props.selectedDeviceId === device.deviceId
                        ? 'nm-inset text-primary font-bold'
                        : 'text-slate-600 hover:nm-flat'
                        }`}
                      onClick={() => {
                        props.onDeviceSelect(device.deviceId);
                        setShowDevices(false);
                      }}
                    >
                      <span class="material-symbols-outlined text-lg opacity-40">mic</span>
                      <span class="truncate font-medium">{device.label || `Channel ${device.deviceId.slice(0, 4)}`}</span>
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* Placeholder Items matching design */}
        <button class="neu-square-btn text-slate-300 cursor-not-allowed" title="Translation (Pro)">
          <span class="material-symbols-outlined text-xl">translate</span>
        </button>

        <button class="neu-square-btn text-slate-500" title="Export Transcript" onClick={() => (window as any).appStore?.copyTranscript()}>
          <span class="material-symbols-outlined text-xl">download</span>
        </button>
      </nav>

      <div class="mt-auto">
        <button
          class={`neu-square-btn transition-all active:scale-95 ${props.activeTab === 'settings' ? 'active' : 'text-slate-500'}`}
          onClick={() => props.onTabChange('settings')}
          title="Settings"
        >
          <span class="material-symbols-outlined text-xl">settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


