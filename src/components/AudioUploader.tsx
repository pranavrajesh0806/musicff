import React, { useCallback } from 'react';
import { Upload, FileAudio } from 'lucide-react';

interface AudioUploaderProps {
  onAudioLoad: (data: { buffer: AudioBuffer; file: File }) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onAudioLoad }) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file');
      return;
    }

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      onAudioLoad({ buffer: audioBuffer, file });
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert('Error loading audio file. Please try a different file.');
    } finally {
      setIsLoading(false);
    }
  }, [onAudioLoad]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-blue-500/30 bg-gray-900/30 hover:border-blue-400 hover:bg-blue-500/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="audio/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-lg text-gray-300">Processing audio file...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className={`p-4 rounded-full transition-colors duration-300 ${
                  dragActive ? 'bg-blue-500' : 'bg-blue-500/20'
                }`}>
                  <Upload className={`h-8 w-8 ${dragActive ? 'text-white' : 'text-blue-400'}`} />
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-white">
                  Drop your audio file here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supports .mp3, .wav, .ogg, and other audio formats
                </p>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <FileAudio className="h-4 w-4" />
                  <span>MP3</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileAudio className="h-4 w-4" />
                  <span>WAV</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileAudio className="h-4 w-4" />
                  <span>OGG</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;