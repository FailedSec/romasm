# Romasm Standard Library

Mathematical functions and utilities for Romasm programs.

## Files

- `math.romasm` - Basic math functions (factorial, power, sqrt, argument reduction)
- `trig.romasm` - Trigonometric functions (sine, cosine using Taylor series and CORDIC)
- `calculus.romasm` - Calculus functions (derivatives and integrals)
- `constants.romasm` - Standard scaling constants
- `examples.romasm` - Example programs using the math library

## Usage

Include these functions in your Romasm programs by copying the relevant subroutines.

### Example: Using Sine Function

```assembly
; Include the sin function from trig.romasm
; Then call it:
LOAD R0, 30  ; 30 degrees
CALL sin
PRINT R0     ; Outputs sin(30°) * 1000 ≈ 500
```

## Available Functions

### Math Functions (`math.romasm`)

- **factorial** - Calculate n! (factorial)
  - Input: R0 = n
  - Output: R0 = n!

- **power** - Calculate base^exponent
  - Input: R0 = base, R1 = exponent
  - Output: R0 = result

- **arg_reduce** - Reduce angle to manageable range
  - Input: R0 = angle
  - Output: R0 = reduced angle

- **sqrt** - Calculate square root using Newton's method
  - Input: R0 = n (scaled by 1000)
  - Output: R0 = sqrt(n) (scaled by 1000)

### Trigonometric Functions (`trig.romasm`)

- **sin** - Calculate sine using Taylor series
  - Input: R0 = angle in degrees (0-90)
  - Output: R0 = sin(angle) * 1000

- **cos** - Calculate cosine (uses sin)
  - Input: R0 = angle in degrees
  - Output: R0 = cos(angle) * 1000

- **sin_cordic** - Simplified CORDIC sine (for hardware)
  - Input: R0 = angle in degrees (0-45)
  - Output: R0 = sin(angle) * 1000

### Calculus Functions (`calculus.romasm`)

- **derivative_x_squared** - Derivative of f(x) = x²
  - Input: R0 = x (scaled by 1000)
  - Output: R0 = 2x (scaled by 1000)

- **derivative_x_cubed** - Derivative of f(x) = x³
  - Input: R0 = x (scaled by 1000)
  - Output: R0 = 3x² (scaled by 1000)

- **integral_x_squared** - Definite integral of f(x) = x²
  - Input: R0 = a, R1 = b (both scaled by 1000)
  - Output: R0 = ∫[a,b] x² dx (scaled by 1000)

- **integral_x_squared_numerical** - Numerical integral of f(x) = x²
  - Input: R0 = a, R1 = b, R2 = Δx (all scaled by 1000)
  - Output: R0 = ∫[a,b] x² dx (scaled by 1000)

- **integral_x_cubed** - Definite integral of f(x) = x³
  - Input: R0 = a, R1 = b (both scaled by 1000)
  - Output: R0 = ∫[a,b] x³ dx (scaled by 1000)

- **integral_trapezoidal_x_squared** - Trapezoidal rule integration (more accurate)
  - Input: R0 = a, R1 = b, R2 = Δx (all scaled by 1000)
  - Output: R0 = ∫[a,b] x² dx (scaled by 1000)

- **derivative_sin** - Derivative of sin(x) where x is in degrees
  - Input: R0 = x (angle in degrees, scaled by 1000)
  - Output: R0 = cos(x) * (π/180) (scaled by 1000)

- **derivative_cos** - Derivative of cos(x) where x is in degrees
  - Input: R0 = x (angle in degrees, scaled by 1000)
  - Output: R0 = -sin(x) * (π/180) (scaled by 1000)

- **integral_sin** - Definite integral of sin(x) from a to b
  - Input: R0 = a, R1 = b (both in degrees, scaled by 1000)
  - Output: R0 = ∫[a,b] sin(x) dx (scaled by 1000)

- **integral_cos** - Definite integral of cos(x) from a to b
  - Input: R0 = a, R1 = b (both in degrees, scaled by 1000)
  - Output: R0 = ∫[a,b] cos(x) dx (scaled by 1000)

- **integral_simpson_x_squared** - Simpson's rule integration (most accurate)
  - Input: R0 = a, R1 = b, R2 = Δx (all scaled by 1000)
  - Output: R0 = ∫[a,b] x² dx (scaled by 1000)

- **derivative_exp** - Derivative of e^x
  - Input: R0 = x (scaled by 1000)
  - Output: R0 = e^x (scaled by 1000) - derivative of e^x is e^x

- **derivative_ln** - Derivative of ln(x)
  - Input: R0 = x (scaled by 1000, must be > 0)
  - Output: R0 = 1/x (scaled by 1000)

- **integral_exp** - Definite integral of e^x from a to b
  - Input: R0 = a, R1 = b (both scaled by 1000)
  - Output: R0 = ∫[a,b] e^x dx = e^b - e^a (scaled by 1000)

- **integral_ln** - Definite integral of 1/x from a to b
  - Input: R0 = a, R1 = b (both scaled by 1000, must be > 0)
  - Output: R0 = ∫[a,b] 1/x dx = ln(b) - ln(a) (scaled by 1000)

### Advanced Math Functions (`advanced-math.romasm`)

- **exp** - Exponential function e^x using Taylor series
  - Input: R0 = x (scaled by 1000)
  - Output: R0 = e^x (scaled by 1000)

- **ln** - Natural logarithm approximation
  - Input: R0 = x (scaled by 1000, must be > 0)
  - Output: R0 = ln(x) (scaled by 1000)

## Implementation Notes

### Taylor Series
The sine function uses Taylor series expansion:
```
sin(x) = x - x³/6 + x⁵/120 - x⁷/5040 + ...
```

### CORDIC Algorithm
The CORDIC (Coordinate Rotation Digital Computer) algorithm is more efficient for hardware implementation as it only requires:
- Addition
- Subtraction  
- Multiplication by powers of 2 (bit-shifting)
- No division or exponentiation needed

### Argument Reduction
Before calculating trigonometric functions, angles should be reduced to a manageable range (typically -π/2 to π/2) to ensure:
- Fast convergence of Taylor series
- Numerical stability
- Reduced computational cost

## New Instructions

The following instructions have been added to support advanced math:

- **DIV** - Divide R0 by R1: `DIV R0, R1`
- **SHL** - Shift left (multiply by 2^n): `SHL R0, R1` (R0 = R0 << R1)
- **SHR** - Shift right (divide by 2^n): `SHR R0, R1` (R0 = R0 >> R1)

## Calculus Support

Romasm now supports basic calculus operations! See `CALCULUS_GUIDE.md` for detailed documentation.

**Quick Example:**
```assembly
; Calculate derivative of f(x) = x² at x = 5
LOAD R0, 5000    ; x = 5.000 (scaled)
CALL derivative_x_squared
PRINT R0         ; Outputs ~10000 (10.000 = 2*5)

; Calculate integral ∫[0,5] x² dx
LOAD R0, 0
LOAD R1, 5000
CALL integral_x_squared
PRINT R0         ; Outputs ~41667 (41.667)
```

## Future Enhancements

- Full CORDIC implementation with lookup tables
- More trigonometric functions (tan, asin, acos, atan)
- Logarithmic functions
- Exponential functions
- More calculus functions (derivatives/integrals for sin, cos, exp, ln)
- Floating-point support

