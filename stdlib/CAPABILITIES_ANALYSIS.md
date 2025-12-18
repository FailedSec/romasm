# Romasm Capabilities Analysis & Expansion Plan

## Current State Assessment

### ✅ Current Instruction Set (ISA)

**Arithmetic Operations:**
- `INC` / `DEC` - Increment/Decrement
- `ADD` / `SUB` - Addition/Subtraction
- `MUL` / `DIV` - Multiplication/Division
- `MOD` - Modulo operation
- `SHL` / `SHR` - Bit shifts (multiply/divide by powers of 2)

**Control Flow:**
- `JMP` - Unconditional jump
- `JEQ` / `JNE` - Jump if equal/not equal
- `JLT` / `JGT` - Jump if less/greater than
- `JLE` / `JGE` - Jump if less/greater or equal
- `CALL` / `RET` - Subroutine calls
- `CMP` - Compare (sets flags)

**Memory & Stack:**
- `LOAD` / `STORE` - Register/memory operations
- `PUSH` / `POP` - Stack operations
- `PRINT` - Output value

**Registers:** R0-R8 (I-IX in Roman notation)

---

### ✅ Current Standard Library (`stdlib/`)

**Basic Math (`math.romasm`):**
- `factorial` - Calculate n!
- `power` - Calculate base^exponent
- `arg_reduce` - Reduce angles to manageable range

**Trigonometry (`trig.romasm`):**
- `sin` - Sine using Taylor series (3-term)
- `cos` - Cosine (uses sin)
- `sin_cordic` - Simplified CORDIC sine

**Advanced Sine (`sine-taylor.romasm`):**
- 6-term Taylor series implementation for higher accuracy

**Big Integer Support:**
- `bigint.js` - JavaScript BigInt library (used by explorers)
- `bigint.romasm` - Placeholder for Romasm BigInt operations (not yet implemented)

**Prime Utilities (`primes.js`):**
- JavaScript library for primality testing, twin primes, Goldbach decomposition

---

### ✅ Current Limitations

1. **No Floating-Point Support**
   - All math uses fixed-point (scaled integers)
   - Example: sin(30°) returns 500 (representing 0.5 * 1000)

2. **Limited Precision**
   - Integer-only operations
   - Scaling factors manually managed

3. **No Advanced Math Functions**
   - No square root
   - No logarithm/exponential
   - No inverse trigonometric functions

4. **No Calculus Primitives**
   - No derivative calculation
   - No integral approximation
   - No limit evaluation

5. **BigInt in Romasm Not Implemented**
   - `bigint.romasm` is just a placeholder
   - BigInt operations currently done in JavaScript

---

## 🎯 What's Needed for Calculus Support

### 1. **Derivative Calculation**

**Required Components:**
- **Numerical Differentiation:** Calculate f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
  - Need: Function evaluation capability (✅ we have this)
  - Need: Small step size (Δx or h) - **MISSING**
  - Need: Function composition/substitution - **PARTIAL** (can be done with CALL)

**Romasm Implementation Needs:**
```assembly
; Derivative approximation: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
; Input: R0 = x, R1 = h (step size)
; Output: R0 = f'(x)
derivative:
  ; Calculate f(x+h)
  PUSH R0
  ADD R0, R1
  CALL function_f  ; User's function
  STORE R2, R0     ; Save f(x+h)
  
  ; Calculate f(x-h)
  POP R0
  SUB R0, R1
  CALL function_f
  STORE R3, R0     ; Save f(x-h)
  
  ; f'(x) = (f(x+h) - f(x-h)) / (2h)
  LOAD R0, R2
  SUB R0, R3
  LOAD R1, 2
  MUL R1, [h]      ; 2h
  DIV R0, R1
  RET
```

**Missing:**
- Standard way to represent small step sizes (Δx)
- Function pointer/call-by-name mechanism
- Better precision handling for small differences

---

### 2. **Definite Integral Calculation**

**Required Components:**
- **Numerical Integration:** ∫[a,b] f(x) dx ≈ Σ f(x_i) * Δx
  - Need: Loop from a to b - **✅ HAVE** (JMP, loops)
  - Need: Accumulation (sum) - **✅ HAVE** (ADD)
  - Need: Small step size Δx - **MISSING**
  - Need: Function evaluation - **✅ HAVE** (CALL)

**Romasm Implementation Needs:**
```assembly
; Definite integral: S^b_a f(x) Dx
; Input: R0 = a (lower bound), R1 = b (upper bound), R2 = Δx (step size)
; Output: R0 = integral result
integral:
  LOAD R3, 0      ; R3 = accumulator (sum)
  LOAD R4, R0     ; R4 = current x (starts at a)
  
integral_loop:
  ; Check if x >= b
  CMP R4, R1
  JGE integral_done
  
  ; Evaluate f(x)
  PUSH R4
  LOAD R0, R4
  CALL function_f
  ; R0 now contains f(x)
  
  ; Add f(x) * Δx to accumulator
  MUL R0, R2      ; f(x) * Δx
  ADD R3, R0      ; sum += f(x) * Δx
  
  ; Increment x by Δx
  POP R4
  ADD R4, R2
  JMP integral_loop
  
integral_done:
  LOAD R0, R3
  RET
```

**Missing:**
- Standard Δx representation
- Better precision for small step sizes
- Adaptive step sizing (for better accuracy)

