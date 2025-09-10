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
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const modelRef = useRef<SignLanguageModel | null>(null);
  const predictionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastPredictionTime = useRef<number>(0);

  // Initialize MediaPipe and model
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        console.log('🚀 Initializing hand detection system...');
        setIsInitializing(true);
        
        // Initialize the sign language model first
        modelRef.current = new SignLanguageModel();
        
        try {
          console.log('📦 Loading AI model...');
          await modelRef.current.loadModel();
          setIsModelLoaded(true);
          setModelError('');
          console.log('✅ AI Model loaded successfully!');
        } catch (modelErr) {
          console.error('❌ Model loading failed:', modelErr);
          setModelError(`Model loading failed: ${modelErr instanceof Error ? modelErr.message : 'Unknown error'}`);
          setIsModelLoaded(false);
        }

        // Initialize MediaPipe Hands
        console.log('🤚 Initializing MediaPipe Hands...');
        handsRef.current = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.8,
          minTrackingConfidence: 0.7
        });

        handsRef.current.onResults(onResults);
        console.log('✅ MediaPipe Hands initialized successfully!');
        
        setIsInitializing(false);
        
      } catch (error) {
        console.error('❌ Failed to initialize hand detection system:', error);
        setModelError(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsInitializing(false);
      }
    };

    initializeSystem();

    return () => {
      console.log('🧹 Cleaning up hand detection system...');
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
    if (videoElement && handsRef.current && isActive && !isInitializing) {
      startCamera();
    } else if (cameraRef.current && !isActive) {
      stopCamera();
    }
  }, [videoElement, isActive, isInitializing]);

  const startCamera = useCallback(() => {
    if (!videoElement || !handsRef.current) return;

    try {
      console.log('📹 Starting camera...');
      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current && !isProcessingRef.current) {
            isProcessingRef.current = true;
            try {
              await handsRef.current.send({ image: videoElement });
            } catch (error) {
              console.error('❌ Error processing frame:', error);
            } finally {
              isProcessingRef.current = false;
            }
          }
        },
        width: 640,
        height: 480
      });
      
      cameraRef.current.start();
      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Failed to start camera:', error);
      setModelError(`Camera error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [videoElement]);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
      console.log('⏹️ Camera stopped');
    }
  }, []);

  const onResults = useCallback(async (results: Results) => {
    try {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Convert MediaPipe landmarks to our format (pixel coordinates)
        const handLandmarks: HandLandmark[] = landmarks.map(landmark => ({
          x: landmark.x * 640, // Convert normalized to pixel coordinates
          y: landmark.y * 480,
          z: landmark.z || 0
        }));

        setHandResults({
          landmarks: handLandmarks,
          confidence: 0.9
        });

        // Throttle predictions to avoid overwhelming the model
        const now = Date.now();
        if (now - lastPredictionTime.current > 500) { // Predict every 500ms
          lastPredictionTime.current = now;
          
          if (predictionTimeoutRef.current) {
            clearTimeout(predictionTimeoutRef.current);
          }

          predictionTimeoutRef.current = setTimeout(async () => {
            if (modelRef.current && modelRef.current.isModelLoaded()) {
              try {
                console.log('🔮 Making prediction...');
                const prediction = await modelRef.current.predict(handLandmarks);
                
                if (prediction.character && prediction.character.trim() !== '' && prediction.confidence > 0.3) {
                  console.log(`✨ Detected: ${prediction.character} (${(prediction.confidence * 100).toFixed(1)}%)`);
                  setCurrentCharacter(prediction.character);
                  setConfidence(prediction.confidence);
                } else {
                  // Low confidence, clear character
                  setCurrentCharacter('');
                  setConfidence(0);
                }
              } catch (error) {
                console.error('❌ Prediction failed:', error);
                setCurrentCharacter('');
                setConfidence(0);
              }
            }
          }, 100); // Small delay for stability
        }
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
      console.error('❌ Error in onResults:', error);
    }
  }, []);

  return {
    handResults,
    currentCharacter,
    confidence,
    isModelLoaded,
    modelError,
    isInitializing
  };
};