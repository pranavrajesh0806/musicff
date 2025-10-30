import React from 'react';
import { Activity, Gauge, Music as MusicIcon } from 'lucide-react';

interface MusicMetricsProps {
  analysisResults: any;
}

const MusicMetrics: React.FC<MusicMetricsProps> = ({ analysisResults }) => {
  const getStabilityColor = (stability: number) => {
    if (stability > 80) return 'text-green-400';
    if (stability > 60) return 'text-yellow-400';
    if (stability > 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGenreColor = (index: number) => {
    const colors = ['from-blue-500/20 to-blue-600/20 border-blue-500/30', 'from-purple-500/20 to-purple-600/20 border-purple-500/30', 'from-pink-500/20 to-pink-600/20 border-pink-500/30'];
    return colors[index] || colors[0];
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-400" />
          <span>Advanced Music Metrics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-orange-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Gauge className="h-6 w-6 text-orange-400" />
              <h4 className="text-lg font-semibold text-white">Tempo Stability</h4>
            </div>
            <p className={`text-3xl font-bold ${getStabilityColor(analysisResults.tempoVariability?.stability || 0)} mb-2`}>
              {(analysisResults.tempoVariability?.stability || 0).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisResults.tempoVariability?.stability || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Variability: {(analysisResults.tempoVariability?.variability || 0).toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Activity className="h-6 w-6 text-violet-400" />
              <h4 className="text-lg font-semibold text-white">Spectral Spread</h4>
            </div>
            <p className="text-3xl font-bold text-violet-400 mb-2">
              {(analysisResults.spectralSpread?.normalizedSpread || 0).toFixed(1)}%
            </p>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${analysisResults.spectralSpread?.normalizedSpread || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">Frequency distribution</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 border border-rose-500/30 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MusicIcon className="h-6 w-6 text-rose-400" />
              <h4 className="text-lg font-semibold text-white">Dynamic Range</h4>
            </div>
            <p className="text-3xl font-bold text-rose-400 mb-2">
              {(analysisResults.loudness?.dynamicRange || 0).toFixed(1)} dB
            </p>
            <p className="text-sm text-gray-400 mt-3">
              Audio intensity variation
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <MusicIcon className="h-5 w-5 text-blue-400" />
          <span>Estimated Genres</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(analysisResults.genreEstimates || []).map((genre: any, index: number) => (
            <div key={index} className={`bg-gradient-to-br ${getGenreColor(index)} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{genre.name}</h4>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
              <div className="relative w-full bg-gray-800 rounded-full h-2">
                <div
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                  style={{ width: `${genre.confidence}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">{genre.confidence}% confidence</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Spectral Spread Over Time</h3>
        <svg width="100%" height="80" className="bg-black rounded-lg">
          <defs>
            <linearGradient id="spreadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2"/>
            </linearGradient>
          </defs>
          <polyline
            points={(analysisResults.spectralSpread?.spectralSpreadOverTime || []).map((spread: number, i: number) => {
              const x = (i / Math.max(1, (analysisResults.spectralSpread?.spectralSpreadOverTime || []).length - 1)) * 100;
              const y = 70 - (spread / 100) * 60;
              return `${x}%,${y}`;
            }).join(' ')}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
          />
          <polygon
            points={[
              '0%,70',
              ...(analysisResults.spectralSpread?.spectralSpreadOverTime || []).map((spread: number, i: number) => {
                const x = (i / Math.max(1, (analysisResults.spectralSpread?.spectralSpreadOverTime || []).length - 1)) * 100;
                const y = 70 - (spread / 100) * 60;
                return `${x}%,${y}`;
              }),
              '100%,70'
            ].join(' ')}
            fill="url(#spreadGradient)"
          />
        </svg>
      </div>
    </div>
  );
};

export default MusicMetrics;
