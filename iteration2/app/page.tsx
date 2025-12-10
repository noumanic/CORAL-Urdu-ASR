"use client";

import { useState, useRef } from "react";
import axios from "axios";
import {
  Settings,
  Sparkles,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2,
  Waves,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

const TEST_DATA = [
  "مجھے انگریزی سیکھنے میں تھوڑی دشو",
  "مجھے انگریز سیکھنے میں تھوڑی دشوری ہو رہی ہے",
  "مجھے انگریزی سیکھنے میں تھوڑی دشواری ہو رہی ھے",
  "مجھے انگریزی سیکھنے میں تھوڑی دشواری ہو رہی ہے",
  "مجھے انگریزی سیکھنے میں تھوڑی دشواری ہو رہی ہے",
];

interface CSVRow {
  path: string;
  sentence: string;
  "whisper-large": string;
  "whisper-medium": string;
  "wav2vec2-urdu": string;
  "whisper-small": string;
  alif_1: string;
  WER: string;
}

export default function Home() {
  const [ngrokUrl, setNgrokUrl] = useState(
    "" // No default URL - user must enter the URL from Kaggle console
  );
  const [hypotheses, setHypotheses] = useState<string[]>(["", "", "", ""]);
  // Store raw model outputs with probability scores for backend formatting
  const [rawModelOutputs, setRawModelOutputs] = useState<string[]>(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  // Manual ground truth sentence input
  const [groundTruthSentence, setGroundTruthSentence] = useState<string>("");
  // Custom prompt for alif_1 model
  const [customPrompt, setCustomPrompt] = useState<string>("");
  // Connection test states
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  
  // CSV related state
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState<number>(-1);
  const [csvFileName, setCsvFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateHypothesis = (index: number, value: string) => {
    const newHypotheses = [...hypotheses];
    newHypotheses[index] = value;
    setHypotheses(newHypotheses);
    // Clear the raw output for this hypothesis if user manually edits
    // This way, if they edit manually, we'll send plain text instead
    const newRawOutputs = [...rawModelOutputs];
    newRawOutputs[index] = "";
    setRawModelOutputs(newRawOutputs);
  };

  const handlePasteTestData = () => {
    // Use first 4 items from test data
    setHypotheses(TEST_DATA.slice(0, 4));
    setError("");
    setResult("");
  };

  const handleClearAll = () => {
    setHypotheses(["", "", "", ""]);
    setRawModelOutputs(["", "", "", ""]);
    setGroundTruthSentence("");
    setError("");
    setResult("");
  };

  // CSV parsing function - improved to handle quoted fields with commas
  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "");
    if (lines.length < 2) return [];

    // Parse headers
    const headerLine = lines[0];
    const headers: string[] = [];
    let currentHeader = "";
    let insideQuotes = false;

    for (let i = 0; i < headerLine.length; i++) {
      const char = headerLine[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        headers.push(currentHeader.trim());
        currentHeader = "";
      } else {
        currentHeader += char;
      }
    }
    headers.push(currentHeader.trim());

    const rows: CSVRow[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let currentValue = "";
      insideQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = j < line.length - 1 ? line[j + 1] : "";

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            // Escaped quote
            currentValue += '"';
            j++; // Skip next quote
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === "," && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      // Create row object
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          let value = values[index] || "";
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          row[header] = value;
        });
        rows.push(row as CSVRow);
      }
    }

    return rows;
  };

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsedData = parseCSV(text);
      
      if (parsedData.length > 0) {
        setCsvData(parsedData);
        setCurrentRowIndex(0);
        loadRowData(parsedData[0]);
      } else {
        setError("Failed to parse CSV file. Please check the file format.");
      }
    };

    reader.onerror = () => {
      setError("Error reading CSV file.");
    };

    reader.readAsText(file);
  };

  // Clean alif_1 text - remove confidence scores, prefixes, etc.
  const cleanAlif1Text = (alifText: string): string => {
    if (!alifText) return "";
    
    let cleaned = alifText;
    
    // Remove "Answer:" prefix if present
    if (cleaned.includes("Answer:")) {
      cleaned = cleaned.split("Answer:")[1]?.trim() || cleaned;
    }
    
    // Remove "### Response:" prefix if present
    if (cleaned.includes("### Response:")) {
      cleaned = cleaned.split("### Response:")[1]?.trim() || cleaned;
    }
    
    // Remove surrounding quotes if present
    cleaned = cleaned.replace(/^['"]|['"]$/g, "");
    
    // Remove confidence scores in format word(0.95) or word (0.95)
    cleaned = cleaned.replace(/\([\d.]+\)/g, "");
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    
    return cleaned;
  };

  // Load data from current CSV row
  const loadRowData = (row: CSVRow) => {
    // Extract text from the 4 ASR models
    const whisperLarge = row["whisper-large"] ? extractTextFromModelOutput(row["whisper-large"]) : { text: "", formatted: "" };
    const whisperMedium = row["whisper-medium"] ? extractTextFromModelOutput(row["whisper-medium"]) : { text: "", formatted: "" };
    const wav2vec2Urdu = row["wav2vec2-urdu"] ? extractTextFromModelOutput(row["wav2vec2-urdu"]) : { text: "", formatted: "" };
    const whisperSmall = row["whisper-small"] ? extractTextFromModelOutput(row["whisper-small"]) : { text: "", formatted: "" };
    
    // Set formatted text WITH confidence scores for display in input fields
    setHypotheses([
      whisperLarge.formatted,
      whisperMedium.formatted,
      wav2vec2Urdu.formatted,
      whisperSmall.formatted,
    ]);
    
    // Store formatted versions with probability scores for backend (same as display)
    setRawModelOutputs([
      whisperLarge.formatted,
      whisperMedium.formatted,
      wav2vec2Urdu.formatted,
      whisperSmall.formatted,
    ]);
    
    // Set ground truth sentence from CSV
    setGroundTruthSentence(row.sentence || "");
    
    setError("");
    setResult("");
  };

  // Extract text from model output format like "[('word', 0.9), ...]" or "[(\"word\", 0.9), ...]"
  // Returns both plain text (for display) and formatted text with scores (for backend)
  const extractTextFromModelOutput = (modelOutput: string): { text: string; formatted: string } => {
    if (!modelOutput || modelOutput.trim() === "") return { text: "", formatted: "" };
    
    let parsed: any[] = [];
    
    // Try to parse as JSON array first
    try {
      parsed = JSON.parse(modelOutput);
      if (!Array.isArray(parsed)) {
        parsed = [];
      }
    } catch {
      // If JSON parsing fails, try to extract from Python-style tuple format
      try {
        // Match pattern: [('word', number), ...] or [("word", number), ...]
        const tupleRegex = /\(['"]([^'"]+)['"],\s*([\d.]+)\)/g;
        const matches = [...modelOutput.matchAll(tupleRegex)];
        if (matches.length > 0) {
          parsed = matches.map(match => [match[1], parseFloat(match[2])]);
        }
      } catch {
        // If all parsing fails, treat as plain text
        return { text: modelOutput, formatted: modelOutput };
      }
    }
    
    if (parsed.length === 0) {
      return { text: modelOutput, formatted: modelOutput };
    }
    
    // Extract plain text for display
    const text = parsed.map((item: any[]) => item[0]).join(" ");
    
    // Format with probability scores for backend: word(0.95)
    const formatted = parsed.map((item: any[]) => {
      const word = item[0];
      const score = item[1] || 0;
      return `${word}(${score.toFixed(2)})`;
    }).join(" ");
    
    return { text, formatted };
  };

  // Navigate to next row
  const handleNextRow = () => {
    if (currentRowIndex < csvData.length - 1) {
      const newIndex = currentRowIndex + 1;
      setCurrentRowIndex(newIndex);
      loadRowData(csvData[newIndex]);
    }
  };

  // Navigate to previous row
  const handlePrevRow = () => {
    if (currentRowIndex > 0) {
      const newIndex = currentRowIndex - 1;
      setCurrentRowIndex(newIndex);
      loadRowData(csvData[newIndex]);
    }
  };

  // Clear CSV data
  const handleClearCSV = () => {
    setCsvData([]);
    setCurrentRowIndex(-1);
    setCsvFileName("");
    setHypotheses(["", "", "", ""]);
    setRawModelOutputs(["", "", "", ""]);
    setGroundTruthSentence("");
    setResult("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const testConnection = async () => {
    if (!ngrokUrl.trim()) {
      setConnectionStatus("error");
      setConnectionMessage("Please enter a ngrok URL first");
      setTimeout(() => setConnectionStatus(null), 5000);
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);
    setConnectionMessage("");
    setError("");

    try {
      const response = await axios.get(`${ngrokUrl}/`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        timeout: 8000,
      });
      
      if (response.data.status === "CORAL Backend is Running") {
        setConnectionStatus("success");
        setConnectionMessage("Connection successful! Backend is running and ready.");
        setError("");
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setConnectionStatus(null);
          setConnectionMessage("");
        }, 5000);
      } else {
        setConnectionStatus("error");
        setConnectionMessage("Backend responded but with unexpected status. Please check the server.");
        setTimeout(() => setConnectionStatus(null), 8000);
      }
    } catch (err) {
      let errorMsg = "";
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNREFUSED" || err.message.includes("Network Error") || err.message.includes("ERR_NETWORK")) {
          errorMsg = "Cannot connect to the backend server";
        } else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
          errorMsg = "Connection timeout - server is taking too long to respond";
        } else if (err.response?.status === 404) {
          errorMsg = "Endpoint not found - check if the Flask server is running";
        } else if (err.response?.status >= 500) {
          errorMsg = "Server error - backend may be experiencing issues";
        } else {
          errorMsg = `Connection failed: ${err.message}`;
        }
      } else {
        errorMsg = "An unexpected error occurred while testing connection";
      }

      setConnectionStatus("error");
      setConnectionMessage(errorMsg);
      setError("");
      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setConnectionStatus(null);
        setConnectionMessage("");
      }, 8000);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRefine = async () => {
    setIsLoading(true);
    setError("");
    setResult("");

    try {
      // Hypotheses now contain formatted text with confidence scores when loaded from CSV
      // If user manually edited, use what they typed (might have scores or plain text)
      const hypothesesToSend = hypotheses;
      
      // Prepare request data
      const requestData: any = { hypotheses: hypothesesToSend };
      
      // Include custom prompt if provided
      if (customPrompt.trim()) {
        requestData.custom_prompt = customPrompt.trim();
      }
      
      const response = await axios.post(
        `${ngrokUrl}/correct`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          timeout: 30000, // 30 second timeout
        }
      );
      // Clean the result to remove any confidence scores if present
      const cleanedResult = cleanAlif1Text(response.data.corrected_text);
      setResult(cleanedResult);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorData = err.response.data;
          let errorMsg = errorData?.error || errorData?.message || err.message;
          
          // Add debug info if available
          if (errorData?.raw_response) {
            errorMsg += `\n\nRaw response (first 200 chars): ${errorData.raw_response.substring(0, 200)}`;
          }
          if (errorData?.debug_info) {
            errorMsg += `\n\nDebug: ${errorData.debug_info}`;
          }
          if (errorData?.urdu_char_count !== undefined) {
            errorMsg += `\n\nUrdu characters found: ${errorData.urdu_char_count}`;
          }
          
          setError(
            `Server Error (${err.response.status}): ${errorMsg}`
          );
        } else if (err.request) {
          setError(
            `❌ Connection failed!\n\n` +
            `Cannot reach: ${ngrokUrl}\n\n` +
            `Please check:\n` +
            `1. Flask server is running in Kaggle\n` +
            `2. Ngrok tunnel is active (check Kaggle console)\n` +
            `3. Update ngrok URL in Settings above\n` +
            `4. Click "Test Connection" to verify`
          );
        } else if (err.response?.status === 404) {
          setError(
            `❌ 404 Error: Endpoint not found!\n\n` +
            `The server cannot find the '/correct' endpoint.\n\n` +
            `Please check:\n` +
            `1. Re-run the Flask route cell in Kaggle (the cell with @app.route('/correct'))\n` +
            `2. Verify the route is registered (check Kaggle console for route list)\n` +
            `3. Restart the Flask server if needed\n` +
            `4. Make sure you're using the correct ngrok URL\n\n` +
            `Current URL: ${ngrokUrl}\n` +
            `Expected endpoint: ${ngrokUrl}/correct`
          );
        } else if (err.code === "ECONNABORTED") {
          setError("Request timeout. The server is taking too long to respond.");
        } else {
          setError(`Request Error: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasInput = hypotheses.some((h) => h.trim() !== "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25">
              <Waves className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              CORAL
            </h1>
          </div>
          <p className="text-slate-400 text-lg font-medium tracking-wide">
            Consensus-based Refinement &amp; Learning
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Urdu ASR Transcript Correction System
          </p>
        </header>

        {/* Settings Bar */}
        <div className="mb-8">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-3 group"
          >
            <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-sm font-medium">Backend Settings</span>
            {showSettings ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showSettings && (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ngrok Tunnel URL <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ngrokUrl}
                  onChange={(e) => {
                    setNgrokUrl(e.target.value.trim());
                    // Clear connection status when URL changes
                    if (connectionStatus) {
                      setConnectionStatus(null);
                      setConnectionMessage("");
                    }
                  }}
                  placeholder="https://xxxx-xxxx-xxxx.ngrok-free.dev"
                  className={cn(
                    "flex-1 bg-slate-900/80 border rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all font-mono text-sm",
                    connectionStatus === "success"
                      ? "border-emerald-500/70 focus:ring-emerald-500/50 focus:border-emerald-500"
                      : connectionStatus === "error"
                      ? "border-red-500/70 focus:ring-red-500/50 focus:border-red-500"
                      : ngrokUrl
                      ? "border-emerald-500/50 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                      : "border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50"
                  )}
                />
                <button
                  onClick={testConnection}
                  disabled={!ngrokUrl.trim() || isTestingConnection}
                  className={cn(
                    "px-6 py-3 border rounded-lg transition-all text-sm font-medium whitespace-nowrap flex items-center gap-2 min-w-[100px] justify-center",
                    isTestingConnection
                      ? "bg-slate-700/50 border-slate-600/50 text-slate-400 cursor-wait"
                      : ngrokUrl.trim()
                      ? "bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/30 text-cyan-400 hover:scale-105 active:scale-95"
                      : "bg-slate-800/50 border-slate-600/50 text-slate-600 cursor-not-allowed"
                  )}
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className={cn(
                        "w-4 h-4 transition-opacity",
                        connectionStatus === "success" ? "opacity-100" : "opacity-0"
                      )} />
                      <span>Test</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Connection Status Messages */}
              {connectionStatus && connectionMessage && (
                <div
                  className={cn(
                    "mt-3 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300",
                    connectionStatus === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {connectionStatus === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4
                        className={cn(
                          "font-semibold mb-1 text-sm",
                          connectionStatus === "success"
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {connectionStatus === "success"
                          ? "Connection Successful!"
                          : "Connection Failed"}
                      </h4>
                      <p
                        className={cn(
                          "text-sm leading-relaxed",
                          connectionStatus === "success"
                            ? "text-emerald-300/90"
                            : "text-red-300/90"
                        )}
                      >
                        {connectionMessage}
                      </p>
                      {connectionStatus === "error" && (
                        <div className="mt-3 pt-3 border-t border-red-500/20">
                          <p className="text-xs text-red-400/80 font-medium mb-2">
                            Troubleshooting steps:
                          </p>
                          <ul className="text-xs text-red-300/80 space-y-1 list-disc list-inside">
                            <li>Verify the Flask server is running in Kaggle</li>
                            <li>Check if the ngrok tunnel is active (look for the URL in Kaggle console)</li>
                            <li>Ensure the URL matches exactly (copy from Kaggle output)</li>
                            <li>Try refreshing the ngrok tunnel if it expired</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!ngrokUrl && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                  ⚠️ Ngrok URL is required! Get it from your Kaggle console after running the ngrok cell.
                </div>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-500">
                  <strong>How to get the URL:</strong>
                </p>
                <ol className="text-xs text-slate-500 list-decimal list-inside space-y-0.5 ml-2">
                  <li>Run the ngrok cell in your Kaggle notebook</li>
                  <li>Look for output: <code className="bg-slate-900/50 px-1 rounded">👉 https://xxxx.ngrok-free.dev 👈</code></li>
                  <li>Copy that URL and paste it above</li>
                  <li>Click "Test" to verify connection</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* CSV File Upload Section */}
        <div className="mb-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              CSV Data Source
            </h3>
            {csvData.length > 0 && (
              <button
                onClick={handleClearCSV}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear CSV
              </button>
            )}
          </div>

          {csvData.length === 0 ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 rounded-lg cursor-pointer transition-all group"
              >
                <Upload className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-200 font-medium">
                  Upload CSV File
                </span>
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Upload a CSV file containing alif_1 transcriptions to process them one by one
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300 font-medium">
                    {csvFileName}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {csvData.length} rows loaded
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevRow}
                    disabled={currentRowIndex === 0}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      currentRowIndex === 0
                        ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-300 font-medium min-w-[100px] text-center">
                    Row {currentRowIndex + 1} of {csvData.length}
                  </span>
                  <button
                    onClick={handleNextRow}
                    disabled={currentRowIndex === csvData.length - 1}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      currentRowIndex === csvData.length - 1
                        ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {currentRowIndex >= 0 && csvData[currentRowIndex] && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30 space-y-4">
                  <div>
                    <span className="text-slate-500 text-sm">File:</span>
                    <p className="text-slate-300 font-mono text-xs mt-1 truncate">
                      {csvData[currentRowIndex].path}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-sm">Ground Truth (from CSV):</span>
                    <p className="text-slate-200 mt-1 font-medium" dir="rtl">
                      {csvData[currentRowIndex].sentence}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      (You can also enter it manually in the input field above)
                    </p>
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
                    <span className="text-emerald-400 text-sm font-medium">Alif_1 Prediction:</span>
                    <p className="text-emerald-200 mt-1 font-medium" dir="rtl">
                      {cleanAlif1Text(csvData[currentRowIndex].alif_1)}
                    </p>
                  </div>
                  {csvData[currentRowIndex].WER && (
                    <div>
                      <span className="text-slate-500 text-sm">WER:</span>
                      <p className="text-slate-300 mt-1 font-mono">
                        {csvData[currentRowIndex].WER}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Custom Prompt Section */}
        <div className="mb-8 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Custom Prompt for Alif_1 Model
            </h3>
            {customPrompt && (
              <button
                onClick={() => setCustomPrompt("")}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
          
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom prompt for the Alif_1 model...&#10;&#10;Note: The 4 ASR transcriptions will be sent FIRST, then your prompt.&#10;&#10;Placeholder options:&#10;- {hypotheses} - All 4 transcriptions formatted as H1, H2, H3, H4&#10;- {predictions[0]}, {predictions[1]}, {predictions[2]}, {predictions[3]} - Individual transcriptions&#10;&#10;Example (Urdu):&#10;یہ 4 ASR ماڈلز کی پیشن گوئیاں ہیں:&#10;1. {predictions[0]}&#10;2. {predictions[1]}&#10;..."
            className={cn(
              "w-full h-48 bg-slate-900/80 border border-slate-600/50 rounded-lg px-4 py-3",
              "text-slate-200 placeholder-slate-500 text-sm leading-relaxed",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
              "transition-all duration-200 resize-none font-mono",
              customPrompt && "border-purple-500/30 bg-slate-900/90"
            )}
          />
          <div className="flex items-start gap-2 mt-3">
            <p className="text-xs text-slate-500 flex-1">
              <strong>Note:</strong> The 4 ASR transcriptions are sent FIRST, then your prompt. 
              Use <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">{"{hypotheses}"}</code> or <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300">{"{predictions[0]}"}</code> placeholders to control where transcriptions appear.
              If no prompt is provided, the default prompt will be used.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCustomPrompt(`یہ 4 ASR ماڈلز کی پیشن گوئیاں ہیں (لفظ اور اعتماد):

1. {predictions[0]}

2. {predictions[1]}

3. {predictions[2]}

4. {predictions[3]}



ایک صحیح جملہ اس طرح ہونا چاہیے: واضح، درست املا، مکمل الفاظ کے ساتھ۔

ان تمام پیشن گوئیوں کو مدنظر رکھتے ہوئے، صحیح ترین اردو جملہ لکھیں:`);
                }}
                className="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded transition-all whitespace-nowrap"
              >
                Load Urdu Template
              </button>
              <button
                onClick={() => {
                  setCustomPrompt(`You are an expert Urdu text correction system. Combine the 4 ASR transcriptions above into one perfect Urdu sentence.

Rules:
1. Use words where 2+ models agree (confidence >0.60)
2. Prefer highest confidence words when models disagree
3. Fix spelling errors (e.g., معشت→معیشت, زرات→زراعت)
4. Ensure proper Urdu grammar and word order
5. Use natural, simple Urdu language

CRITICAL - Output Format:
- Output ONLY the corrected Urdu sentence
- Use ONLY standard Urdu/Arabic characters (no special symbols)
- NO asterisks (*), backslashes (\\), or corrupted characters
- NO confidence scores in output
- Simple, clean, readable Urdu text only
- End with proper punctuation (۔)`);
                }}
                className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded transition-all whitespace-nowrap"
              >
                Load English Template
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="space-y-4">
            {/* Ground Truth Sentence Input */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                <span className="text-lg">📝</span>
                Ground Truth Sentence (Optional)
              </label>
              <textarea
                dir="rtl"
                value={groundTruthSentence}
                onChange={(e) => setGroundTruthSentence(e.target.value)}
                placeholder="اردو جملہ یہاں درج کریں (اختیاری)..."
                className={cn(
                  "w-full h-20 bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3",
                  "text-slate-100 placeholder-slate-600 text-lg leading-relaxed",
                  "focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50",
                  "transition-all duration-200 resize-none",
                  "font-noto-nastaliq",
                  groundTruthSentence && "border-cyan-500/30 bg-slate-800/50"
                )}
                style={{ fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" }}
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter the correct/ground truth sentence for reference (optional)
              </p>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-200">
                ASR Hypotheses
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePasteTestData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/30 text-amber-400 rounded-lg transition-all text-sm font-medium group"
                >
                  <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                  Paste Test Data
                </button>
                {hasInput && (
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all text-sm font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {hypotheses.map((hypothesis, index) => {
              const modelNames = [
                "Whisper Large",
                "Whisper Medium",
                "Wav2Vec2 Urdu",
                "Whisper Small",
              ];
              return (
              <div key={index} className="group">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-700/50 rounded-full text-xs text-slate-300">
                    {index + 1}
                  </span>
                  {modelNames[index]}
                </label>
                <textarea
                  dir="rtl"
                  value={hypothesis}
                  onChange={(e) => updateHypothesis(index, e.target.value)}
                  placeholder="اردو ٹرانسکرپٹ یہاں درج کریں..."
                  className={cn(
                    "w-full h-24 bg-slate-800/30 border border-slate-700/50 rounded-xl px-4 py-3",
                    "text-slate-100 placeholder-slate-600 text-lg leading-relaxed",
                    "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50",
                    "transition-all duration-200 resize-none",
                    "font-noto-nastaliq",
                    hypothesis && "border-emerald-500/30 bg-slate-800/50"
                  )}
                  style={{ fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" }}
                />
              </div>
            );
            })}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Refine Button */}
            <button
              onClick={handleRefine}
              disabled={isLoading || !hasInput}
              className={cn(
                "w-full py-5 rounded-xl font-bold text-lg transition-all duration-300",
                "flex items-center justify-center gap-3",
                "shadow-lg",
                hasInput && !isLoading
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
                  : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Refine Transcript
                </>
              )}
            </button>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-400 mb-1">
                      Connection Error
                    </h4>
                    <p className="text-red-300/80 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Result Card */}
            <div
              className={cn(
                "rounded-2xl border transition-all duration-500 overflow-hidden",
                result
                  ? "bg-gradient-to-br from-emerald-900/30 to-teal-900/20 border-emerald-500/30 shadow-xl shadow-emerald-500/10"
                  : "bg-slate-800/20 border-slate-700/30"
              )}
            >
              <div className="p-4 border-b border-slate-700/30 bg-slate-800/30">
                <div className="flex items-center gap-2">
                  {result ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-dashed" />
                  )}
                  <h3 className="font-semibold text-slate-200">
                    Corrected Output
                  </h3>
                </div>
              </div>

              <div className="p-6 min-h-[200px] flex items-center justify-center">
                {result ? (
                  <p
                    dir="rtl"
                    className="text-2xl text-slate-100 leading-loose w-full text-center animate-in fade-in zoom-in-95 duration-500"
                    style={{ fontFamily: "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif" }}
                  >
                    {result}
                  </p>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Waves className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-500 text-sm">
                      {isLoading
                        ? "Analyzing hypotheses..."
                        : "Enter your hypotheses and click Refine"}
                    </p>
                  </div>
                )}
              </div>

              {result && (
                <div className="px-6 pb-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="text-sm text-emerald-400/80 hover:text-emerald-400 transition-colors"
                  >
                    📋 Copy to clipboard
                  </button>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-slate-800/20 border border-slate-700/30 rounded-xl p-5">
              <h4 className="font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span className="text-lg">ℹ️</span> How it works
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  Enter 4 ASR model transcriptions (Whisper Large, Whisper Medium, Wav2Vec2 Urdu, Whisper Small)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  The system uses LLM consensus to identify errors
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-1">•</span>
                  Produces a single corrected Urdu transcript
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-600 text-sm">
          <p>CORAL Stage 2 • Urdu ASR Research Project</p>
        </footer>
      </div>
    </div>
  );
}