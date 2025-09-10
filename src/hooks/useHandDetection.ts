import { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandLandmark, HandDetectionResult, normalizeLandmarks } from '../utils/handLandmarks';
import { SignLanguageModel } from '../utils/signLanguageModel';

export const useHandDetection = (videoElement: HTMLVideoElement | null, isActive: boolean) => {
  const [handResults, setHandResults] = useState<HandDetectionResult | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const modelRef = useRef<SignLanguageModel | null>(null);
  const predictionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize MediaPipe Hands
    const initializeHands = async () => {
      try {
        // Initialize the sign language model
        modelRef.current = new SignLanguageModel();
        await modelRef.current.loadModel();
        setIsModelLoaded(true);

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
      } catch (error) {
        console.error('Failed to initialize hand detection:', error);
      }
    };

    initializeHands();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoElement && handsRef.current && isActive) {
      // Initialize camera
      cameraRef.current = new Camera(videoElement, {
        onFrame: async () => {
          if (handsRef.current) {
            await handsRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current.start();
    } else if (cameraRef.current && !isActive) {
      cameraRef.current.stop();
    }
  }, [videoElement, isActive]);

  const onResults = async (results: Results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const normalizedLandmarks = normalizeLandmarks(
        landmarks.map(landmark => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0
        })),
        400,
        400
      );

      setHandResults({
        landmarks: normalizedLandmarks,
        confidence: 0.9 // MediaPipe doesn't provide overall confidence, so we use a default
      });

      // Debounce predictions to avoid too frequent updates
      if (predictionTimeoutRef.current) {
        clearTimeout(predictionTimeoutRef.current);
      }

      predictionTimeoutRef.current = setTimeout(async () => {
        if (modelRef.current && modelRef.current.isModelLoaded()) {
          try {
            const prediction = await modelRef.current.predict(normalizedLandmarks);
            setCurrentCharacter(prediction.character);
            setConfidence(prediction.confidence);
          } catch (error) {
            console.error('Prediction failed:', error);
          }
        }
      }, 500); // 500ms debounce
    } else {
      setHandResults(null);
      setCurrentCharacter('');
      setConfidence(0);
    }
  };

  return {
    handResults,
    currentCharacter,
    confidence,
    isModelLoaded
  };
};