# Romasm Calculation Engine

A dedicated calculation engine for the Romasm Graphics Calculator.

## Architecture

The calculation engine provides:
- Pre-compiled Romasm functions for efficiency
- Proper fixed-point arithmetic with consistent scaling
- Clean API for mathematical operations

## Scaling Convention

All functions use fixed-point arithmetic:
- **Input angles**: Degrees scaled by 100 (e.g., 30° = 3000)
- **Output trig functions**: Scaled by 1000 (e.g., sin(30°) = 0.5 → 500)
- **Input/output coordinates**: Scaled by 100 (e.g., 1.5 → 150)

## Functions

### `sin(angleDegreesScaled)`
Calculates sine using Taylor series (5 terms).
- Input: Angle in degrees × 100
- Output: sin(angle) × 1000

### `cos(angleDegreesScaled)`
Calculates cosine using identity cos(x) = sin(90° - x).
- Input: Angle in degrees × 100
- Output: cos(angle) × 1000

### `polarToCartesian(rScaled, thetaDegreesScaled)`
Converts polar coordinates to Cartesian.
- Input: r × 100, θ (degrees) × 100
- Output: x × 100, y × 100

## Usage

```javascript
const mathEngine = new RomasmMathEngine();

// Calculate sin(30°)
const sin30 = mathEngine.sin(3000); // Returns 500 (0.5 × 1000)

// Convert polar to Cartesian
const result = mathEngine.polarToCartesian(100, 4500); // r=1, θ=45°
// Returns { x: 71, y: 71 } (0.707 × 100)
```

