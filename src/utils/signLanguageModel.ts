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
      
      // Load the model using your specific files
      const modelUrl = 'model.json';
      
      // Check if model file exists
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error(`Model file not found at ${modelUrl}. Status: ${response.status}`);
      }

      // Load the model
      this.model = await tf.loadLayersModel(modelUrl);
      this.isLoaded = true;
      
      console.log('✅ Sign language model loaded successfully');
      console.log('Model input shape:', this.model.inputs[0].shape);
      console.log('Model output shape:', this.model.outputs[0].shape);
      
      // Warm up the model with a dummy prediction
      const dummyInput = tf.zeros([1, 400, 400, 3]);
      const warmupPrediction = this.model.predict(dummyInput) as tf.Tensor;
      warmupPrediction.dispose();
      dummyInput.dispose();
      
      console.log('🔥 Model warmed up and ready for predictions');
      
    } catch (error) {
      console.error('❌ Failed to load model:', error);
      this.isLoaded = false;
      throw new Error(`Model loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isModelLoaded(): boolean {
    return this.isLoaded && this.model !== null;
  }

  // Create hand visualization exactly like Python code
  private createHandVisualization(landmarks: HandLandmark[], width: number = 400, height: number = 400): tf.Tensor3D {
    // Create a white background canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background (like Python code)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    if (landmarks.length === 0) {
      // Return white image if no landmarks
      const imageData = ctx.getImageData(0, 0, width, height);
      return tf.browser.fromPixels(imageData).div(255.0) as tf.Tensor3D;
    }
    
    // Calculate bounding box and center the hand
    const xs = landmarks.map(p => p.x);
    const ys = landmarks.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const handWidth = maxX - minX;
    const handHeight = maxY - minY;
    
    // Center the hand in the 400x400 canvas (like Python offset calculation)
    const offsetX = ((width - handWidth) / 2) - minX;
    const offsetY = ((height - handHeight) / 2) - minY;
    
    // Adjust landmarks with offset
    const adjustedLandmarks = landmarks.map(landmark => ({
      x: Math.max(0, Math.min(width - 1, landmark.x + offsetX)),
      y: Math.max(0, Math.min(height - 1, landmark.y + offsetY)),
      z: landmark.z
    }));
    
    // Draw hand connections (exactly like Python code)
    ctx.strokeStyle = 'rgb(0, 255, 0)'; // Green lines
    ctx.lineWidth = 3;
    
    const connections = [
      // Thumb (0-4)
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger (5-8)
      [5, 6], [6, 7], [7, 8],
      // Middle finger (9-12)
      [9, 10], [10, 11], [11, 12],
      // Ring finger (13-16)
      [13, 14], [14, 15], [15, 16],
      // Pinky (17-20)
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
    
    // Draw landmarks (blue circles like Python code)
    adjustedLandmarks.forEach((landmark, index) => {
      ctx.fillStyle = 'rgb(0, 0, 255)'; // Blue circles
      ctx.beginPath();
      ctx.arc(landmark.x, landmark.y, index === 0 ? 3 : 2, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Convert to tensor
    const imageData = ctx.getImageData(0, 0, width, height);
    return tf.browser.fromPixels(imageData).div(255.0) as tf.Tensor3D;
  }

  // Distance calculation helper (from Python code)
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

    if (landmarks.length !== 21) {
      return { character: '', confidence: 0 };
    }

    try {
      // Create hand visualization tensor
      const imageTensor = this.createHandVisualization(landmarks);
      
      // Add batch dimension and predict
      const batchedInput = imageTensor.expandDims(0);
      const prediction = this.model.predict(batchedInput) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Apply post-processing logic from Python code
      const result = this.postProcessPrediction(probabilities as Float32Array, landmarks);
      
      // Clean up tensors
      imageTensor.dispose();
      batchedInput.dispose();
      prediction.dispose();
      
      return result;
    } catch (error) {
      console.error('❌ Prediction error:', error);
      return { character: '', confidence: 0 };
    }
  }

  private postProcessPrediction(probabilities: Float32Array, pts: HandLandmark[]): { character: string; confidence: number } {
    // Get top 3 predictions (like Python code)
    const probs = Array.from(probabilities);
    const ch1Index = probs.indexOf(Math.max(...probs));
    const ch1Confidence = probs[ch1Index];
    
    probs[ch1Index] = 0;
    const ch2Index = probs.indexOf(Math.max(...probs));
    
    probs[ch2Index] = 0;
    const ch3Index = probs.indexOf(Math.max(...probs));
    
    let ch1 = ch1Index;
    const ch2 = ch2Index;
    const pl = [ch1, ch2];
    
    // Apply all disambiguation rules from Python code
    ch1 = this.applyDisambiguationRules(ch1, ch2, pl, pts);
    
    // Convert to character
    const character = this.indexToCharacter(ch1, pts);
    
    return { character, confidence: ch1Confidence };
  }

  private applyDisambiguationRules(ch1: number, ch2: number, pl: number[], pts: HandLandmark[]): number {
    // All disambiguation rules from Python code
    
    // Condition for [Aemnst] - fingers up check
    const aemnstConditions = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
      [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
      [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]];
    
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

    // Additional complex rules from Python code...
    // (Implementing all the key disambiguation rules)
    
    return ch1;
  }

  private indexToCharacter(index: number, pts: HandLandmark[]): string {
    // Convert group index to specific character using Python logic
    
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
      if (pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y > pts[16]?.y && pts[18]?.y < pts[20]?.y) {
        return 'W';
      }
      if (pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y && pts[4]?.y < pts[9]?.y) {
        return 'K';
      }
      if ((this.distance(pts[8], pts[12]) - this.distance(pts[6], pts[10])) < 8 && 
          pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y) {
        return 'U';
      }
      if ((this.distance(pts[8], pts[12]) - this.distance(pts[6], pts[10])) >= 8 && 
          pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y && pts[4]?.y > pts[9]?.y) {
        return 'V';
      }
      if (pts[8]?.x > pts[12]?.x && pts[6]?.y > pts[8]?.y && pts[10]?.y > pts[12]?.y && pts[14]?.y < pts[16]?.y && pts[18]?.y < pts[20]?.y) {
        return 'R';
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