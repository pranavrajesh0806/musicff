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
    if (bpm <= 0) return onsets.slice();

    const beatInterval = 60 / bpm;
    const beats: number[] = [];

    let bestStart = 0;
    let maxScore = 0;

    for (let start = 0; start < Math.min(2, duration); start += 0.1) {
      let score = 0;
      for (let beatTime = start; beatTime < duration; beatTime += beatInterval) {
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

    for (let beatTime = bestStart; beatTime < duration; beatTime += beatInterval) {
      beats.push(beatTime);
    }

    return beats;
  }, []);

  const analyzeLoudness = useCallback((channelData: Float32Array, hopSize: number = 512) => {
    const loudnessOverTime: number[] = [];
    let totalLoudness = 0;
    let maxLoudness = 0;

    for (let i = 0; i < channelData.length; i += hopSize) {
      let rms = 0;
      const end = Math.min(i + hopSize, channelData.length);

      for (let j = i; j < end; j++) {
        rms += channelData[j] * channelData[j];
      }

      rms = Math.sqrt(rms / (end - i));
      const loudness = 20 * Math.log10(rms + 1e-10);

      loudnessOverTime.push(loudness);
      totalLoudness += loudness;
      maxLoudness = Math.max(maxLoudness, loudness);
    }

    const avgLoudness = totalLoudness / loudnessOverTime.length;
    const normalizedLoudness = loudnessOverTime.map(l =>
      Math.max(0, Math.min(100, ((l - avgLoudness + 40) / 40) * 100))
    );

    return {
      loudnessOverTime: normalizedLoudness,
      avgLoudness: Math.max(0, Math.min(100, ((avgLoudness + 40) / 40) * 100)),
      maxLoudness,
      dynamicRange: maxLoudness - avgLoudness
    };
  }, []);

  const analyzeEnergy = useCallback((spectrogram: Float32Array[], channelData: Float32Array) => {
    const energyOverTime: number[] = [];
    let totalEnergy = 0;

    spectrogram.forEach(frame => {
      let frameEnergy = 0;
      for (let i = 0; i < frame.length; i++) {
        frameEnergy += frame[i] * frame[i];
      }
      energyOverTime.push(frameEnergy);
      totalEnergy += frameEnergy;
    });

    const avgEnergy = totalEnergy / energyOverTime.length;
    const maxEnergy = Math.max(...energyOverTime);

    const normalizedEnergy = energyOverTime.map(e =>
      (e / maxEnergy) * 100
    );

    const highEnergyRatio = energyOverTime.filter(e => e > avgEnergy * 1.5).length / energyOverTime.length;

    return {
      energyOverTime: normalizedEnergy,
      avgEnergy: (avgEnergy / maxEnergy) * 100,
      highEnergyRatio,
      energyVariance: energyOverTime.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energyOverTime.length
    };
  }, []);

  const analyzeSpectralCentroid = useCallback((spectrogram: Float32Array[], sampleRate: number) => {
    const centroids: number[] = [];

    spectrogram.forEach(frame => {
      let weightedSum = 0;
      let totalMagnitude = 0;

      for (let k = 0; k < frame.length; k++) {
        const frequency = (k * sampleRate) / (2 * frame.length);
        weightedSum += frequency * frame[k];
        totalMagnitude += frame[k];
      }

      const centroid = totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;
      centroids.push(centroid);
    });

    const avgCentroid = centroids.reduce((a, b) => a + b, 0) / centroids.length;

    return {
      avgCentroid,
      centroidOverTime: centroids,
      brightness: avgCentroid / (sampleRate / 2)
    };
  }, []);

  const analyzeZeroCrossingRate = useCallback((channelData: Float32Array, hopSize: number = 512) => {
    const zcrOverTime: number[] = [];

    for (let i = 0; i < channelData.length - hopSize; i += hopSize) {
      let crossings = 0;

      for (let j = i; j < i + hopSize - 1; j++) {
        if ((channelData[j] >= 0 && channelData[j + 1] < 0) ||
            (channelData[j] < 0 && channelData[j + 1] >= 0)) {
          crossings++;
        }
      }

      zcrOverTime.push(crossings / hopSize);
    }

    const avgZCR = zcrOverTime.reduce((a, b) => a + b, 0) / zcrOverTime.length;

    return {
      avgZCR,
      zcrOverTime
    };
  }, []);

  const analyzeTempoVariability = useCallback((onsets: number[], estimatedBpm: number) => {
    if (onsets.length < 4) return { variability: 0, stability: 100 };

    const intervals: number[] = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i] - onsets[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const variability = (stdDev / avgInterval) * 100;
    const stability = Math.max(0, Math.min(100, 100 - variability));

    return {
      variability: Math.min(100, variability),
      stability,
      averageInterval: avgInterval
    };
  }, []);

  const analyzeSpectralSpread = useCallback((spectrogram: Float32Array[], sampleRate: number) => {
    const spreads: number[] = [];

    spectrogram.forEach(frame => {
      let weightedSum = 0;
      let totalMagnitude = 0;
      let centroid = 0;

      for (let k = 0; k < frame.length; k++) {
        const frequency = (k * sampleRate) / (2 * frame.length);
        weightedSum += frequency * frame[k];
        totalMagnitude += frame[k];
      }

      centroid = totalMagnitude > 0 ? weightedSum / totalMagnitude : 0;

      let spreadSum = 0;
      for (let k = 0; k < frame.length; k++) {
        const frequency = (k * sampleRate) / (2 * frame.length);
        const deviation = Math.pow(frequency - centroid, 2);
        spreadSum += deviation * frame[k];
      }

      const spread = Math.sqrt(spreadSum / totalMagnitude);
      spreads.push(spread);
    });

    const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
    const maxSpread = Math.max(...spreads);
    const normalizedSpread = (avgSpread / maxSpread) * 100;

    return {
      avgSpread,
      spectralSpreadOverTime: spreads.map(s => (s / maxSpread) * 100),
      normalizedSpread: Math.min(100, normalizedSpread)
    };
  }, []);

  const estimateGenre = useCallback((
    bpm: number,
    energy: number,
    brightness: number,
    spectralSpread: number,
    zeroCrossingRate: number
  ) => {
    const genres: Array<{ name: string; confidence: number }> = [];

    if (bpm >= 120 && energy > 60 && brightness > 0.5) {
      genres.push({ name: 'Electronic/House', confidence: 85 });
    }
    if (bpm >= 90 && bpm <= 110 && energy > 50) {
      genres.push({ name: 'Hip-Hop/Rap', confidence: 75 });
    }
    if (bpm >= 140 && energy > 70) {
      genres.push({ name: 'Drum & Bass/EDM', confidence: 80 });
    }
    if (bpm < 90 && energy < 40 && brightness < 0.4) {
      genres.push({ name: 'Jazz/Soul', confidence: 70 });
    }
    if (bpm < 80 && energy < 35 && zeroCrossingRate < 0.1) {
      genres.push({ name: 'Classical/Ambient', confidence: 75 });
    }
    if (spectralSpread > 60 && energy > 50) {
      genres.push({ name: 'Rock/Alternative', confidence: 70 });
    }
    if (bpm >= 160 && energy > 75) {
      genres.push({ name: 'Metal', confidence: 70 });
    }

    if (genres.length === 0) {
      genres.push({ name: 'Pop', confidence: 50 });
    }

    genres.sort((a, b) => b.confidence - a.confidence);
    return genres.slice(0, 3);
  }, []);

  const estimateMood = useCallback((bpm: number, energy: number, loudness: number, brightness: number) => {
    let mood = 'Neutral';
    let moodScore = { energetic: 0, calm: 0, dark: 0, bright: 0 };

    if (bpm > 120 && energy > 50) {
      moodScore.energetic = 80;
      mood = 'Energetic';
    } else if (bpm < 90 && energy < 40) {
      moodScore.calm = 80;
      mood = 'Calm';
    } else if (bpm >= 90 && bpm <= 120) {
      if (energy > 60) {
        moodScore.energetic = 60;
        mood = 'Upbeat';
      } else if (energy < 35) {
        moodScore.calm = 60;
        mood = 'Relaxed';
      }
    }

    if (brightness < 0.3 && loudness < 40) {
      moodScore.dark = 70;
      if (mood === 'Calm') mood = 'Melancholic';
      else if (mood === 'Energetic') mood = 'Intense';
    } else if (brightness > 0.6 && loudness > 60) {
      moodScore.bright = 70;
      if (mood === 'Calm') mood = 'Peaceful';
      else if (mood === 'Energetic') mood = 'Euphoric';
    }

    if (bpm > 140 && energy > 70) {
      mood = 'High Energy';
    } else if (bpm < 70 && energy < 30) {
      mood = 'Very Calm';
    }

    return {
      mood,
      moodScore,
      valence: brightness > 0.5 ? 'Positive' : 'Neutral',
      arousal: energy > 50 ? 'High' : energy > 30 ? 'Medium' : 'Low'
    };
  }, []);

  const analyzeAudio = useCallback(async () => {
    setIsAnalyzing(true);
    onAnalysisStart();

    try {
      const channelData = audioBuffer.getChannelData(0);

      const spectrogram = stft(channelData);

      const { onsets } = detectOnsets(spectrogram);

      const { bpm: estimatedBpm, confidence } = estimateBPM(onsets);

      const beats = trackBeats(onsets, estimatedBpm, audioBuffer.duration);

      const loudnessData = analyzeLoudness(channelData);

      const energyData = analyzeEnergy(spectrogram, channelData);

      const spectralData = analyzeSpectralCentroid(spectrogram, audioBuffer.sampleRate);

      const zcrData = analyzeZeroCrossingRate(channelData);

      const tempoVariability = analyzeTempoVariability(onsets, estimatedBpm);

      const spectralSpread = analyzeSpectralSpread(spectrogram, audioBuffer.sampleRate);

      const moodData = estimateMood(
        estimatedBpm,
        energyData.avgEnergy,
        loudnessData.avgLoudness,
        spectralData.brightness
      );

      const genreEstimates = estimateGenre(
        estimatedBpm,
        energyData.avgEnergy,
        spectralData.brightness,
        spectralSpread.normalizedSpread,
        zcrData.avgZCR
      );

      const accuracy = confidence;

      const results = {
        estimatedBpm,
        beats,
        onsets,
        confidence,
        accuracy,
        spectrogram,
        duration: audioBuffer.duration,
        loudness: loudnessData,
        energy: energyData,
        spectralCentroid: spectralData,
        zeroCrossingRate: zcrData,
        mood: moodData,
        key: spectralData.brightness > 0.5 ? 'Major (Estimated)' : 'Minor (Estimated)',
        tempoVariability,
        spectralSpread,
        genreEstimates
      };

      setTimeout(() => {
        onAnalysisComplete(results);
      }, 1000);

    } catch (error) {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
    }
  }, [audioBuffer, stft, detectOnsets, estimateBPM, trackBeats, analyzeLoudness, analyzeEnergy, analyzeSpectralCentroid, analyzeZeroCrossingRate, analyzeTempoVariability, analyzeSpectralSpread, estimateMood, estimateGenre, onAnalysisComplete, onAnalysisStart]);

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