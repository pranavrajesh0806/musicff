import React, { useState, useCallback } from 'react';
import { Upload, Mic, Play, Pause, Download, Music, Zap, BarChart3 } from 'lucide-react';
import AudioUploader from './components/AudioUploader';
import AudioRecorder from './components/AudioRecorder';
import AudioProcessor from './components/AudioProcessor';
import Visualizer from './components/Visualizer';
import BeatTracker from './components/BeatTracker';
import ExportManager from './components/ExportManager';

interface AudioData {
  buffer: AudioBuffer;
  file?: File;
  bpm?: number;
  beats?: number[];
  metadata?: {
    title?: string;
    artist?: string;
    bpm?: number;
  };
}

function App() {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');

  const handleAudioLoad = useCallback((data: AudioData) => {
    setAudioData(data);
    setCurrentTime(0);
    setIsPlaying(false);
    setAnalysisResults(null);
  }, []);

  const handleAnalysisComplete = useCallback((results: any) => {
    setAnalysisResults(results);
    setIsAnalyzing(false);
    if (audioData) {
      setAudioData({
        ...audioData,
        bpm: results.estimatedBpm,
        beats: results.beats
      });
    }
  }, [audioData]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-auto">
      {/* Header */}
      <header className="border-b border-blue-500/30 bg-black/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-yellow-400 rounded-lg">
                <Music className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                  BeatScope
                </h1>
                <p className="text-sm text-gray-400">Music Tempo & Beat Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Zap className="h-4 w-4" />
                <span>Real-time Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Input Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Audio Input</h2>
            <p className="text-gray-400">Upload or record audio to analyze tempo and beats</p>
          </div>

          {/* Tab Selector */}
          <div className="flex justify-center">
            <div className="bg-gray-900/50 p-1 rounded-lg border border-blue-500/30">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-all duration-300 ${
                    activeTab === 'upload'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => setActiveTab('record')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-md transition-all duration-300 ${
                    activeTab === 'record'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                  <span>Record Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Input Components */}
          <div className="max-w-2xl mx-auto">
            {activeTab === 'upload' ? (
              <AudioUploader onAudioLoad={handleAudioLoad} />
            ) : (
              <AudioRecorder onAudioLoad={handleAudioLoad} />
            )}
          </div>
        </section>

        {/* Audio Info & Controls */}
        {audioData && (
          <section className="bg-gray-900/30 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Audio Loaded</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>Duration: {(audioData.buffer.duration).toFixed(2)}s</p>
                  <p>Sample Rate: {audioData.buffer.sampleRate}Hz</p>
                  <p>Channels: {audioData.buffer.numberOfChannels}</p>
                  {audioData.file && <p>File: {audioData.file.name}</p>}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlayback}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors duration-300"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                
                <AudioProcessor
                  audioBuffer={audioData.buffer}
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisStart={() => setIsAnalyzing(true)}
                />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-yellow-400 h-2 rounded-full transition-all duration-100"
                style={{ width: `${(currentTime / audioData.buffer.duration) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Analysis Results</h2>
              <p className="text-gray-400">Tempo detection and beat tracking results</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Estimated BPM</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">{analysisResults.estimatedBpm?.toFixed(1) || 'N/A'}</p>
                <p className="text-sm text-gray-400 mt-2">Beats per minute</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-lg font-semibold text-white">Beat Count</h3>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{analysisResults.beats?.length || 0}</p>
                <p className="text-sm text-gray-400 mt-2">Detected beats</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Music className="h-6 w-6 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Accuracy</h3>
                </div>
                <p className="text-3xl font-bold text-green-400">
                  {analysisResults.accuracy ? `${(analysisResults.accuracy * 100).toFixed(1)}%` : 'N/A'}
                </p>
                <p className="text-sm text-gray-400 mt-2">Beat detection</p>
              </div>
            </div>

            {/* Visualizations */}
            <div className="space-y-6">
              <Visualizer
                audioBuffer={audioData!.buffer}
                beats={analysisResults.beats}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeUpdate={setCurrentTime}
              />

              <BeatTracker
                beats={analysisResults.beats}
                bpm={analysisResults.estimatedBpm}
                duration={audioData!.buffer.duration}
              />
            </div>

            {/* Export Section */}
            <ExportManager
              analysisResults={analysisResults}
              audioData={audioData!}
            />
          </section>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <section className="text-center py-12">
            <div className="inline-flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-lg text-gray-400">Analyzing audio...</span>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-500/30 bg-black/95 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-gray-400">
            Built with Web Audio API and advanced signal processing techniques
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;