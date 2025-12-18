# Romasm Calculus Guide

This guide explains how to use calculus functions in Romasm assembly language.

## Overview

The Romasm calculus library provides numerical differentiation and integration functions for common mathematical functions. Since Romasm doesn't support function pointers, we provide specific implementations for common functions like x², x³, etc.

## Fixed-Point Scaling

All values use **fixed-point scaling** with a factor of **1000**:
- `5000` represents `5.000`
- `1234` represents `1.234`
- `1` represents `0.001`

When working with calculus functions, always scale your inputs and outputs by 1000.

---

## Derivative Functions

### `derivative_x_squared`
Calculates the derivative of f(x) = x², which is f'(x) = 2x.

**Input:** R0 = x (scaled by 1000)  
**Output:** R0 = 2x (scaled by 1000)

**Example:**
```assembly
; Calculate f'(5) for f(x) = x²
; f'(5) = 2 * 5 = 10
LOAD R0, 5000    ; x = 5.000 (scaled)
CALL derivative_x_squared
PRINT R0         ; Outputs ~10000 (representing 10.000)
```

**Method:** Uses central difference method:
```
f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
```

### `derivative_x_cubed`
Calculates the derivative of f(x) = x³, which is f'(x) = 3x².

**Input:** R0 = x (scaled by 1000)  
**Output:** R0 = 3x² (scaled by 1000)

**Example:**
```assembly
; Calculate f'(2) for f(x) = x³
; f'(2) = 3 * 2² = 12
LOAD R0, 2000    ; x = 2.000 (scaled)
CALL derivative_x_cubed
PRINT R0         ; Outputs ~12000 (representing 12.000)
```

---

## Integral Functions

### `integral_x_squared`
Calculates the definite integral of f(x) = x² from a to b analytically.

**Formula:** ∫[a,b] x² dx = (b³ - a³) / 3

**Input:** 
- R0 = a (lower bound, scaled by 1000)
- R1 = b (upper bound, scaled by 1000)

**Output:** R0 = integral result (scaled by 1000)

**Example:**
```assembly
; Calculate ∫[0,5] x² dx
; Expected: (5³ - 0³) / 3 = 125 / 3 ≈ 41.667
LOAD R0, 0       ; a = 0
LOAD R1, 5000    ; b = 5.000 (scaled)
CALL integral_x_squared
PRINT R0         ; Outputs ~41667 (representing 41.667)
```

### `integral_x_squared_numerical`
Calculates the definite integral of f(x) = x² using numerical integration (rectangular rule).

**Input:**
- R0 = a (lower bound, scaled by 1000)
- R1 = b (upper bound, scaled by 1000)
- R2 = Δx (step size, scaled by 1000, e.g., 10 = 0.01)

**Output:** R0 = integral result (scaled by 1000)

**Example:**
```assembly
; Calculate ∫[0,5] x² dx numerically
LOAD R0, 0       ; a = 0
LOAD R1, 5000    ; b = 5.000 (scaled)
LOAD R2, 10      ; Δx = 0.01 (scaled)
CALL integral_x_squared_numerical
PRINT R0         ; Outputs ~41667 (representing 41.667)
```

**Note:** Smaller Δx gives better accuracy but takes longer. Use `10` (0.01) for good balance.

### `integral_x_cubed`
Calculates the definite integral of f(x) = x³ from a to b analytically.

**Formula:** ∫[a,b] x³ dx = (b⁴ - a⁴) / 4

**Input:**
- R0 = a (lower bound, scaled by 1000)
- R1 = b (upper bound, scaled by 1000)

**Output:** R0 = integral result (scaled by 1000)

**Example:**
```assembly
; Calculate ∫[1,3] x³ dx
; Expected: (3⁴ - 1⁴) / 4 = (81 - 1) / 4 = 20
LOAD R0, 1000    ; a = 1.000 (scaled)
LOAD R1, 3000    ; b = 3.000 (scaled)
CALL integral_x_cubed
PRINT R0         ; Outputs ~20000 (representing 20.000)
```

---

## Helper Functions

### `x_squared`
Calculates f(x) = x².

**Input:** R0 = x (scaled by 1000)  
**Output:** R0 = x² (scaled by 1000)

### `x_cubed`
Calculates f(x) = x³.

**Input:** R0 = x (scaled by 1000)  
**Output:** R0 = x³ (scaled by 1000)

---

## Creating Your Own Calculus Functions

To create a derivative or integral for a custom function:

1. **For Derivatives:**
   - Use the central difference method: `f'(x) ≈ (f(x+h) - f(x-h)) / (2h)`
   - Replace the function evaluation with your custom function
   - Use h = 10 (representing 0.01) for good accuracy

2. **For Integrals:**
   - Use rectangular rule: `∫[a,b] f(x) dx ≈ Σ f(x_i) * Δx`
   - Loop from a to b in steps of Δx
   - Evaluate your function at each step and accumulate

**Example Template for Custom Derivative:**
```assembly
derivative_my_function:
  PUSH R1
  PUSH R2
  PUSH R3
  PUSH R4
  
  LOAD R1, R0    ; R1 = x
  LOAD R2, 10    ; R2 = h = 0.01
  
  ; Calculate f(x+h)
  LOAD R3, R1
  ADD R3, R2
  LOAD R0, R3
  CALL my_function  ; Your function here
  STORE R3, R0      ; Save f(x+h)
  
  ; Calculate f(x-h)
  LOAD R0, R1
  SUB R0, R2
  CALL my_function  ; Your function here
  STORE R4, R0      ; Save f(x-h)
  
  ; f'(x) = (f(x+h) - f(x-h)) / (2h)
  LOAD R0, R3
  SUB R0, R4
  LOAD R4, 2
  MUL R4, R2
  DIV R0, R4
  
  POP R4
  POP R3
  POP R2
  POP R1
  RET
```

---

## Complete Example Program

```assembly
; Calculate derivative and integral of f(x) = x²

; Include math and calculus libraries
; (Copy relevant functions from math.romasm and calculus.romasm)

main:
  ; Calculate f'(5) for f(x) = x²
  LOAD R0, 5000
  CALL derivative_x_squared
  PRINT R0         ; Should output ~10000 (10.000)
  
  ; Calculate ∫[0,5] x² dx
  LOAD R0, 0
  LOAD R1, 5000
  CALL integral_x_squared
  PRINT R0         ; Should output ~41667 (41.667)
  
  RET
```

---

## Accuracy Notes

- **Derivatives:** Central difference method with h = 0.01 gives good accuracy for most functions
- **Integrals:** 
  - Analytical methods (like `integral_x_squared`) are exact
  - Numerical methods depend on step size (Δx)
  - Smaller Δx = better accuracy but slower execution
  - Recommended: Δx = 0.01 (scaled: 10) for good balance

---

## See Also

- `stdlib/math.romasm` - Basic math functions (factorial, power, sqrt)
- `stdlib/trig.romasm` - Trigonometric functions
- `stdlib/constants.romasm` - Standard scaling constants
- `CAPABILITIES_ANALYSIS.md` - Detailed analysis of Romasm capabilities

