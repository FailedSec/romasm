# Romasm - Roman Numeral Assembly Language

**Romasm** is a binary-like system using Roman numerals as register states, similar to how binary uses bits. Each Roman symbol (I, V, X, L, C, D, M) represents a fixed value that can be "on" or "off" in registers, just like binary bits.

## Key Concepts

### 1. Register System (The "Slot" Logic)

In binary, each position represents a power of 2 (2⁰, 2¹, 2²...). In Romasm, each Roman symbol represents a fixed value that can be "on" or "off" in registers.

**Example Register State:**
```
I: ON  (1)
V: OFF (0)
X: ON  (10)
L: OFF (0)
C: OFF (0)
D: OFF (0)
M: OFF (0)
```
**Value: 1 + 10 = 11**

### 2. Pure Additive (No Subtraction Rules)

Standard Roman numerals use subtraction rules (IV for 4, IX for 9). Romasm eliminates these for direct hardware mapping.

- **Standard Roman:** IV (subtractive)
- **Romasm:** IIII (pure additive) - though with single registers, we approximate

This allows 1:1 mapping to hardware states - you can't have a "subtractive" transistor; it's either on or off.

### 3. Binary Operations

Romasm supports binary logic operations by comparing register states:

#### OR Operation
Combine active registers from both inputs:
```
Register A: X I (value: 11)  → X=ON, I=ON
Register B: V I (value: 6)   → V=ON, I=ON
OR Result:   X V I (value: 16) → X=ON, V=ON, I=ON
```

#### AND Operation
Only keep registers active in both inputs:
```
Register A: X I (value: 11)  → X=ON, I=ON
Register B: V I (value: 6)   → V=ON, I=ON
AND Result: I (value: 1)    → I=ON (only common register)
```

#### XOR Operation
Registers active in exactly one input:
```
Register A: X (value: 10)    → X=ON
Register B: V (value: 5)     → V=ON
XOR Result: X V (value: 15)  → X=ON, V=ON (exclusive to each)
```

### 4. Peasant Multiplication (Binary Multiplication)

The ancient Roman method of duplation and mediation is effectively binary multiplication:

```
Multiply 7 × 13:
  7 × 1  = 7  (odd, add to result)
 14 × 0  = 0  (even, skip)
 28 × 0  = 0  (even, skip)
 56 × 1  = 56 (odd, add to result)
Result: 7 + 56 = 63
```

This mirrors how modern ALUs process multiplication using shifts and adds.

## Comparison: Standard Roman vs Romasm

| Feature | Standard Roman | Romasm (Binary Logic) |
|---------|---------------|----------------------|
| **Notation** | Additive & Subtractive (IV) | Pure Additive (IIII) |
| **Logic** | Cumulative (Sum of parts) | Positional (Fixed bit-slots) |
| **Zero** | No symbol (represented by nulla) | "Off" state (0 in all slots) |
| **Efficiency** | Good for recording | Good for computation |
| **Operations** | Manual calculation | Binary operations (AND/OR/XOR) |

## Usage

### Web Interface

Open `romasm.html` in your browser or visit `http://localhost:6969/romasm.html` when the server is running.

### JavaScript API

```javascript
const { RomasmRegister, RomasmOperations, RomasmVM } = require('./romasm.js');

// Create registers
const regA = RomasmRegister.fromDecimal(11); // X I
const regB = RomasmRegister.fromDecimal(6);  // V I

// Binary operations
const orResult = RomasmOperations.OR(regA, regB);    // X V I = 16
const andResult = RomasmOperations.AND(regA, regB);   // I = 1
const xorResult = RomasmOperations.XOR(regA, regB);   // X V = 15

// Arithmetic
const addResult = RomasmOperations.ADD(regA, regB);      // 17
const multResult = RomasmOperations.MULTIPLY(regA, regB); // 66

// Virtual Machine
const vm = new RomasmVM();
vm.load('A', 11);
vm.load('B', 6);
vm.execute('OR', 'A', 'B', 'ACC');
console.log(vm.getState());
```

## Limitations

With only 7 registers (one per symbol: I, V, X, L, C, D, M), Romasm cannot represent all values exactly. For example:
- Value 4 requires IIII (four I's), but we only have one I register
- Value 17 requires X + V + I + I, but we only have one I register

In a full implementation, you would need:
- Multiple registers for repeatable symbols (I, X, C, M)
- Or a different encoding scheme

However, this demonstrates the core concept: **Roman numerals as binary-like register states**.

## Inspiration

This concept bridges:
- **Roman Numerals** ↔ **Assembly Language** (low-level, literal)
- **Binary Logic** ↔ **Hardware States** (on/off, 1/0)

Just as binary uses bits (0/1) in registers, Romasm uses Roman symbols (on/off) in registers, enabling binary-like operations on a Roman numeral foundation.

## Files

- `romasm.js` - Core Romasm implementation
- `romasm.html` - Web interface
- `test-romasm.js` - Test suite

## See Also

- `positional_roman.py` / `positional-roman.js` - Positional Roman numeral system (base-10 positional)
- `index.html` - Positional Roman web interface

