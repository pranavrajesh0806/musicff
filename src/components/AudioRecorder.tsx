import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface AudioRecorderProps {
  onAudioLoad: (data: { buffer: AudioBuffer }) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioLoad }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<AudioBuffer | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        setRecordedAudio(audioBuffer);
        audioContextRef.current = audioContext;

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (recordedAudio && audioContextRef.current) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = recordedAudio;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);
    }
  }, [recordedAudio]);

  const stopPlayback = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const useRecording = useCallback(() => {
    if (recordedAudio) {
      onAudioLoad({ buffer: recordedAudio });
    }
  }, [recordedAudio, onAudioLoad]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-gray-900/30 border border-blue-500/30 rounded-xl p-8 text-center">
        {!isRecording && !recordedAudio && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-blue-500/20 rounded-full">
                <Mic className="h-12 w-12 text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Record Audio</h3>
              <p className="text-gray-400">Click the button below to start recording</p>
            </div>

            <button
              onClick={startRecording}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2 mx-auto"
            >
              <Mic className="h-4 w-4" />
              <span>Start Recording</span>
            </button>
          </div>
        )}

        {isRecording && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-red-500/20 rounded-full animate-pulse">
                <Mic className="h-12 w-12 text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Recording...</h3>
              <p className="text-2xl font-mono text-red-400">{formatTime(duration)}</p>
            </div>

            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2 mx-auto"
            >
              <Square className="h-4 w-4" />
              <span>Stop Recording</span>
            </button>
          </div>
        )}

        {recordedAudio && !isRecording && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-6 bg-green-500/20 rounded-full">
                <Mic className="h-12 w-12 text-green-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">Recording Complete</h3>
              <p className="text-gray-400">Duration: {formatTime(Math.floor(recordedAudio.duration))}</p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={isPlaying ? stopPlayback : playRecording}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300 flex items-center space-x-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span>{isPlaying ? 'Stop' : 'Play'}</span>
              </button>
              
              <button
                onClick={useRecording}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-300"
              >
                Use Recording
              </button>
              
              <button
                onClick={() => {
                  setRecordedAudio(null);
                  setDuration(0);
                  if (audioSourceRef.current) {
                    audioSourceRef.current.stop();
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300"
              >
                Record Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;