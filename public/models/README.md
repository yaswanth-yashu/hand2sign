# Sign Language Model

This directory should contain the converted TensorFlow.js model files.

## Required Files:
- `model.json` - The model architecture and metadata
- `model_weights.bin` - The model weights (or multiple weight files)

## Converting from .h5 to TensorFlow.js

To convert your `cnn8grps_rad1_model.h5` file to TensorFlow.js format:

1. Install tensorflowjs converter:
   ```bash
   pip install tensorflowjs
   ```

2. Convert the model:
   ```bash
   tensorflowjs_converter --input_format=keras \
                         --output_format=tfjs_layers_model \
                         cnn8grps_rad1_model.h5 \
                         ./public/models/
   ```

3. The converter will create:
   - `model.json` - Contains the model architecture
   - One or more `.bin` files containing the weights

## Model Input/Output

Based on the Python code analysis:
- **Input**: 400x400x3 RGB image (hand visualization)
- **Output**: 8 classes representing character groups:
  - Group 0: A, E, M, N, S, T
  - Group 1: B, D, F, I, K, R, U, V, W
  - Group 2: C, O
  - Group 3: G, H
  - Group 4: L
  - Group 5: P, Q, Z
  - Group 6: X
  - Group 7: J, Y

The model uses a sophisticated post-processing system with hand landmark analysis to disambiguate between characters in the same group.