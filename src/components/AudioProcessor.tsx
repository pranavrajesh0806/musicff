import React, { useState, useCallback } from 'react';
import { BarChart3, Zap } from 'lucide-react';

interface AudioProcessorProps {
  audioBuffer: AudioBuffer;
  onAnalysisComplete: (results: any) => void;
  onAnalysisStart: () => void;
}

const AudioProcessor: React.FC<AudioProcessorProps> = ({
  audioBuffer,
  onAnalysisComplete,
  onAnalysisStart
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // STFT implementation
  const stft = useCallback((signal: Float32Array, windowSize: number = 2048, hopSize: number = 512) => {
    const numFrames = Math.floor((signal.length - windowSize) / hopSize) + 1;
    const fftSize = windowSize;
    const spectrogram: Float32Array[] = [];

    // Hanning window
    const window = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (windowSize - 1)));
    }

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopSize;
      const windowed = new Float32Array(fftSize);
      
      // Apply window
      for (let i = 0; i < windowSize && start + i < signal.length; i++) {
        windowed[i] = signal[start + i] * window[i];
      }

      // Simple magnitude spectrum (approximation)
      const magnitude = new Float32Array(fftSize / 2);
      for (let k = 0; k < fftSize / 2; k++) {
        let real = 0, imag = 0;
        for (let n = 0; n < fftSize; n++) {
          const angle = -2 * Math.PI * k * n / fftSize;
          real += windowed[n] * Math.cos(angle);
          imag += windowed[n] * Math.sin(angle);
        }
        magnitude[k] = Math.sqrt(real * real + imag * imag);
      }
      
      spectrogram.push(magnitude);
    }

    return spectrogram;
  }, []);

  // Onset detection using spectral flux
  const detectOnsets = useCallback((spectrogram: Float32Array[]) => {
    const onsets: number[] = [];
    const spectralFlux: number[] = [];

    for (let i = 1; i < spectrogram.length; i++) {
      let flux = 0;
      for (let k = 0; k < spectrogram[i].length; k++) {
        const diff = spectrogram[i][k] - spectrogram[i - 1][k];
        if (diff > 0) {
          flux += diff;
        }
      }
      spectralFlux.push(flux);
    }

    // Find peaks in spectral flux
    const threshold = spectralFlux.reduce((a, b) => a + b, 0) / spectralFlux.length * 1.5;
    
    for (let i = 1; i < spectralFlux.length - 1; i++) {
      if (spectralFlux[i] > threshold && 
          spectralFlux[i] > spectralFlux[i - 1] && 
          spectralFlux[i] > spectralFlux[i + 1]) {
        // Convert frame index to time (assuming hop size of 512 samples)
        const timeSeconds = (i + 1) * 512 / audioBuffer.sampleRate;
        onsets.push(timeSeconds);
      }
    }

    return { onsets, spectralFlux };
  }, [audioBuffer.sampleRate]);

  // BPM estimation using autocorrelation
  const estimateBPM = useCallback((onsets: number[]) => {
    if (onsets.length < 4) return { bpm: 0, confidence: 0 };

    // Convert onsets to inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    // Find most common interval using histogram
    const minInterval = 60 / 200; // 200 BPM max
    const maxInterval = 60 / 60;  // 60 BPM min
    const histogramSize = 100;
    const histogram = new Array(histogramSize).fill(0);

    intervals.forEach(interval => {
      if (interval >= minInterval && interval <= maxInterval) {
        const bin = Math.floor((interval - minInterval) / (maxInterval - minInterval) * (histogramSize - 1));
        histogram[bin]++;
      }
    });

    // Find peak
    let maxCount = 0;
    let peakBin = 0;
    for (let i = 0; i < histogramSize; i++) {
      if (histogram[i] > maxCount) {
        maxCount = histogram[i];
        peakBin = i;
      }
    }

    const peakInterval = minInterval + (peakBin / (histogramSize - 1)) * (maxInterval - minInterval);
    const bpm = 60 / peakInterval;
    const confidence = maxCount / intervals.length;

    return { bpm, confidence };
  }, []);

  // Beat tracking
  const trackBeats = useCallback((onsets: number[], bpm: number, duration: number) => {
    if (bpm <= 0) return onsets.slice(); // Return onsets if BPM estimation failed

    const beatInterval = 60 / bpm;
    const beats: number[] = [];

    // Find the best starting point based on onsets
    let bestStart = 0;
    let maxScore = 0;

    for (let start = 0; start < Math.min(2, duration); start += 0.1) {
      let score = 0;
      for (let beatTime = start; beatTime < duration; beatTime += beatInterval) {
        // Find closest onset
        const closestOnset = onsets.reduce((closest, onset) => 
          Math.abs(onset - beatTime) < Math.abs(closest - beatTime) ? onset : closest
        );
        
        if (Math.abs(closestOnset - beatTime) < beatInterval * 0.2) {
          score++;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestStart = start;
      }
    }

    // Generate beats from best starting point
    for (let beatTime = bestStart; beatTime < duration; beatTime += beatInterval) {
      beats.push(beatTime);
    }

    return beats;
  }, []);

  const analyzeAudio = useCallback(async () => {
    setIsAnalyzing(true);
    onAnalysisStart();

    try {
      // Get mono channel data
      const channelData = audioBuffer.getChannelData(0);
      
      // Perform STFT
      const spectrogram = stft(channelData);
      
      // Detect onsets
      const { onsets } = detectOnsets(spectrogram);
      
      // Estimate BPM
      const { bpm: estimatedBpm, confidence } = estimateBPM(onsets);
      
      // Track beats
      const beats = trackBeats(onsets, estimatedBpm, audioBuffer.duration);
      
      // Calculate accuracy (if we had ground truth, we'd compare here)
      const accuracy = confidence;

      const results = {
        estimatedBpm,
        beats,
        onsets,
        confidence,
        accuracy,
        spectrogram,
        duration: audioBuffer.duration
      };

      setTimeout(() => {
        onAnalysisComplete(results);
      }, 1000); // Small delay for better UX

    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
    }
  }, [audioBuffer, stft, detectOnsets, estimateBPM, trackBeats, onAnalysisComplete, onAnalysisStart]);

  return (
    <button
      onClick={analyzeAudio}
      disabled={isAnalyzing}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
        isAnalyzing
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 shadow-lg hover:shadow-yellow-500/25'
      }`}
    >
      {isAnalyzing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span>Analyzing...</span>
        </>
      ) : (
        <>
          <BarChart3 className="h-4 w-4" />
          <span>Analyze Audio</span>
        </>
      )}
    </button>
  );
};

export default AudioProcessor;