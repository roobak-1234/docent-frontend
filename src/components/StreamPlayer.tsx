import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl: string;
  cameraName: string;
  autoPlay?: boolean;
  showControls?: boolean;
}

const StreamPlayer: React.FC<StreamPlayerProps> = ({ 
  streamUrl, 
  cameraName, 
  autoPlay = true, 
  showControls = true 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    // Initialize HLS or direct stream
    if (streamUrl.includes('.m3u8')) {
      // HLS stream
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else {
        // For browsers that don't support HLS natively, you'd use hls.js here
        console.warn('HLS not supported natively, would need hls.js library');
        video.src = streamUrl;
      }
    } else {
      // Direct stream (RTSP converted to WebRTC or other format)
      video.src = streamUrl;
    }

    if (autoPlay) {
      video.play().catch(() => {
        console.warn('Autoplay failed, user interaction required');
      });
    }

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [streamUrl, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Stream Error</h3>
          <p className="text-sm text-gray-400">Unable to load camera feed</p>
          <p className="text-xs text-gray-500 mt-2">{cameraName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Loading {cameraName}...</p>
          </div>
        </div>
      )}

      {/* Camera Info Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
        🔴 LIVE • {cameraName}
      </div>

      {/* Privacy Overlay Toggle */}
      <div className="absolute top-4 right-4">
        <button className="bg-black/70 text-white px-3 py-1 rounded-lg text-xs hover:bg-black/80 transition-colors">
          Privacy Mode: OFF
        </button>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* SignalR Overlay for Real-time Alerts */}
      <div className="absolute bottom-20 left-4 right-4">
        {/* This would be populated by SignalR real-time data */}
        <div className="bg-blue-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 transition-opacity">
          📍 Patient arriving in 2 minutes
        </div>
      </div>
    </div>
  );
};

export default StreamPlayer;