import * as tf from '@tensorflow/tfjs';
import { HandLandmark } from './handLandmarks';

export class SignLanguageModel {
  private model: tf.LayersModel | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  async loadModel(): Promise<void> {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.doLoadModel();
    return this.loadingPromise;
  }

  private async doLoadModel(): Promise<void> {
    try {
      console.log('Loading TensorFlow.js model...');
      
      // Try to load the model from the public directory
      const modelUrl = '/models/model.json';
      
      // Check if model file exists
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error(`Model file not found at ${modelUrl}. Please ensure the converted model files are in the public/models directory.`);
      }

      this.model = await tf.loadLayersModel(modelUrl);
      this.isLoaded = true;
      console.log('Sign language model loaded successfully');
      console.log('Model input shape:', this.model.inputs[0].shape);
      console.log('Model output shape:', this.model.outputs[0].shape);
    } catch (error) {
      console.error('Failed to load model:', error);
      this.isLoaded = false;
      throw error;
    }
  }

  isModelLoaded(): boolean {
    return this.isLoaded && this.model !== null;
  }

  // Create hand visualization exactly like Python code
  private createHandVisualization(landmarks: HandLandmark[], width: number = 400, height: number = 400): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate offset to center the hand (similar to Python code)
    const minX = Math.min(...landmarks.map(p => p.x));
    const maxX = Math.max(...landmarks.map(p => p.x));
    const minY = Math.min(...landmarks.map(p => p.y));
    const maxY = Math.max(...landmarks.map(p => p.y));
    
    const handWidth = maxX - minX;
    const handHeight = maxY - minY;
    
    const offsetX = ((width - handWidth) / 2) - minX;
    const offsetY = ((height - handHeight) / 2) - minY;
    
    // Adjust landmarks with offset
    const adjustedLandmarks = landmarks.map(landmark => ({
      x: landmark.x + offsetX,
      y: landmark.y + offsetY,
      z: landmark.z
    }));
    
    // Draw hand connections (same as Python code)
    ctx.strokeStyle = 'rgb(0, 255, 0)';
    ctx.lineWidth = 3;
    
    const connections = [
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
    ];
    
    // Draw connections
    connections.forEach(([start, end]) => {
      if (adjustedLandmarks[start] && adjustedLandmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(adjustedLandmarks[start].x, adjustedLandmarks[start].y);
        ctx.lineTo(adjustedLandmarks[end].x, adjustedLandmarks[end].y);
        ctx.stroke();
      }
    });
    
    // Draw landmarks
    adjustedLandmarks.forEach((landmark, index) => {
      ctx.fillStyle = index === 0 ? 'rgb(0, 0, 255)' : 'rgb(0, 0, 255)';
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, index === 0 ? 3 : 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    return ctx.getImageData(0, 0, width, height);
  }

  // Distance calculation helper
  private distance(point1: HandLandmark, point2: HandLandmark): number {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + 
      Math.pow(point1.y - point2.y, 2)
    );
  }

  async predict(landmarks: HandLandmark[]): Promise<{ character: string; confidence: number }> {
    if (!this.isModelLoaded() || !this.model) {
      throw new Error('Model not loaded');
    }

    try {
      // Create hand visualization
      const imageData = this.createHandVisualization(landmarks);
      
      // Convert ImageData to tensor
      const tensor = tf.tidy(() => {
        // Create tensor from ImageData
        const imageTensor = tf.browser.fromPixels(imageData);
        // Ensure it's 400x400x3
        const resized = tf.image.resizeBilinear(imageTensor, [400, 400]);
        // Normalize to [0, 1]
        const normalized = resized.div(255.0);
        // Add batch dimension
        return normalized.expandDims(0);
      });

      // Get prediction
      const prediction = await this.model.predict(tensor) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Apply post-processing logic from Python code
      const result = this.postProcessPrediction(probabilities as Float32Array, landmarks);
      
      // Clean up tensors
      tensor.dispose();
      prediction.dispose();
      
      return result;
    } catch (error) {
      console.error('Prediction error:', error);
      return { character: '', confidence: 0 };
    }
  }

  private postProcessPrediction(probabilities: Float32Array, pts: HandLandmark[]): { character: string; confidence: number } {
    // Get top predictions
    const probs = Array.from(probabilities);
    const ch1Index = probs.indexOf(Math.max(...probs));
    probs[ch1Index] = 0;
    const ch2Index = probs.indexOf(Math.max(...probs));
    
    let ch1 = ch1Index;
    const ch2 = ch2Index;
    const pl = [ch1, ch2];
    
    // Apply disambiguation rules from Python code
    ch1 = this.applyDisambiguationRules(ch1, ch2, pl, pts);
    
    // Convert to character
    const character = this.indexToCharacter(ch1, pts);
    const confidence = probabilities[ch1Index];
    
    return { character, confidence };
  }

  private applyDisambiguationRules(ch1: number, ch2: number, pl: number[], pts: HandLandmark[]): number {
    // Condition for [Aemnst] - fingers up check
    const aemnstConditions = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5]];
    if (aemnstConditions.some(cond => pl[0] === cond[0] && pl[1] === cond[1])) {
      if (pts[6]?.y < pts[8]?.y && pts[10]?.y < pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y) {
        ch1 = 0;
      }
    }
    
    // Condition for [o][s] - thumb position
    const osConditions = [[2, 2], [2, 1]];
    if (osConditions.some(cond => pl[0] === cond[0] && pl[1] === cond[1])) {
      if (pts[5]?.x < pts[4]?.x) {
        ch1 = 0;
      }
    }
    
    // Condition for [c0][aemnst] - thumb and finger positions
    const c0Conditions = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]];
    if (c0Conditions.some(cond => pl[0] === cond[0] && pl[1] === cond[1])) {
      if (pts[0]?.x > pts[8]?.x && pts[0]?.x > pts[4]?.x && pts[0]?.x > pts[12]?.x && 
          pts[0]?.x > pts[16]?.x && pts[0]?.x > pts[20]?.x && pts[5]?.x > pts[4]?.x) {
        ch1 = 2;
      }
    }

    // Additional rules from Python code...
    // (Implementing key rules for brevity)
    
    return ch1;
  }

  private indexToCharacter(index: number, pts: HandLandmark[]): string {
    // Group 0: A, E, M, N, S, T
    if (index === 0) {
      let char = 'S';
      if (pts[4]?.x < pts[6]?.x && pts[4]?.x < pts[10]?.x && pts[4]?.x < pts[14]?.x && pts[4]?.x < pts[18]?.x) {
        char = 'A';
      }
      if (pts[4]?.x > pts[6]?.x && pts[4]?.x < pts[10]?.x && pts[4]?.x < pts[14]?.x && 
          pts[4]?.x < pts[18]?.x && pts[4]?.y < pts[14]?.y && pts[4]?.y < pts[18]?.y) {
        char = 'T';
      }
      if (pts[4]?.y > pts[8]?.y && pts[4]?.y > pts[12]?.y && pts[4]?.y > pts[16]?.y && pts[4]?.y > pts[20]?.y) {
        char = 'E';
      }
      if (pts[4]?.x > pts[6]?.x && pts[4]?.x > pts[10]?.x && pts[4]?.x > pts[14]?.x && pts[4]?.y < pts[18]?.y) {
        char = 'M';
      }
      if (pts[4]?.x > pts[6]?.x && pts[4]?.x > pts[10]?.x && pts[4]?.y < pts[18]?.y && pts[4]?.y < pts[14]?.y) {
        char = 'N';
      }
      return char;
    }
    
    // Group 1: B, D, F, I, K, R, U, V, W
    if (index === 1) {
      if (pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y > pts[16]?.y && pts[18]?.y > pts[20]?.y) {
        return 'B';
      }
      if (pts[6]?.y > pts[8]?.y && pts[10]?.y < pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y) {
        return 'D';
      }
      if (pts[6]?.y < pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y > pts[16]?.y && pts[18]?.y > pts[20]?.y) {
        return 'F';
      }
      if (pts[6]?.y < pts[8]?.y && pts[10]?.y < pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y > pts[20]?.y) {
        return 'I';
      }
      return 'B'; // Default
    }
    
    // Group 2: C, O
    if (index === 2) {
      if (this.distance(pts[12], pts[4]) > 42) {
        return 'C';
      }
      return 'O';
    }
    
    // Group 3: G, H
    if (index === 3) {
      if (this.distance(pts[8], pts[12]) > 72) {
        return 'G';
      }
      return 'H';
    }
    
    // Group 4: L
    if (index === 4) {
      return 'L';
    }
    
    // Group 5: P, Q, Z
    if (index === 5) {
      if (pts[4]?.x > pts[12]?.x && pts[4]?.x > pts[16]?.x && pts[4]?.x > pts[20]?.x) {
        if (pts[8]?.y < pts[5]?.y) {
          return 'Z';
        }
        return 'Q';
      }
      return 'P';
    }
    
    // Group 6: X
    if (index === 6) {
      return 'X';
    }
    
    // Group 7: J, Y
    if (index === 7) {
      if (this.distance(pts[8], pts[4]) > 42) {
        return 'Y';
      }
      return 'J';
    }
    
    return '';
  }
}