// Simple WebGPU test for parakeet.js
import { getParakeetModel, ParakeetModel } from './src/index.js';
import * as fs from 'fs';

console.log('Testing WebGPU support...');

// Test 1: Check if WebGPU is available
console.log('1. WebGPU API available:', 'gpu' in navigator);

// Test 2: Check if ONNX Runtime can be imported
import { initOrt } from './src/backend.js';

async function testBackend() {
  try {
    console.log('2. Testing backend initialization...');
    const ort = await initOrt({ backend: 'webgpu' });
    console.log('✓ Backend initialized successfully');
    console.log('Available execution providers:', ort.env.availableExecutionProviders);
    
    // Test 3: Check if we can load model files from Hub
    console.log('3. Testing Hub integration...');
    const { getParakeetModel } = await import('./src/hub.js');
    
    const modelUrls = await getParakeetModel('istupakov/parakeet-tdt-0.6b-v2-onnx', { 
      quantization: 'int8',
      preprocessor: 'nemo128'
    });
    
    console.log('✓ Model URLs retrieved:', Object.keys(modelUrls));
    
    // Test 4: Try to create a model instance
    console.log('4. Testing model creation...');
    const { ParakeetModel } = await import('./src/parakeet.js');
    
    const model = await ParakeetModel.fromUrls({
      ...modelUrls,
      backend: 'webgpu'
    });
    
    console.log('✓ Model loaded successfully');
    console.log('Model ready for transcription!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackend(); 