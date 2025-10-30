import React from 'react';
import { Volume2, Zap, Smile, Radio, Activity } from 'lucide-react';

interface AudioFeaturesProps {
  analysisResults: any;
}

const AudioFeatures: React.FC<AudioFeaturesProps> = ({ analysisResults }) => {
  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      'Energetic': 'text-red-400',
      'High Energy': 'text-red-500',
      'Upbeat': 'text-orange-400',
      'Euphoric': 'text-yellow-400',
      'Calm': 'text-blue-400',
      'Very Calm': 'text-blue-500',
      'Relaxed': 'text-green-400',
      'Peaceful': 'text-teal-400',
      'Melancholic': 'text-gray-400',
      'Intense': 'text-pink-500',
      'Neutral': 'text-gray-300'
    };
    return moodColors[mood] || 'text-gray-300';
  };

  const getMoodGradient = (mood: string) => {
    const gradients: Record<string, string> = {
      'Energetic': 'from-red-500/20 to-red-600/20 border-red-500/30',
      'High Energy': 'from-red-600/20 to-pink-600/20 border-red-500/30',
      'Upbeat': 'from-orange-500/20 to-yellow-600/20 border-orange-500/30',
      'Euphoric': 'from-yellow-500/20 to-pink-600/20 border-yellow-500/30',
      'Calm': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      'Very Calm': 'from-blue-600/20 to-cyan-600/20 border-blue-500/30',
      'Relaxed': 'from-green-500/20 to-green-600/20 border-green-500/30',
      'Peaceful': 'from-teal-500/20 to-cyan-600/20 border-teal-500/30',
      'Melancholic': 'from-gray-600/20 to-gray-700/20 border-gray-500/30',
      'Intense': 'from-pink-500/20 to-red-600/20 border-pink-500/30',
      'Neutral': 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    };
    return gradients[mood] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <span>Audio Features & Characteristics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`bg-gradient-to-br ${getMoodGradient(analysisResults.mood?.mood)} border rounded-xl p-6`}>
            <div className="flex items-center space-x-3 mb-4">
              <Smile className={`h-6 w-6 ${getMoodColor(analysisResults.mood?.mood)}`} />
              <h4 className="text-lg font-semibold text-white">Mood</h4>
            </div>
            <p className={`text-3xl font-bold ${getMoodColor(analysisResults.mood?.mood)} mb-2`}>
              {analysisResults.mood?.mood}
            </p>
            <div className="space-y-1 text-sm text-gray-300">
              <p>Valence: <span className="font-medium">{analysisResults.mood?.valence}</span></p>
              <p>Arousal: <span className="font-medium">{analysisResults.mood?.arousal}</span></p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-6 w-6 text-yellow-400" />
              <h4 className="text-lg font-semibold text-white">Energy Level</h4>
            </div>
            <p className="text-3xl font-bold text-yellow-400 mb-2">
              {analysisResults.energy?.avgEnergy?.toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisResults.energy?.avgEnergy || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              High energy: {((analysisResults.energy?.highEnergyRatio || 0) * 100).toFixed(0)}% of track
            </p>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Volume2 className="h-6 w-6 text-cyan-400" />
              <h4 className="text-lg font-semibold text-white">Loudness</h4>
            </div>
            <p className="text-3xl font-bold text-cyan-400 mb-2">
              {analysisResults.loudness?.avgLoudness?.toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisResults.loudness?.avgLoudness || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Dynamic range: {analysisResults.loudness?.dynamicRange?.toFixed(1)} dB
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-teal-600/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Radio className="h-6 w-6 text-green-400" />
              <h4 className="text-lg font-semibold text-white">Brightness</h4>
            </div>
            <p className="text-3xl font-bold text-green-400 mb-2">
              {((analysisResults.spectralCentroid?.brightness || 0) * 100).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(analysisResults.spectralCentroid?.brightness || 0) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Avg centroid: {(analysisResults.spectralCentroid?.avgCentroid || 0).toFixed(0)} Hz
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-pink-400" />
              <h4 className="text-lg font-semibold text-white">Complexity</h4>
            </div>
            <p className="text-3xl font-bold text-pink-400 mb-2">
              {((analysisResults.zeroCrossingRate?.avgZCR || 0) * 100).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (analysisResults.zeroCrossingRate?.avgZCR || 0) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">Zero-crossing rate</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Radio className="h-6 w-6 text-blue-400" />
              <h4 className="text-lg font-semibold text-white">Key (Est.)</h4>
            </div>
            <p className="text-2xl font-bold text-blue-400 mb-2">
              {analysisResults.key}
            </p>
            <p className="text-xs text-gray-400">Based on spectral analysis</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Energy & Loudness Over Time</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Energy Meter</span>
              <Zap className="h-4 w-4 text-yellow-400" />
            </div>
            <svg width="100%" height="60" className="bg-black rounded-lg">
              {analysisResults.energy?.energyOverTime.map((energy: number, i: number) => {
                const x = (i / analysisResults.energy.energyOverTime.length) * 100;
                const height = (energy / 100) * 50;
                const color = energy > 70 ? '#f59e0b' : energy > 40 ? '#10b981' : '#3b82f6';

                return (
                  <rect
                    key={i}
                    x={`${x}%`}
                    y={50 - height}
                    width={`${100 / analysisResults.energy.energyOverTime.length}%`}
                    height={height}
                    fill={color}
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Loudness Profile</span>
              <Volume2 className="h-4 w-4 text-cyan-400" />
            </div>
            <svg width="100%" height="60" className="bg-black rounded-lg">
              <defs>
                <linearGradient id="loudnessGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2"/>
                </linearGradient>
              </defs>
              <polyline
                points={analysisResults.loudness?.loudnessOverTime.map((loudness: number, i: number) => {
                  const x = (i / analysisResults.loudness.loudnessOverTime.length) * 100;
                  const y = 50 - (loudness / 100) * 45;
                  return `${x}%,${y}`;
                }).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <polygon
                points={[
                  '0%,50',
                  ...analysisResults.loudness?.loudnessOverTime.map((loudness: number, i: number) => {
                    const x = (i / analysisResults.loudness.loudnessOverTime.length) * 100;
                    const y = 50 - (loudness / 100) * 45;
                    return `${x}%,${y}`;
                  }),
                  '100%,50'
                ].join(' ')}
                fill="url(#loudnessGradient)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioFeatures;
