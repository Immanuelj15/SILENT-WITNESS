import React, { useState } from 'react';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle, Loader2, Sparkles, Play } from 'lucide-react';

export default function AudioAnalyzer({ onAnalysisComplete = null }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validExtensions = ['wav', 'mp3', 'm4a', 'webm', 'ogg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported audio format '.${ext}'. Please provide WAV, MP3, M4A, WebM or OGG.`);
      setSelectedFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds 25MB maximum upload limit.");
      setSelectedFile(null);
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/analyze-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with HTTP status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error processing audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Pre-load synthetic test audio generator for zero-friction evaluation
  const handleGenerateSyntheticSample = async (isScam) => {
    setIsUploading(true);
    setErrorMessage('');
    try {
      // Create a test WAV in memory with synthetic sine tones
      const sampleRate = 16000;
      const numSeconds = 2;
      const numSamples = sampleRate * numSeconds;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // Write standard RIFF/WAV header
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Generate synthetic pitch tone (180 Hz with minimal jitter)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const sample = Math.sin(2 * Math.PI * 180 * t) * 0.4;
        view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const testFile = new File([blob], isScam ? 'suspected_clone_sample.wav' : 'human_sample.wav', { type: 'audio/wav' });
      setSelectedFile(testFile);

      // Post to backend
      const formData = new FormData();
      formData.append('file', testFile);

      const response = await fetch('http://localhost:8000/api/analyze-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sample');
      }

      const data = await response.json();
      setResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      setErrorMessage('Sample generation error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileAudio size={20} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recorded Call Audio Analyzer
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          WAV, MP3, M4A, WebM (Max 25MB)
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        style={{
          border: '2px dashed rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          padding: '36px 20px',
          textAlign: 'center',
          background: 'rgba(7, 11, 20, 0.5)',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.2s ease'
        }}
        onClick={() => document.getElementById('audio-upload-input')?.click()}
      >
        <UploadCloud size={40} color="var(--accent-cyan)" style={{ margin: '0 auto 10px', display: 'block' }} />
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
          {selectedFile ? selectedFile.name : 'Click or Drag & Drop audio file here'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB ready for acoustic & transcript evaluation` : 'Supports standard recorded calls from phone or web meeting'}
        </div>
        <input
          id="audio-upload-input"
          type="file"
          accept=".wav,.mp3,.m4a,.webm,.ogg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {errorMessage && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handleUploadAndAnalyze}
          disabled={!selectedFile || isUploading}
          className="btn-primary"
          style={{ opacity: (!selectedFile || isUploading) ? 0.6 : 1 }}
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing Acoustic Signals...
            </>
          ) : (
            <>
              <FileAudio size={16} />
              Run Forensic Voice Analysis
            </>
          )}
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleGenerateSyntheticSample(true)}
            className="btn-secondary"
            style={{ fontSize: '0.8rem' }}
            disabled={isUploading}
          >
            <Sparkles size={14} color="#f59e0b" /> Test Synthetic Sample
          </button>
        </div>
      </div>
    </div>
  );
}
