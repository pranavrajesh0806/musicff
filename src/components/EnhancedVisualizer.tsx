import React from 'react';
import { Volume2, Zap, Smile } from 'lucide-react';

interface EnhancedVisualizerProps {
  analysisResults: any;
}

const EnhancedVisualizer: React.FC<EnhancedVisualizerProps> = ({ analysisResults }) => {
  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      'Energetic': '⚡',
      'High Energy': '🔥',
      'Upbeat': '😄',
      'Euphoric': '🎉',
      'Calm': '😌',
      'Very Calm': '🧘',
      'Relaxed': '😎',
      'Peaceful': '🕊️',
      'Melancholic': '😢',
      'Intense': '💪',
      'Neutral': '😐'
    };
    return emojis[mood] || '🎵';
  };

  const getMoodBgColor = (mood: string) => {
    const colors: Record<string, string> = {
      'Energetic': 'from-red-500 to-red-600',
      'High Energy': 'from-red-600 to-pink-600',
      'Upbeat': 'from-orange-500 to-yellow-600',
      'Euphoric': 'from-yellow-500 to-pink-600',
      'Calm': 'from-blue-500 to-blue-600',
      'Very Calm': 'from-blue-600 to-cyan-600',
      'Relaxed': 'from-green-500 to-green-600',
      'Peaceful': 'from-teal-500 to-cyan-600',
      'Melancholic': 'from-gray-600 to-gray-700',
      'Intense': 'from-pink-500 to-red-600',
      'Neutral': 'from-gray-500 to-gray-600'
    };
    return colors[mood] || 'from-blue-500 to-blue-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Energy Visualization</span>
        </h3>

        <div className="space-y-4">
          <div className="relative h-32 bg-black rounded-lg overflow-hidden border border-gray-700">
            <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
              <defs>
                <linearGradient id="energyGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3"/>
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity="1"/>
                </linearGradient>
              </defs>
              {(analysisResults.energy?.energyOverTime || []).map((energy: number, i: number) => {
                const x = (i / Math.max(1, (analysisResults.energy?.energyOverTime || []).length - 1)) * 100;
                const height = (energy / 100) * 100;
                return (
                  <rect
                    key={i}
                    x={`${x}%`}
                    y={`${100 - height}%`}
                    width={`${100 / Math.max(1, (analysisResults.energy?.energyOverTime || []).length)}%`}
                    height={`${height}%`}
                    fill="url(#energyGrad)"
                    opacity="0.8"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-10 bg-black/60 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-400">Energy Level</p>
                <p className="text-2xl font-bold text-yellow-400">{(analysisResults.energy?.avgEnergy || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">High Energy Sections</p>
              <p className="text-yellow-400 font-semibold">{((analysisResults.energy?.highEnergyRatio || 0) * 100).toFixed(0)}%</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Energy Variance</p>
              <p className="text-orange-400 font-semibold">{(analysisResults.energy?.energyVariance || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-cyan-400" />
          <span>Loudness Profile</span>
        </h3>

        <div className="space-y-4">
          <div className="relative h-32 bg-black rounded-lg overflow-hidden border border-gray-700">
            <svg width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0">
              <defs>
                <linearGradient id="loudnessGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3"/>
                  <stop offset="50%" stopColor="#0891b2" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="1"/>
                </linearGradient>
              </defs>
              <polyline
                points={(analysisResults.loudness?.loudnessOverTime || []).map((loudness: number, i: number) => {
                  const x = (i / Math.max(1, (analysisResults.loudness?.loudnessOverTime || []).length - 1)) * 100;
                  const y = 100 - (loudness / 100) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <polygon
                points={[
                  '0%,100%',
                  ...(analysisResults.loudness?.loudnessOverTime || []).map((loudness: number, i: number) => {
                    const x = (i / Math.max(1, (analysisResults.loudness?.loudnessOverTime || []).length - 1)) * 100;
                    const y = 100 - (loudness / 100) * 100;
                    return `${x}%,${y}%`;
                  }),
                  '100%,100%'
                ].join(' ')}
                fill="url(#loudnessGrad)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center z-10 bg-black/60 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-400">Loudness</p>
                <p className="text-2xl font-bold text-cyan-400">{(analysisResults.loudness?.avgLoudness || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Max Loudness</p>
              <p className="text-cyan-400 font-semibold">{(analysisResults.loudness?.maxLoudness || 0).toFixed(1)} dB</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <p className="text-gray-400 text-xs mb-1">Dynamic Range</p>
              <p className="text-blue-400 font-semibold">{(analysisResults.loudness?.dynamicRange || 0).toFixed(1)} dB</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-br ${getMoodBgColor(analysisResults.mood?.mood)} rounded-xl p-8 border-2 ${getMoodBgColor(analysisResults.mood?.mood).replace('from-', 'border-').split(' ')[0]}/50`}>
        <div className="text-center space-y-4">
          <div className="text-6xl">{getMoodEmoji(analysisResults.mood?.mood)}</div>
          <div>
            <h3 className="text-4xl font-bold text-white mb-2">{analysisResults.mood?.mood}</h3>
            <p className="text-lg text-white/80 mb-4">Music Mood Analysis</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white/60 text-xs mb-1">Valence</p>
              <p className="text-white font-semibold">{analysisResults.mood?.valence}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p className="text-white/60 text-xs mb-1">Arousal</p>
              <p className="text-white font-semibold">{analysisResults.mood?.arousal}</p>
            </div>
          </div>

          <div className="pt-2 text-sm text-white/80">
            <p>Tempo: <span className="font-semibold text-white">{(analysisResults.estimatedBpm || 0).toFixed(0)} BPM</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVisualizer;
