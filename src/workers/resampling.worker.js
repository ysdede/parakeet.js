/* eslint-disable no-restricted-globals */

// Resampling function
function resample(audio, from, to) {
  if (from === to) {
    return audio;
  }

  const ratio = to / from;
  const newLength = Math.round(audio.length * ratio);
  const newAudio = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const t = i / ratio;
    const t0 = Math.floor(t);
    const t1 = Math.ceil(t);
    const dt = t - t0;

    if (t1 >= audio.length) {
      newAudio[i] = audio[t0];
    } else {
      newAudio[i] = (1 - dt) * audio[t0] + dt * audio[t1];
    }
  }

  return newAudio;
}

self.onmessage = async (e) => {
  const { type, data } = e.data || {};

  switch (type) {
    case 'resample': {
      try {
        const { audio, from, to } = data;
        const resampledAudio = resample(audio, from, to);
        
        // Transfer the buffer back to avoid copying
        self.postMessage({ 
          type: 'resample_complete', 
          data: { 
            audio: resampledAudio,
            originalLength: audio.length,
            resampledLength: resampledAudio.length
          } 
        }, [resampledAudio.buffer]);
      } catch (err) {
        self.postMessage({ type: 'error', data: { message: err.message } });
      }
      break;
    }
  }
};