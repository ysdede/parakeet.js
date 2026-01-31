/**
 * Test script for FLEURS dataset API
 * Run with: node tests/test_fleurs_api.mjs
 */

// First, let's discover the dataset structure
async function discoverDataset() {
  console.log('=== Discovering FLEURS Dataset Structure ===\n');
  
  // Get dataset info - try the tree API for parquet files
  const endpoints = [
    'https://huggingface.co/api/datasets/google/fleurs',
    'https://huggingface.co/api/datasets/google/fleurs/parquet',
    'https://huggingface.co/api/datasets/google/fleurs/tree/main',
  ];
  
  for (const url of endpoints) {
    console.log(`Testing: ${url}`);
    try {
      const response = await fetch(url);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Check for parquet info
        if (url.includes('/parquet')) {
          console.log(`  ✅ Parquet configs found!`);
          const configs = Object.keys(data);
          console.log(`  Configs (${configs.length}): ${configs.slice(0, 15).join(', ')}...`);
          
          // Show structure for one config
          if (configs.length > 0) {
            const firstConfig = configs.find(c => c.includes('en')) || configs[0];
            console.log(`  \nStructure for '${firstConfig}':`);
            console.log(`    Splits: ${Object.keys(data[firstConfig]).join(', ')}`);
            
            // Get parquet URL
            const testSplit = data[firstConfig]?.test || data[firstConfig]?.train;
            if (testSplit && testSplit.length > 0) {
              console.log(`    Parquet URL: ${testSplit[0].substring(0, 80)}...`);
            }
          }
          return { parquet: data, configs };
        }
        
        console.log(`  ✅ Response keys: ${Object.keys(data).slice(0, 10).join(', ')}`);
        
        // If it has configs, show them
        if (data.dataset_info) {
          const configs = Object.keys(data.dataset_info);
          console.log(`  Configs (${configs.length}): ${configs.slice(0, 10).join(', ')}...`);
          return { configs, data };
        }
        if (data.splits) {
          console.log(`  Splits:`, data.splits);
          return { splits: data.splits, data };
        }
        if (data.config) {
          console.log(`  Config info available`);
        }
        
        // Show a sample of the data structure
        const sample = JSON.stringify(data).substring(0, 500);
        console.log(`  Sample: ${sample}...`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
  return null;
}

const LANGUAGES = {
  en: { displayName: 'English', fleursConfig: 'en_us', sampleCount: 647 },
  es: { displayName: 'Spanish', fleursConfig: 'es_419', sampleCount: 647 },
  fr: { displayName: 'French', fleursConfig: 'fr_fr', sampleCount: 647 },
  de: { displayName: 'German', fleursConfig: 'de_de', sampleCount: 647 },
};

async function testApiFormats(langCode, configOverride = null) {
  const config = LANGUAGES[langCode];
  if (!config) {
    console.error(`Unknown language: ${langCode}`);
    return;
  }

  const fleursConfig = configOverride || config.fleursConfig;
  const offset = Math.floor(Math.random() * 100); // Use smaller offset for testing
  
  // Different API URL formats to test
  const urlFormats = [
    // Format 1: Current (with length)
    `https://datasets-server.huggingface.co/rows?dataset=google/fleurs&config=${fleursConfig}&split=test&offset=${offset}&length=1`,
    
    // Format 2: With limit instead of length
    `https://datasets-server.huggingface.co/rows?dataset=google/fleurs&config=${fleursConfig}&split=test&offset=${offset}&limit=1`,
    
    // Format 3: First rows endpoint
    `https://datasets-server.huggingface.co/first-rows?dataset=google/fleurs&config=${fleursConfig}&split=test`,
    
    // Format 4: Parquet endpoint
    `https://datasets-server.huggingface.co/parquet?dataset=google/fleurs&config=${fleursConfig}`,
    
    // Format 5: Info endpoint (to check dataset structure)
    `https://datasets-server.huggingface.co/info?dataset=google/fleurs&config=${fleursConfig}`,
  ];

  console.log(`\n=== Testing FLEURS API for ${config.displayName} (${langCode}) ===\n`);

  for (const url of urlFormats) {
    console.log(`Testing: ${url}`);
    try {
      const response = await fetch(url);
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ SUCCESS!`);
        
        // Show structure
        if (data.rows) {
          console.log(`  Found ${data.rows.length} rows`);
          if (data.rows[0]) {
            const row = data.rows[0].row || data.rows[0];
            console.log(`  Row keys: ${Object.keys(row).join(', ')}`);
            if (row.audio) {
              console.log(`  Audio type: ${typeof row.audio}, isArray: ${Array.isArray(row.audio)}`);
              if (Array.isArray(row.audio) && row.audio[0]) {
                console.log(`  Audio[0] keys: ${Object.keys(row.audio[0]).join(', ')}`);
                console.log(`  Audio URL: ${row.audio[0].src?.substring(0, 80)}...`);
              }
            }
            if (row.transcription) {
              console.log(`  Transcription: "${row.transcription.substring(0, 60)}..."`);
            }
          }
        } else if (data.parquet_files) {
          console.log(`  Parquet files: ${data.parquet_files.length}`);
        } else if (data.dataset_info) {
          console.log(`  Dataset info available`);
        } else {
          console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
        }
        
        // Return first successful format
        return { url, data };
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Fetch error: ${error.message}`);
    }
    console.log('');
  }
  
  return null;
}

async function testAudioDownload(audioUrl) {
  console.log(`\n=== Testing audio download ===`);
  console.log(`URL: ${audioUrl}`);
  
  try {
    const response = await fetch(audioUrl);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`Content-Type: ${contentType}`);
      console.log(`Content-Length: ${contentLength} bytes`);
      
      // Download first few bytes to verify it's audio
      const buffer = await response.arrayBuffer();
      console.log(`Downloaded: ${buffer.byteLength} bytes`);
      console.log(`✅ Audio download successful!`);
      return true;
    }
  } catch (error) {
    console.log(`❌ Audio download failed: ${error.message}`);
  }
  return false;
}

// Test alternative datasets that have proper API support
async function testAlternativeDatasets() {
  console.log('\n=== Testing Alternative Speech Datasets ===\n');
  
  const datasets = [
    // LibriSpeech - English clean
    { 
      name: 'LibriSpeech Clean',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=openslr/librispeech_asr&config=clean&split=test.clean',
      lang: 'en'
    },
    // LibriSpeech - Other (might have variations)
    {
      name: 'LibriSpeech Other', 
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=openslr/librispeech_asr&config=other&split=test.other',
      lang: 'en'
    },
    // Common Voice English
    {
      name: 'Common Voice 11 (en)',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=mozilla-foundation/common_voice_11_0&config=en&split=test',
      lang: 'en'
    },
    // MLCommons People's Speech
    {
      name: 'People\'s Speech',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=MLCommons/peoples_speech&config=clean&split=test',
      lang: 'en'
    },
    // VoxPopuli (Multilingual)
    {
      name: 'VoxPopuli (en)',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=facebook/voxpopuli&config=en&split=test',
      lang: 'en'
    },
    // Multilingual LibriSpeech French
    {
      name: 'MLS French',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=facebook/multilingual_librispeech&config=french&split=test',
      lang: 'fr'
    },
    // Multilingual LibriSpeech German
    {
      name: 'MLS German',
      url: 'https://datasets-server.huggingface.co/first-rows?dataset=facebook/multilingual_librispeech&config=german&split=test',
      lang: 'de'
    },
  ];
  
  const working = [];
  
  for (const ds of datasets) {
    console.log(`Testing: ${ds.name}`);
    console.log(`  URL: ${ds.url}`);
    
    try {
      const response = await fetch(ds.url);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        const rows = data.rows || [];
        console.log(`  ✅ Found ${rows.length} rows`);
        
        if (rows.length > 0) {
          const row = rows[0].row || rows[0];
          console.log(`  Row keys: ${Object.keys(row).join(', ')}`);
          
          // Find audio field
          const audioField = Object.keys(row).find(k => 
            k === 'audio' || k === 'file' || k.includes('audio')
          );
          const textField = Object.keys(row).find(k => 
            k === 'text' || k === 'sentence' || k === 'transcription' || k.includes('text')
          );
          
          if (audioField) {
            const audio = row[audioField];
            console.log(`  Audio field: ${audioField}, type: ${typeof audio}, isArray: ${Array.isArray(audio)}`);
            if (Array.isArray(audio) && audio[0]?.src) {
              console.log(`  Audio URL: ${audio[0].src.substring(0, 60)}...`);
            } else if (typeof audio === 'object' && audio?.src) {
              console.log(`  Audio URL: ${audio.src.substring(0, 60)}...`);
            }
          }
          if (textField) {
            console.log(`  Text field: ${textField} = "${String(row[textField]).substring(0, 50)}..."`);
          }
          
          working.push({
            ...ds,
            audioField,
            textField,
            sampleRow: row
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Error: ${errorText.substring(0, 80)}`);
      }
    } catch (error) {
      console.log(`  ❌ Fetch error: ${error.message}`);
    }
    console.log('');
  }
  
  return working;
}

// Run tests
async function main() {
  console.log('Speech Dataset API Test Script');
  console.log('==============================\n');
  
  // First discover the dataset structure
  console.log('Checking FLEURS (original target)...\n');
  const discovery = await discoverDataset();
  
  // FLEURS uses a custom script, so try alternatives
  console.log('\nFLEURS is not available via datasets-server API.');
  console.log('Testing alternative datasets with API support...\n');
  
  const working = await testAlternativeDatasets();
  
  if (working.length > 0) {
    console.log('\n=== WORKING DATASETS ===\n');
    for (const ds of working) {
      console.log(`✅ ${ds.name} (${ds.lang})`);
      console.log(`   Audio: ${ds.audioField}, Text: ${ds.textField}`);
    }
    
    // Test audio download for first working dataset
    const first = working[0];
    if (first.sampleRow) {
      const audio = first.sampleRow[first.audioField];
      const audioUrl = Array.isArray(audio) ? audio[0]?.src : audio?.src;
      if (audioUrl) {
        await testAudioDownload(audioUrl);
      }
    }
  } else {
    console.log('\n❌ No working datasets found!');
  }
}

main().catch(console.error);
