import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, Play, Pause, AlertCircle } from 'lucide-react';
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
  
  const { handResults, currentCharacter, confidence, isModelLoaded, modelError } = useHandDetection(
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
        await videoRef.current.play();
      }
      
      setHasPermission(true);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(`Camera error: ${errorMessage}. Please enable camera permissions.`);
      setHasPermission(false);
      console.error('Camera error:', err);
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
          {error || modelError ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                {error ? (
                  <>
                    <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-300">{error}</p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <p className="text-red-300 mb-2">Model Loading Error</p>
                    <p className="text-gray-300 text-sm max-w-md">{modelError}</p>
                    <p className="text-yellow-300 text-xs mt-2">
                      Please ensure model files are in public/models/ directory
                    </p>
                  </>
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
          {!isModelLoaded && !modelError && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Loading AI Model...</span>
              </div>
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
          {isRecording && handResults && handResults.landmarks.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 640 480" style={{ transform: 'scaleX(-1)' }}>
                {/* Hand landmark connections */}
                {[
                  // Thumb
                  [0, 1], [1, 2], [2, 3], [3, 4],
                  // Index finger
                  [5, 6], [6, 7], [7, 8],
                  // Middle finger
                  [9, 10], [10, 11], [11, 12],
                  // Ring finger
                  [13, 14], [14, 15], [15, 16],
                  // Pinky
                  [17, 18], [18, 19], [19, 20],
                  // Palm connections
                  [5, 9], [9, 13], [13, 17],
                  // Wrist connections
                  [0, 5], [0, 17]
                ].map(([start, end], index) => {
                  const startPoint = handResults.landmarks[start];
                  const endPoint = handResults.landmarks[end];
                  if (startPoint && endPoint) {
                    return (
                      <line
                        key={`connection-${index}`}
                        x1={startPoint.x}
                        y1={startPoint.y}
                        x2={endPoint.x}
                        y2={endPoint.y}
                        stroke="lime"
                        strokeWidth="2"
                      />
                    );
                  }
                  return null;
                })}
                
                {/* Hand landmarks */}
                {handResults.landmarks.map((landmark, index) => (
                  <circle
                    key={index}
                    cx={landmark.x}
                    cy={landmark.y}
                    r={index === 0 ? 6 : 4}
                    fill="lime"
                    fillOpacity={index === 0 ? 0.9 : 0.7}
                  />
                ))}
              </svg>
            </div>
          )}
          
          {/* Current character overlay */}
          {isRecording && currentCharacter && confidence > 0.5 && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold">{currentCharacter}</div>
              <div className="text-xs text-gray-300">{(confidence * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoFeed;