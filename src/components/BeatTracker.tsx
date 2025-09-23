import React from 'react';
import { Clock, Target, TrendingUp } from 'lucide-react';

interface BeatTrackerProps {
  beats: number[];
  bpm: number;
  duration: number;
}

const BeatTracker: React.FC<BeatTrackerProps> = ({ beats, bpm, duration }) => {
  const calculateStats = () => {
    if (!beats || beats.length === 0) return null;

    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i] - beats[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => 
      sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDeviation = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (stdDeviation / avgInterval) * 2) * 100;

    return {
      avgInterval,
      consistency,
      totalBeats: beats.length,
      expectedBeats: Math.floor(duration * (bpm / 60))
    };
  };

  const stats = calculateStats();

  const renderBeatGrid = () => {
    if (!beats || beats.length === 0) return null;

    const gridWidth = 600;
    const gridHeight = 100;
    const beatsPerRow = Math.min(32, Math.ceil(Math.sqrt(beats.length)));
    const rows = Math.ceil(beats.length / beatsPerRow);
    
    return (
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Beat Pattern Grid</h4>
        <svg width={gridWidth} height={gridHeight} className="w-full">
          {beats.map((beat, index) => {
            const row = Math.floor(index / beatsPerRow);
            const col = index % beatsPerRow;
            const x = (col / (beatsPerRow - 1)) * (gridWidth - 20) + 10;
            const y = (row / Math.max(rows - 1, 1)) * (gridHeight - 20) + 10;
            
            // Color intensity based on beat strength (simplified)
            const intensity = Math.min(1, (index % 4 === 0 ? 1 : 0.6));
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r={intensity === 1 ? 4 : 2}
                fill={intensity === 1 ? '#FFD700' : '#00D4FF'}
                opacity={0.8}
              >
                <title>{`Beat ${index + 1}: ${beat.toFixed(2)}s`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderTempoHistory = () => {
    if (!beats || beats.length < 4) return null;

    const localBPMs = [];
    const windowSize = 4;
    
    for (let i = 0; i <= beats.length - windowSize; i++) {
      const window = beats.slice(i, i + windowSize);
      const intervals = [];
      for (let j = 1; j < window.length; j++) {
        intervals.push(window[j] - window[j - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const localBPM = 60 / avgInterval;
      localBPMs.push({ time: window[0], bpm: localBPM });
    }

    const maxBPM = Math.max(...localBPMs.map(p => p.bpm));
    const minBPM = Math.min(...localBPMs.map(p => p.bpm));
    const range = maxBPM - minBPM;

    return (
      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Tempo Variation Over Time</h4>
        <svg width={600} height={120} className="w-full">
          <defs>
            <linearGradient id="tempoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1={10}
              y1={10 + y}
              x2={590}
              y2={10 + y}
              stroke="#334155"
              strokeWidth="1"
              opacity="0.5"
            />
          ))}

          {/* Tempo line */}
          <polyline
            points={localBPMs.map((point, index) => {
              const x = 10 + (index / (localBPMs.length - 1)) * 580;
              const y = range > 0 ? 110 - ((point.bpm - minBPM) / range) * 100 : 60;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#00D4FF"
            strokeWidth="2"
          />

          {/* Fill area */}
          <polygon
            points={[
              '10,110',
              ...localBPMs.map((point, index) => {
                const x = 10 + (index / (localBPMs.length - 1)) * 580;
                const y = range > 0 ? 110 - ((point.bpm - minBPM) / range) * 100 : 60;
                return `${x},${y}`;
              }),
              '590,110'
            ].join(' ')}
            fill="url(#tempoGradient)"
          />

          {/* Data points */}
          {localBPMs.map((point, index) => {
            const x = 10 + (index / (localBPMs.length - 1)) * 580;
            const y = range > 0 ? 110 - ((point.bpm - minBPM) / range) * 100 : 60;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#FFD700"
                opacity="0.8"
              >
                <title>{`Time: ${point.time.toFixed(1)}s, BPM: ${point.bpm.toFixed(1)}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!stats) {
    return (
      <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6 text-center">
        <p className="text-gray-400">No beat data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-white">Beat Analysis</h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Timing Consistency</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.consistency.toFixed(1)}%</p>
          <p className="text-xs text-gray-400">Beat regularity</p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Beat Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {((stats.totalBeats / stats.expectedBeats) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400">{stats.totalBeats} / {stats.expectedBeats} beats</p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Avg Interval</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgInterval.toFixed(3)}s</p>
          <p className="text-xs text-gray-400">Between beats</p>
        </div>
      </div>

      {/* Visualizations */}
      <div className="space-y-4">
        {renderBeatGrid()}
        {renderTempoHistory()}
      </div>
    </div>
  );
};

export default BeatTracker;