import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Play, Pause } from 'lucide-react';
import { useHandDetection } from '../hooks/useHandDetection';

interface VideoFeedProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  onHandDetection: (character: string, confidence: number, landmarks: any[]) => void;
}

const VideoFeed: React.FC<VideoFeedProps> = ({ isRecording, onToggleRecording, onHandDetection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const { handResults, currentCharacter, confidence, isModelLoaded } = useHandDetection(
    videoRef.current,
    isRecording
  );

  // Pass detection results to parent component
  useEffect(() => {
    if (currentCharacter && confidence > 0) {
      onHandDetection(currentCharacter, confidence, handResults?.landmarks || []);
    }
  }, [currentCharacter, confidence, handResults, onHandDetection]);
  useEffect(() => {
    if (isRecording) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setHasPermission(true);
      setError('');
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.');
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isRecording ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isRecording ? (
                <Camera className="w-6 h-6 text-green-600" />
              ) : (
                <CameraOff className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Camera Feed</h2>
              <p className="text-sm text-gray-600">
                {isRecording ? 'Detecting sign language...' : 'Camera paused'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onToggleRecording}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isRecording
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isRecording ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>

        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">{error}</p>
                {!isModelLoaded && (
                  <p className="text-yellow-300 mt-2">Loading AI model...</p>
                )}
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
          
          {/* Model loading indicator */}
          {!isModelLoaded && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
              Loading Model...
            </div>
          )}
          
          {/* Recording indicator */}
          {isRecording && isModelLoaded && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
          
          {/* Hand detection overlay */}
          {isRecording && handResults && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 640 480" style={{ transform: 'scaleX(-1)' }}>
                {/* Real hand landmarks */}
                {handResults.landmarks.map((landmark, index) => (
                  <circle
                    key={index}
                    cx={landmark.x * 640 / 400}
                    cy={landmark.y * 480 / 400}
                    r={index === 0 ? 6 : 4}
                    fill="lime"
                    fillOpacity={index === 0 ? 0.9 : 0.7}
                  />
                ))}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoFeed;