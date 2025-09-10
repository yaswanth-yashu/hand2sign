import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandLandmark, HandDetectionResult } from '../utils/handLandmarks';
import { SignLanguageModel } from '../utils/signLanguageModel';

export const useHandDetection = (videoElement: HTMLVideoElement | null, isActive: boolean) => {
  const [handResults, setHandResults] = useState<HandDetectionResult | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string>('');
  
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const modelRef = useRef<SignLanguageModel | null>(null);
  const predictionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Initialize MediaPipe and model
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        console.log('Initializing hand detection system...');
        
        // Initialize the sign language model
        modelRef.current = new SignLanguageModel();
        
        try {
          await modelRef.current.loadModel();
          setIsModelLoaded(true);
          setModelError('');
          console.log('Model loaded successfully');
        } catch (modelErr) {
          console.error('Model loading failed:', modelErr);
          setModelError(`Model loading failed: ${modelErr instanceof Error ? modelErr.message : 'Unknown error'}`);
          setIsModelLoaded(false);
        }

        // Initialize MediaPipe Hands
        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults(onResults);
        console.log('MediaPipe Hands initialized');
        
      } catch (error) {
        console.error('Failed to initialize hand detection system:', error);
        setModelError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    initializeSystem();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  // Handle camera start/stop
  useEffect(() => {
    if (videoElement && handsRef.current && isActive) {
      startCamera();
    } else if (cameraRef.current && !isActive) {
      stopCamera();
    }
  }, [videoElement, isActive]);

  const startCamera = useCallback(() => {
    if (!videoElement || !handsRef.current) return;

    try {
      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current && !isProcessingRef.current) {
            isProcessingRef.current = true;
            try {
              await handsRef.current.send({ image: videoElement });
            } catch (error) {
              console.error('Error processing frame:', error);
            } finally {
              isProcessingRef.current = false;
            }
          }
        },
        width: 640,
        height: 480
      });
      
      cameraRef.current.start();
      console.log('Camera started');
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  }, [videoElement]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
      console.log('Camera stopped');
    }
  }, []);

  const onResults = useCallback(async (results: Results) => {
    try {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Convert MediaPipe landmarks to our format
        const handLandmarks: HandLandmark[] = landmarks.map(landmark => ({
          x: landmark.x * 640, // Convert normalized coordinates to pixel coordinates
          y: landmark.y * 480,
          z: landmark.z || 0
        }));

        setHandResults({
          landmarks: handLandmarks,
          confidence: 0.9 // MediaPipe doesn't provide overall confidence
        });

        // Debounce predictions to avoid too frequent updates
        if (predictionTimeoutRef.current) {
          clearTimeout(predictionTimeoutRef.current);
        }

        predictionTimeoutRef.current = setTimeout(async () => {
          if (modelRef.current && modelRef.current.isModelLoaded()) {
            try {
              const prediction = await modelRef.current.predict(handLandmarks);
              if (prediction.character && prediction.character.trim() !== '') {
                setCurrentCharacter(prediction.character);
                setConfidence(prediction.confidence);
              }
            } catch (error) {
              console.error('Prediction failed:', error);
            }
          }
        }, 300); // 300ms debounce for smoother experience
      } else {
        // No hand detected
        setHandResults(null);
        setCurrentCharacter('');
        setConfidence(0);
        
        if (predictionTimeoutRef.current) {
          clearTimeout(predictionTimeoutRef.current);
        }
      }
    } catch (error) {
      console.error('Error in onResults:', error);
    }
  }, []);

  return {
    handResults,
    currentCharacter,
    confidence,
    isModelLoaded,
    modelError
  };
};