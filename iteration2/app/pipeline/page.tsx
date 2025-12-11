"use client";

import React, { useState } from 'react';
import { ChevronRight, Mic, Database, Cpu, Zap, CheckCircle, BarChart3, FileText } from 'lucide-react';

const CORALArchitecture = () => {
  const [activeStage, setActiveStage] = useState('stage1');

  const Stage1Pipeline = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Stage 1: ASR Ensemble Pipeline</h2>
        <p className="text-blue-100">Multi-Model Speech Recognition with Baseline Evaluation</p>
      </div>

      {/* Input Layer */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center mb-4">
          <Mic className="w-8 h-8 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Input Layer</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-semibold text-blue-800 mb-2">Audio Input Options</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• File Upload (MP3, WAV, MP4)</li>
              <li>• Real-time Recording (16kHz)</li>
              <li>• Dataset Batch Processing</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-semibold text-blue-800 mb-2">Preprocessing</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Resampling to 16kHz</li>
              <li>• Mono conversion</li>
              <li>• Normalization (float32)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ASR Models Grid */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-center mb-4">
          <Cpu className="w-8 h-8 text-purple-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">ASR Model Ensemble (4 Models)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { name: 'Whisper Small', type: 'Seq2Seq', params: '244M', wer: '~25%' },
            { name: 'Whisper Medium', type: 'Seq2Seq', params: '769M', wer: '~20%' },
            { name: 'Whisper Large', type: 'Seq2Seq', params: '1.5B', wer: '17.76%' },
            { name: 'Wav2Vec2-Urdu', type: 'CTC', params: '300M', wer: '~22%' }
          ].map((model, idx) => (
            <div key={idx} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="font-semibold text-purple-800 text-sm mb-2">{model.name}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Type: {model.type}</div>
                <div>Size: {model.params}</div>
                <div className="font-semibold text-purple-700">WER: {model.wer}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-purple-100 p-4 rounded-lg">
          <div className="font-semibold text-purple-800 mb-2">Parallel Processing</div>
          <div className="text-sm text-gray-700">
            Each model processes audio independently and outputs word-level predictions with confidence scores
          </div>
        </div>
      </div>

      {/* Output Processing */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center mb-4">
          <Zap className="w-8 h-8 text-green-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Output Processing</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Word Extraction</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Token-to-word mapping</li>
              <li>• Confidence scoring</li>
              <li>• Urdu script conversion</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Hypothesis Generation</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• H1: Whisper Large</li>
              <li>• H2: Whisper Medium</li>
              <li>• H3: Wav2Vec2 Urdu</li>
              <li>• H4: Whisper Small</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Format</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• JSON with probabilities</li>
              <li>• Word-level confidence</li>
              <li>• Ready for Stage 2</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Evaluation Module */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
        <div className="flex items-center mb-4">
          <BarChart3 className="w-8 h-8 text-orange-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Baseline Evaluation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="font-semibold text-orange-800 mb-2">Metrics Computed</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• WER (Word Error Rate)</li>
              <li>• CER (Character Error Rate)</li>
              <li>• ECE (Expected Calibration Error)</li>
              <li>• Confidence Statistics</li>
            </ul>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="font-semibold text-orange-800 mb-2">Visualizations</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Model comparison charts</li>
              <li>• Error distribution plots</li>
              <li>• Calibration curves</li>
              <li>• Performance heatmaps</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stage 1 Outputs */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-3">
          <CheckCircle className="w-8 h-8 mr-3" />
          <h3 className="text-xl font-bold">Stage 1 Outputs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-1">4 Hypotheses</div>
            <div className="text-green-100">Word predictions with confidence scores from selected models</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Evaluation Report</div>
            <div className="text-green-100">Performance metrics and comparative analysis</div>
          </div>
          <div>
            <div className="font-semibold mb-1">Input for Stage 2</div>
            <div className="text-green-100">Formatted data ready for LLM correction</div>
          </div>
        </div>
      </div>
    </div>
  );

  const Stage2Pipeline = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Stage 2: LLM-Based Correction Pipeline</h2>
        <p className="text-indigo-100">Intelligent Hypothesis Fusion with Alif-1.0-8B</p>
      </div>

      {/* Input from Stage 1 */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center mb-4">
          <Database className="w-8 h-8 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Input: 4 ASR Hypotheses</h3>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="font-mono text-sm space-y-2 text-gray-700">
            <div className="flex items-start">
              <span className="font-semibold text-blue-700 mr-2">H1:</span>
              <span>Whisper Large transcription + confidence scores (e.g., 0.85)</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-700 mr-2">H2:</span>
              <span>Whisper Medium transcription + confidence scores (e.g., 0.78)</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-700 mr-2">H3:</span>
              <span>Wav2Vec2 Urdu transcription + confidence scores (e.g., 0.82)</span>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-700 mr-2">H4:</span>
              <span>Whisper Small transcription + confidence scores (e.g., 0.80)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Engineering */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <div className="flex items-center mb-4">
          <FileText className="w-8 h-8 text-purple-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Prompt Engineering Layer</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="font-semibold text-purple-800 mb-2">Prompt Structure</div>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Transcriptions FIRST (H1, H2, H3, H4)</li>
              <li>Quality guidelines and rules (7 rules)</li>
              <li>Urdu linguistic constraints</li>
              <li>Output format: "BEST corrected Urdu sentence"</li>
            </ol>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="font-semibold text-purple-800 mb-2">Key Instructions</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Prefer high-confidence words</li>
              <li>• Use majority voting (2+ models agree)</li>
              <li>• Fix spelling errors</li>
              <li>• Ensure proper Urdu grammar</li>
              <li>• Complete words (no truncations)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 bg-purple-100 p-4 rounded-lg">
          <div className="font-semibold text-purple-800 mb-2">Placeholder Formats</div>
          <div className="text-sm text-gray-700 space-y-1">
            <div>• <code className="bg-white px-2 py-1 rounded">{"{hypotheses}"}</code> → Formatted H1-H4 block</div>
            <div>• <code className="bg-white px-2 py-1 rounded">{"{predictions[i]}"}</code> → Individual hypothesis (i=0,1,2,3)</div>
          </div>
        </div>
      </div>

      {/* LLM Processing */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
        <div className="flex items-center mb-4">
          <Cpu className="w-8 h-8 text-indigo-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">LLM Processing: Alif-1.0-8B-Instruct</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="font-semibold text-indigo-800 mb-2">Model Specifications</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Architecture</div>
                <div className="font-semibold text-indigo-900">Decoder-only Transformer</div>
              </div>
              <div>
                <div className="text-gray-600">Parameters</div>
                <div className="font-semibold text-indigo-900">8 Billion</div>
              </div>
              <div>
                <div className="text-gray-600">Precision</div>
                <div className="font-semibold text-indigo-900">Float16</div>
              </div>
              <div>
                <div className="text-gray-600">Language</div>
                <div className="font-semibold text-indigo-900">Urdu-focused</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="font-semibold text-indigo-800 mb-2">Generation Parameters (Quality-Optimized)</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Temperature</div>
                <div className="font-semibold text-indigo-900">0.2</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Top-p</div>
                <div className="font-semibold text-indigo-900">0.85</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Top-k</div>
                <div className="font-semibold text-indigo-900">50</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Max Tokens</div>
                <div className="font-semibold text-indigo-900">250</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Repetition Penalty</div>
                <div className="font-semibold text-indigo-900">1.1</div>
              </div>
              <div className="bg-white p-2 rounded">
                <div className="text-gray-600 text-xs">Min Length</div>
                <div className="font-semibold text-indigo-900">15</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="font-semibold text-indigo-800 mb-2">Processing Steps</div>
            <div className="space-y-2">
              {[
                'Hypothesis analysis and confidence weighting',
                'Word-level agreement detection (2+ models)',
                'Spelling and grammar correction',
                'Sentence structure optimization',
                'Urdu script normalization'
              ].map((step, idx) => (
                <div key={idx} className="flex items-center text-sm text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-xs font-bold mr-3">
                    {idx + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="font-semibold text-yellow-800 mb-2">Retry Strategy (If Empty/Minimal Response)</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• Strategy 1: Enhanced prompt + higher temperature (0.25)</div>
              <div>• Strategy 2: Simplified Urdu prompt (no confidence scores)</div>
              <div>• Strategy 3: Ultra-simple format (just hypotheses + "صحیح جملہ:")</div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Processing */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center mb-4">
          <Zap className="w-8 h-8 text-green-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Post-Processing & Validation</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Output Cleaning</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Remove prompt artifacts</li>
              <li>• Strip English prefixes</li>
              <li>• Extract first sentence</li>
              <li>• Remove metadata</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Character Validation</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Urdu character validation</li>
              <li>• Unicode normalization (NFC)</li>
              <li>• Corrupted char fixes</li>
              <li>• Whitespace cleanup</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="font-semibold text-green-800 mb-2">Quality Checks</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Minimum length validation</li>
              <li>• Urdu content verification</li>
              <li>• Punctuation validation</li>
              <li>• Fallback extraction methods</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Final Output */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-3">
          <CheckCircle className="w-8 h-8 mr-3" />
          <h3 className="text-xl font-bold">Final Corrected Output</h3>
        </div>
        <div className="bg-white bg-opacity-20 p-4 rounded-lg">
          <div className="text-sm space-y-2">
            <div>
              <span className="font-semibold">Format:</span> Clean Urdu text with proper punctuation (۔)
            </div>
            <div>
              <span className="font-semibold">Quality:</span> Best transcription combining all 4 hypotheses
            </div>
            <div>
              <span className="font-semibold">Validation:</span> Grammar-correct, properly spelled, complete sentences
            </div>
            <div>
              <span className="font-semibold">WER Improvement:</span> Significant reduction compared to individual ASR models
            </div>
          </div>
        </div>
      </div>

      {/* API Integration */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
        <div className="flex items-center mb-4">
          <Zap className="w-8 h-8 text-yellow-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Deployment Architecture</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="font-semibold text-yellow-800 mb-2">Backend (Flask API)</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• POST /correct endpoint</li>
              <li>• CORS-enabled for web access</li>
              <li>• Ngrok tunnel for public URL</li>
              <li>• Error handling & fallbacks</li>
              <li>• Route registration verification</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="font-semibold text-yellow-800 mb-2">Memory Management</div>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• CUDA cache clearing</li>
              <li>• Garbage collection</li>
              <li>• Float16 optimization</li>
              <li>• GPU memory monitoring</li>
              <li>• OutOfMemoryError handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-2xl mb-8">
          <h1 className="text-4xl font-bold mb-3">CORAL: Confidence-Driven ASR Correction</h1>
          <p className="text-xl text-blue-100 mb-4">Complete System Architecture & Pipeline</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <span className="font-semibold">Stage 1:</span> Multi-Model ASR Ensemble
            </div>
            <ChevronRight className="w-5 h-5" />
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              <span className="font-semibold">Stage 2:</span> LLM-Based Correction
            </div>
          </div>
        </div>

        {/* Stage Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveStage('stage1')}
            className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
              activeStage === 'stage1'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Mic className="w-6 h-6" />
              Stage 1: ASR Ensemble
            </div>
          </button>
          <button
            onClick={() => setActiveStage('stage2')}
            className={`flex-1 py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
              activeStage === 'stage2'
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Cpu className="w-6 h-6" />
              Stage 2: LLM Correction
            </div>
          </button>
        </div>

        {/* Pipeline Content */}
        {activeStage === 'stage1' ? <Stage1Pipeline /> : <Stage2Pipeline />}

        {/* System Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-gray-600 text-sm">ASR Models</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">4</div>
            <div className="text-gray-600 text-sm">Hypotheses</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">8B</div>
            <div className="text-gray-600 text-sm">LLM Parameters</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">1</div>
            <div className="text-gray-600 text-sm">Best Output</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>CORAL System • Confidence-Driven ASR Correction for Urdu • 2025</p>
        </div>
      </div>
    </div>
  );
};

export default CORALArchitecture;
