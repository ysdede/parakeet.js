import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAppStore } from './appStore';
import { createRoot } from 'solid-js';

describe('appStore', () => {
  let store: ReturnType<typeof createAppStore>;
  let dispose: () => void;

  beforeEach(() => {
    // Run inside createRoot to support onCleanup and signal tracking
    dispose = createRoot((d) => {
      store = createAppStore();
      return d;
    });
  });

  afterEach(() => {
    dispose();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have initial values', () => {
      expect(store.recordingState()).toBe('idle');
      expect(store.sessionDuration()).toBe(0);
      expect(store.transcript()).toBe('');
      expect(store.isOfflineReady()).toBe(false);
      expect(store.isOnline()).toBeDefined();
    });
  });

  describe('Recording Logic', () => {
    it('should start recording', () => {
      vi.useFakeTimers();
      store.startRecording();
      expect(store.recordingState()).toBe('recording');
      expect(store.sessionDuration()).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(store.sessionDuration()).toBe(1);

      vi.advanceTimersByTime(5000);
      expect(store.sessionDuration()).toBe(6);

      vi.useRealTimers();
    });

    it('should stop recording', () => {
      vi.useFakeTimers();
      store.startRecording();
      vi.advanceTimersByTime(2000);
      expect(store.recordingState()).toBe('recording');

      store.stopRecording();
      expect(store.recordingState()).toBe('idle');

      // Timer should stop
      const duration = store.sessionDuration();
      vi.advanceTimersByTime(2000);
      expect(store.sessionDuration()).toBe(duration);

      vi.useRealTimers();
    });
  });

  describe('Device Management', () => {
    it('should refresh devices', async () => {
      const mockDevices = [
        { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone 1' },
        { kind: 'videoinput', deviceId: 'cam1', label: 'Camera 1' },
      ];

      // Mock navigator.mediaDevices.enumerateDevices
      const enumerateDevicesMock = vi.fn().mockResolvedValue(mockDevices);

      // Handle potentially missing mediaDevices in test env
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, 'mediaDevices', {
            value: {},
            writable: true
        });
      }

      Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
        value: enumerateDevicesMock,
        writable: true
      });

      await store.refreshDevices();

      expect(enumerateDevicesMock).toHaveBeenCalled();
      expect(store.availableDevices()).toHaveLength(1);
      expect(store.availableDevices()[0].deviceId).toBe('mic1');
      expect(store.selectedDeviceId()).toBe('mic1');
    });

    it('should handle errors when refreshing devices', async () => {
       const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
       const enumerateDevicesMock = vi.fn().mockRejectedValue(new Error('Permission denied'));

        if (!navigator.mediaDevices) {
            Object.defineProperty(navigator, 'mediaDevices', {
                value: {},
                writable: true
            });
        }

       Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
        value: enumerateDevicesMock,
        writable: true
      });

      await store.refreshDevices();
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Transcript Management', () => {
    it('should append transcript', () => {
      store.appendTranscript('Hello ');
      expect(store.transcript()).toBe('Hello ');

      store.setPendingText('world');
      store.appendTranscript('world.');
      expect(store.transcript()).toBe('Hello world.');
      expect(store.pendingText()).toBe('');
    });

    it('should clear transcript', () => {
      store.setTranscript('Some text');
      store.setPendingText('Pending');
      store.clearTranscript();
      expect(store.transcript()).toBe('');
      expect(store.pendingText()).toBe('');
    });

    it('should copy transcript', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);

      if (!navigator.clipboard) {
         Object.defineProperty(navigator, 'clipboard', {
            value: {},
            writable: true
        });
      }

      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: writeTextMock,
        writable: true
      });

      store.setTranscript('Copy me');
      const result = await store.copyTranscript();

      expect(writeTextMock).toHaveBeenCalledWith('Copy me');
      expect(result).toBe(true);
    });

     it('should handle copy failure', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));

       if (!navigator.clipboard) {
         Object.defineProperty(navigator, 'clipboard', {
            value: {},
            writable: true
        });
      }

      Object.defineProperty(navigator.clipboard, 'writeText', {
        value: writeTextMock,
        writable: true
      });

      const result = await store.copyTranscript();
      expect(result).toBe(false);
    });
  });

  describe('Online/Offline Status', () => {
    it('should update online status on window events', () => {
      // Simulate offline
      window.dispatchEvent(new Event('offline'));
      expect(store.isOnline()).toBe(false);

      // Simulate online
      window.dispatchEvent(new Event('online'));
      expect(store.isOnline()).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should calculate inference latency average', () => {
       // LATENCY_SAMPLE_SIZE = 5
       store.setInferenceLatency(10);
       expect(store.inferenceLatencyAverage()).toBe(10);

       store.setInferenceLatency(20);
       // (10+20)/2 = 15
       expect(store.inferenceLatencyAverage()).toBe(15);

       store.setInferenceLatency(30);
       store.setInferenceLatency(40);
       store.setInferenceLatency(50);
       // (10+20+30+40+50)/5 = 30
       expect(store.inferenceLatencyAverage()).toBe(30);

       store.setInferenceLatency(60);
       // window slides: (20+30+40+50+60)/5 = 40
       expect(store.inferenceLatencyAverage()).toBe(40);
    });

    it('should calculate RTF average', () => {
        // RTF_SAMPLE_SIZE = 10
        // Formula: s.reduce((sum, r) => sum + 1 / r, 0) / s.length;

        store.setRtf(1); // 1/1 = 1
        expect(store.rtfxAverage()).toBe(1);

        store.setRtf(0.5); // 1/0.5 = 2. (1+2)/2 = 1.5
        expect(store.rtfxAverage()).toBe(1.5);
    });
  });
});