---

### 3. **Symbolic Notation Support**

**Proposed Romasm Calculus Notation:**
- **Derivative:** `D` operator (from *differentia*)
  - Example: `D f(x)` or `D_x f(x)`
- **Integral:** `S` operator (from *summa*)
  - Example: `S^b_a f(x) Dx` (definite integral)
  - Example: `S f(x) Dx` (indefinite integral - conceptual)

**Implementation Approach:**
- These would be **macros** or **subroutines** in Romasm
- Not new ISA instructions, but standard library functions
- Could add assembler directives: `#DEFINE D(f) derivative(f)`

---

### 4. **Enhanced Math Functions Needed**

**For Calculus:**
- **Square Root** - Needed for distance calculations, normalization
- **Exponential (e^x)** - Needed for derivatives of exponential functions
- **Natural Logarithm (ln)** - Needed for derivatives of log functions
- **Inverse Trig Functions** - asin, acos, atan (for derivatives)

**Current Status:**
- ❌ Square root - **NOT IMPLEMENTED**
- ❌ Exponential - **NOT IMPLEMENTED**
- ❌ Logarithm - **NOT IMPLEMENTED**
- ❌ Inverse trig - **NOT IMPLEMENTED**

---

### 5. **Precision & Scaling Improvements**

**Current Issues:**
- Manual scaling (e.g., multiply by 1000, then divide)
- No standard scaling convention
- Precision loss in nested calculations

**Proposed Solutions:**
- **Standard scaling constants:**
  ```assembly
  ; Constants for scaling
  SCALE_1000: 1000    ; For 3 decimal places
  SCALE_10000: 10000  ; For 4 decimal places
  DELTA_X: 1          ; Small step size (scaled)
  ```

- **Scaling macros:**
  ```assembly
  ; Macro: Scale result by 1000
  ; Usage: SCALE_RESULT R0
  SCALE_RESULT:
    MUL R0, 1000
    RET
  ```

---

## 📋 Expansion Plan

### Phase 1: Foundation (Current → Ready for Calculus)

1. **Add Square Root Function**
   - Implement Newton's method or binary search
   - File: `stdlib/math.romasm` → add `sqrt` subroutine

2. **Standardize Scaling Constants**
   - Create `stdlib/constants.romasm` with standard scaling values
   - Document scaling conventions

3. **Improve Function Composition**
   - Better subroutine calling conventions
   - Function pointer mechanism (or standardized function interface)

### Phase 2: Basic Calculus Primitives

4. **Implement Numerical Derivative**
   - File: `stdlib/calculus.romasm` → add `derivative` subroutine
   - Support for central difference method
   - Input: function (via CALL), x, step size

5. **Implement Definite Integral**
   - File: `stdlib/calculus.romasm` → add `integral` subroutine
   - Support for rectangular/trapezoidal rule
   - Input: function, a, b, step size

6. **Add Calculus Notation Macros**
   - Assembler preprocessor for `D` and `S` symbols
   - Or: Standard library wrappers

### Phase 3: Advanced Calculus

7. **Add More Integration Methods**
   - Simpson's rule (more accurate)
   - Adaptive quadrature

8. **Add More Math Functions**
   - Exponential (e^x) using Taylor series
   - Natural logarithm
   - Inverse trigonometric functions

9. **Graphics Calculator Integration**
   - Plot derivatives in real-time
   - Shade area under curve (integral visualization)

---

## 🚀 Immediate Next Steps

### Option A: Start with Square Root (Foundation)
- Most basic missing function
- Needed for many calculus operations
- Relatively simple to implement

### Option B: Start with Derivative (Direct Calculus)
- More exciting/visible feature
- Can demonstrate calculus immediately
- Requires function evaluation (already have)

### Option C: Start with Integral (Most Visual)
- Great for graphics calculator
- Visual appeal (shading area under curve)
- Requires loops (already have)

**Recommendation:** Start with **Option A (Square Root)** → then **Option B (Derivative)** → then **Option C (Integral)**

This builds a solid foundation before tackling the more complex calculus operations.

---

## 📝 Files to Create/Modify

### New Files:
- `stdlib/calculus.romasm` - Derivative and integral functions
- `stdlib/constants.romasm` - Standard scaling constants
- `stdlib/advanced-math.romasm` - sqrt, exp, ln, etc.

### Files to Enhance:
- `stdlib/math.romasm` - Add sqrt function
- `stdlib/README.md` - Document new calculus functions
- `calculator.html` - Add derivative/integral plotting

### Documentation:
- `CALCULUS_GUIDE.md` - How to use calculus in Romasm
- Update `stdlib/README.md` with calculus examples

---

## 🎓 Example: Complete Calculus Workflow

**Goal:** Calculate derivative of f(x) = x² at x = 5

```assembly
; Function: f(x) = x²
; Input: R0 = x
; Output: R0 = x²
function_square:
  LOAD R1, R0
  MUL R0, R1
  RET

; Main program
main:
  ; Calculate f'(5) for f(x) = x²
  LOAD R0, 5      ; x = 5
  LOAD R1, 1      ; h = 0.001 (scaled: 1 represents 0.001)
  CALL derivative ; Uses function_square
  ; R0 now contains f'(5) ≈ 10
  PRINT R0
```

This demonstrates the complete calculus workflow once all components are in place!

