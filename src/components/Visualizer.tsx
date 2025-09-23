import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VisualizerProps {
  audioBuffer: AudioBuffer;
  beats: number[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
}

const Visualizer: React.FC<VisualizerProps> = ({
  audioBuffer,
  beats,
  currentTime,
  isPlaying,
  onTimeUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [playbackTime, setPlaybackTime] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    drawWaveform();
  }, [audioBuffer, beats, currentTime]);

  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = audioBuffer.getChannelData(0);
    const duration = audioBuffer.duration;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = '#00D4FF';
    ctx.lineWidth = 1;

    const samplesPerPixel = Math.floor(data.length / width);
    const centerY = height / 2;

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, data.length);
      
      let min = 1;
      let max = -1;
      
      for (let i = start; i < end; i++) {
        const sample = data[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      const y1 = centerY + (min * centerY * 0.8);
      const y2 = centerY + (max * centerY * 0.8);

      if (x === 0) {
        ctx.moveTo(x, y1);
      }
      ctx.lineTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();

    // Draw beat markers
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    beats.forEach(beatTime => {
      const x = (beatTime / duration) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Add glow effect for beats
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw current time indicator
    const currentX = (currentTime / duration) * width;
    ctx.strokeStyle = '#FF0080';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();

    // Add progress background
    ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.fillRect(0, 0, currentX, height);
  };

  const startPlayback = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Stop previous playback
      if (sourceRef.current) {
        sourceRef.current.stop();
      }

      // Create new source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume;

      // Create analyser for visualization
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContextRef.current.destination);

      sourceRef.current = source;
      analyserRef.current = analyser;

      const startTime = audioContextRef.current.currentTime;
      source.start(0, currentTime);

      // Update time
      const updateTime = () => {
        if (audioContextRef.current && sourceRef.current && isPlaying) {
          const elapsed = audioContextRef.current.currentTime - startTime + currentTime;
          if (elapsed < audioBuffer.duration) {
            onTimeUpdate(elapsed);
            setPlaybackTime(elapsed);
            animationRef.current = requestAnimationFrame(updateTime);
          } else {
            onTimeUpdate(0);
            setPlaybackTime(0);
          }
        }
      };

      updateTime();

      source.onended = () => {
        onTimeUpdate(0);
        setPlaybackTime(0);
      };

    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const stopPlayback = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = canvas.width;
    const clickTime = (x / width) * audioBuffer.duration;
    
    onTimeUpdate(clickTime);
    setPlaybackTime(clickTime);

    if (isPlaying) {
      stopPlayback();
      setTimeout(startPlayback, 50);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/50 border border-blue-500/30 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Waveform Visualization</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-blue-500"
            />
          </div>
          <span className="text-sm text-gray-400">
            {formatTime(playbackTime)} / {formatTime(audioBuffer.duration)}
          </span>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          onClick={handleCanvasClick}
          className="w-full h-48 bg-black rounded-lg cursor-pointer border border-gray-700"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Waveform</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-yellow-400"></div>
            <span>Beats</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-pink-500"></div>
            <span>Playhead</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-400 text-center">
        Click on the waveform to seek to a specific time position
      </div>
    </div>
  );
};

export default Visualizer;