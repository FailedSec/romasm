# Romasm Quick Reference: Current vs. Needed

## ✅ What We Have

### Instructions (24 total)
```
Arithmetic:  INC, DEC, ADD, SUB, MUL, DIV, MOD, SHL, SHR
Control:     JMP, JEQ, JNE, JLT, JGT, JLE, JGE, CALL, RET, CMP
Memory:      LOAD, STORE, PUSH, POP
I/O:         PRINT
```

### Math Functions
```
✅ factorial(n)      - n!
✅ power(base, exp)  - base^exp
✅ sin(angle)        - Sine (Taylor series)
✅ cos(angle)        - Cosine
✅ arg_reduce(angle) - Angle reduction
```

### Big Integer Support
```
✅ JavaScript BigInt library (bigint.js)
❌ Romasm BigInt operations (bigint.romasm is placeholder)
```

---

## ❌ What's Missing for Calculus

### Critical Missing Functions
```
❌ sqrt(x)           - Square root
❌ exp(x)            - e^x
❌ ln(x)             - Natural logarithm
❌ asin/acos/atan    - Inverse trigonometric
```

### Calculus Primitives
```
❌ derivative(f, x, h)  - Numerical derivative
❌ integral(f, a, b, dx) - Definite integral
❌ limit(f, x, a)      - Limit evaluation
```

### Infrastructure
```
❌ Standard scaling constants (SCALE_1000, DELTA_X, etc.)
❌ Function pointer/call-by-name mechanism
❌ Calculus notation (D, S symbols)
```

---

## 🎯 Priority Order for Implementation

### 1. **Square Root** (Foundation)
- **Why:** Needed for distance, normalization, many calculus ops
- **Method:** Newton's method or binary search
- **File:** `stdlib/math.romasm`
- **Complexity:** ⭐⭐ (Medium)

### 2. **Derivative** (Direct Calculus)
- **Why:** Core calculus operation, exciting feature
- **Method:** Central difference: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
- **File:** `stdlib/calculus.romasm`
- **Complexity:** ⭐⭐⭐ (Medium-Hard)

### 3. **Integral** (Visual Appeal)
- **Why:** Great for graphics calculator, visual results
- **Method:** Rectangular/Trapezoidal rule
- **File:** `stdlib/calculus.romasm`
- **Complexity:** ⭐⭐⭐ (Medium-Hard)

### 4. **Exponential & Logarithm** (Advanced)
- **Why:** Needed for derivatives of exp/log functions
- **Method:** Taylor series
- **File:** `stdlib/advanced-math.romasm`
- **Complexity:** ⭐⭐⭐⭐ (Hard)

---

## 📊 Current Capability Matrix

| Feature | Status | Implementation | Priority |
|---------|--------|-----------------|----------|
| Basic Arithmetic | ✅ Complete | ISA instructions | - |
| Trigonometry | ✅ Partial | Taylor series | - |
| Square Root | ❌ Missing | Newton's method | 🔥 High |
| Exponential | ❌ Missing | Taylor series | Medium |
| Logarithm | ❌ Missing | Series expansion | Medium |
| Derivative | ❌ Missing | Central difference | 🔥 High |
| Integral | ❌ Missing | Numerical quadrature | 🔥 High |
| BigInt (Romasm) | ❌ Missing | String operations | Low |
| Calculus Notation | ❌ Missing | Macros/wrappers | Low |

---

## 🚀 Quick Start: Adding Square Root

**File:** `stdlib/math.romasm`

```assembly
; Square root using Newton's method
; Input: R0 = n (number to find sqrt of)
; Output: R0 = sqrt(n) (scaled by 1000)
sqrt:
  ; Initial guess: x = n/2
  LOAD R1, R0
  LOAD R2, 2
  DIV R1, R2      ; R1 = guess = n/2
  
  ; Newton's method: x_new = (x + n/x) / 2
  ; Iterate 10 times for convergence
  LOAD R3, 10     ; iteration count
  
sqrt_loop:
  CMP R3, 0
  JEQ sqrt_done
  
  ; Calculate n/x
  LOAD R4, R0
  DIV R4, R1      ; R4 = n/x
  
  ; x_new = (x + n/x) / 2
  ADD R1, R4      ; R1 = x + n/x
  LOAD R4, 2
  DIV R1, R4      ; R1 = (x + n/x) / 2
  
  DEC R3
  JMP sqrt_loop
  
sqrt_done:
  LOAD R0, R1
  RET
```

**Usage:**
```assembly
LOAD R0, 25
CALL sqrt
PRINT R0    ; Outputs ~5000 (representing 5.000 * 1000)
```

---

## 📚 Next Steps

1. **Review this analysis** - Understand what we have vs. need
2. **Choose starting point** - Square root, derivative, or integral?
3. **Implement incrementally** - One function at a time
4. **Test thoroughly** - Use graphics calculator for visualization
5. **Document** - Update README with examples

---

## 🔗 Related Files

- `CAPABILITIES_ANALYSIS.md` - Detailed analysis
- `stdlib/README.md` - Current stdlib documentation
- `stdlib/math.romasm` - Basic math functions
- `stdlib/trig.romasm` - Trigonometric functions
- `calculator.html` - Graphics calculator (for testing)

