import { ParakeetModel } from '../src/parakeet.js';

async function main() {
  console.log('Testing transpose loop correctness');

  // Create a minimal mock of parakeet model to test just the transpose branch
  const model = new ParakeetModel({
    tokenizer: {
      id2token: ['[blank]', 'a', 'b'],
      blankToken: '[blank]',
      blankId: 0,
      decode: (ids) => ids.join(''),
    },
    encoderSession: {
      run: async ({ audio_signal, length }) => {
        // Mock encoder output [B, D, T] -> [1, 2, 3]
        const data = new Float32Array([10, 20, 30, 40, 50, 60]); // 2 features, 3 time steps
        return {
          outputs: {
            dims: [1, 2, 3],
            data: data,
            dispose: () => {}
          }
        };
      }
    },
    joinerSession: {
      run: async () => {
        // Dummy outputs just to make the decode loop stop
        const data = new Float32Array(3); // 3 tokens, no dur logits
        data[0] = 10; // blank has highest probability
        return {
          outputs: {
            data: data,
            dispose: () => {}
          },
          output_states_1: null,
          output_states_2: null
        };
      }
    },
    preprocessor: {
      process: async () => {
        return { features: new Float32Array([1, 2]), length: 1 };
      }
    },
    ort: {
      Tensor: class {
        constructor(type, data, dims) {
          this.type = type;
          this.data = data;
          this.dims = dims;
        }
        dispose() {}
      }
    },
    nMels: 128
  });

  // Mock `_runCombinedStep` to capture the `encTensor` passed, which should be the transposed slice
  const originalRunCombinedStep = model._runCombinedStep.bind(model);
  let capturedEncTensors = [];
  model._runCombinedStep = async (encTensor, token, currentState) => {
    // copy the current state of the buffer
    capturedEncTensors.push(new Float32Array(model._encoderFrameBuffer));
    return await originalRunCombinedStep(encTensor, token, currentState);
  };

  await model.transcribe(new Float32Array(16000), 16000, { returnTimestamps: false, returnConfidences: false });

  // Let's verify what frames were passed
  // Encoder output [1, D=2, T=3] was: [10, 20, 30, 40, 50, 60]
  // In `[D, T]`, the layout is:
  // D0: [10, 20, 30]
  // D1: [40, 50, 60]
  //
  // Transposed to `[T, D]`, the frames should be:
  // T0: [10, 40]
  // T1: [20, 50]
  // T2: [30, 60]

  console.log('Captured Frames:', capturedEncTensors);

  if (capturedEncTensors.length !== 3) {
    throw new Error('Expected 3 frames');
  }

  if (capturedEncTensors[0][0] !== 10 || capturedEncTensors[0][1] !== 40) {
    throw new Error('T0 is incorrect');
  }
  if (capturedEncTensors[1][0] !== 20 || capturedEncTensors[1][1] !== 50) {
    throw new Error('T1 is incorrect');
  }
  if (capturedEncTensors[2][0] !== 30 || capturedEncTensors[2][1] !== 60) {
    throw new Error('T2 is incorrect');
  }

  console.log('Transpose correctness verified.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
