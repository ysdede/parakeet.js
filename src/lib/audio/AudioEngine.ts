import { AudioEngine as IAudioEngine, AudioEngineConfig, AudioSegment, IRingBuffer } from './types';
import { RingBuffer } from './RingBuffer';
import { EnergyVAD } from '../vad/EnergyVAD';

/**
 * AudioEngine implementation for capturing audio, buffering it, and performing basic VAD.
 */
export class AudioEngine implements IAudioEngine {
    private config: AudioEngineConfig;
    private ringBuffer: IRingBuffer;
    private energyVad: EnergyVAD;
    private deviceId: string | null = null;

    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;

    private currentEnergy: number = 0;
    private speechStartFrame: number = 0;
    private segmentEnergySum: number = 0;
    private segmentSampleCount: number = 0;

    private segmentCallbacks: Array<(segment: AudioSegment) => void> = [];

    constructor(config: Partial<AudioEngineConfig> = {}) {
        this.config = {
            sampleRate: 16000,
            bufferDuration: 120,
            energyThreshold: 0.02,
            minSpeechDuration: 100,
            minSilenceDuration: 300,
            ...config,
        };

        this.deviceId = this.config.deviceId || null;
        this.ringBuffer = new RingBuffer(this.config.sampleRate, this.config.bufferDuration);
        this.energyVad = new EnergyVAD({
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            minSilenceDuration: this.config.minSilenceDuration,
            sampleRate: this.config.sampleRate,
        });
    }

    async init(): Promise<void> {
        if (this.audioContext) {
            // If already initialized but changing device, stop tracks first
            this.mediaStream?.getTracks().forEach(t => t.stop());
        }

        // Request microphone permission with optional deviceId
        try {
            const constraints: MediaStreamConstraints = {
                audio: {
                    deviceId: this.deviceId ? { exact: this.deviceId } : undefined,
                    channelCount: 1,
                    sampleRate: this.config.sampleRate,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            };
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.error('Microphone access failed', error);
            throw new Error('Microphone access failed');
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContext({
                sampleRate: this.config.sampleRate,
            });
        }


        const processorCode = `
      class CaptureProcessor extends AudioWorkletProcessor {
        process(inputs, outputs) {
          const input = inputs[0];
          if (input && input[0]) {
            this.port.postMessage(input[0]);
          }
          return true;
        }
      }
      registerProcessor('capture-processor', CaptureProcessor);
    `;
        const blob = new Blob([processorCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(url);

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.workletNode = new AudioWorkletNode(this.audioContext, 'capture-processor');

        this.workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
            this.handleAudioChunk(event.data);
        };

        this.sourceNode.connect(this.workletNode);
    }

    async start(): Promise<void> {
        if (!this.audioContext) {
            await this.init();
        }

        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    stop(): void {
        if (this.audioContext?.state === 'running') {
            this.audioContext.suspend();
        }
    }

    getCurrentEnergy(): number {
        return this.currentEnergy;
    }

    isSpeechActive(): boolean {
        return this.currentEnergy > this.config.energyThreshold;
    }

    getRingBuffer(): IRingBuffer {
        return this.ringBuffer;
    }

    onSpeechSegment(callback: (segment: AudioSegment) => void): () => void {
        this.segmentCallbacks.push(callback);
        return () => {
            this.segmentCallbacks = this.segmentCallbacks.filter((cb) => cb !== callback);
        };
    }

    updateConfig(config: Partial<AudioEngineConfig>): void {
        this.config = { ...this.config, ...config };
        this.energyVad.updateConfig({
            energyThreshold: this.config.energyThreshold,
            minSpeechDuration: this.config.minSpeechDuration,
            minSilenceDuration: this.config.minSilenceDuration,
        });
    }

    async setDevice(deviceId: string): Promise<void> {
        this.deviceId = deviceId;
        await this.init();

        // Reconnect if running
        if (this.audioContext && this.workletNode) {
            this.sourceNode?.disconnect();
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream!);
            this.sourceNode.connect(this.workletNode);
        }
    }

    dispose(): void {
        this.stop();
        this.mediaStream?.getTracks().forEach(track => track.stop());
        this.audioContext?.close();
        this.audioContext = null;
        this.mediaStream = null;
        this.workletNode = null;
        this.sourceNode = null;
    }

    private handleAudioChunk(chunk: Float32Array): void {
        // 1. Process VAD
        const vadResult = this.energyVad.process(chunk);
        this.currentEnergy = vadResult.energy;

        // 2. Write to ring buffer
        const endFrame = this.ringBuffer.getCurrentFrame() + chunk.length;
        this.ringBuffer.write(chunk);

        // 3. Handle segments
        if (vadResult.speechStart) {
            this.speechStartFrame = endFrame - chunk.length;
            this.segmentEnergySum = vadResult.energy * chunk.length;
            this.segmentSampleCount = chunk.length;
        } else if (vadResult.isSpeech) {
            this.segmentEnergySum += vadResult.energy * chunk.length;
            this.segmentSampleCount += chunk.length;
        }

        if (vadResult.speechEnd) {
            const segment: AudioSegment = {
                startFrame: this.speechStartFrame,
                endFrame: endFrame - Math.ceil((this.energyVad.getConfig().minSilenceDuration / 1000) * this.config.sampleRate),
                duration: (endFrame - this.speechStartFrame) / this.config.sampleRate,
                averageEnergy: this.segmentEnergySum / this.segmentSampleCount,
                timestamp: Date.now(),
            };

            // Adjust endFrame to be more accurate (excluding the silence that triggered the end)
            const silenceFrames = Math.ceil((this.energyVad.getConfig().minSilenceDuration / 1000) * this.config.sampleRate);
            segment.endFrame = endFrame - silenceFrames;
            segment.duration = (segment.endFrame - segment.startFrame) / this.config.sampleRate;

            if (segment.duration > 0) {
                this.notifySegment(segment);
            }
        }
    }

    private notifySegment(segment: AudioSegment): void {
        this.segmentCallbacks.forEach((cb) => cb(segment));
    }
}
