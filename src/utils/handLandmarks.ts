// Hand landmark indices and connections based on MediaPipe
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],  // Index finger
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle finger
  [0, 13], [13, 14], [14, 15], [15, 16],  // Ring finger
  [0, 17], [17, 18], [18, 19], [19, 20],  // Pinky
  [5, 9], [9, 13], [13, 17]  // Palm connections
];

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandDetectionResult {
  landmarks: HandLandmark[];
  confidence: number;
}

// Calculate distance between two landmarks
export const calculateDistance = (point1: HandLandmark, point2: HandLandmark): number => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + 
    Math.pow(point1.y - point2.y, 2)
  );
};

// Normalize landmarks to 400x400 canvas (matching the Python model)
export const normalizeLandmarks = (landmarks: HandLandmark[], width: number, height: number): HandLandmark[] => {
  return landmarks.map(landmark => ({
    x: (landmark.x * width),
    y: (landmark.y * height),
    z: landmark.z
  }));
};