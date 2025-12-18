# Romasm Extensions

This document describes the advanced features and extensions implemented for Romasm.

## 1. Radix Point for Fractions

### Concept
To represent fractional values (values less than 1), Romasm uses a **radix point** (colon `:`) similar to a decimal point.

### Implementation
- Each position to the right of the radix point represents a power of the base's inverse (10⁻¹, 10⁻², ...)
- Example: `I V:V I` represents 15.51 (15 + 5/10 + 1/100)

### Usage
```javascript
const ext = new RomasmExtended({ radixChar: ':' });
ext.toRomasm(15.51);    // Returns: "I V:V I"
ext.fromRomasm("I V:V I"); // Returns: 15.51
```

### Advantages
- Allows representation of any fractional value
- No need for new symbols (unlike historical Roman fractions)
- Can represent irrational numbers like π (with sufficient precision)

## 2. Negative Numbers

Romasm supports two methods for representing negative numbers:

### A. Sign-Magnitude (The "Prefix" Method)

**Concept:** Simple prefix with minus sign, just like decimal.

**Implementation:**
```javascript
const ext = new RomasmExtended({ negativeMode: 'sign-magnitude' });
ext.toRomasm(-15);  // Returns: "-I V"
ext.fromRomasm("-I V"); // Returns: -15
```

**Pros:**
- Very easy for humans to read
- Intuitive representation

**Cons:**
- Creates "negative zero" problem
- Less efficient for arithmetic operations

### B. Ten's Complement (The "Reflector" Method)

**Concept:** Similar to Two's Complement in binary, uses complement arithmetic.

**Implementation:**
```javascript
const ext = new RomasmExtended({ 
    negativeMode: 'tens-complement',
    registerWidth: 4  // 4-digit system (max 9999)
});
ext.toRomasm(-15);  // Returns complement representation
```

**How it works:**
1. For a 4-digit system, max value is 9999 (IX IX IX IX)
2. To represent -15:
   - Subtract 15 from 9999: 9999 - 15 = 9984
   - Add 1: 9984 + 1 = 9985
   - Result: IX IX VIII V

**Pros:**
- Perfect for "Machine Code" simulations
- Allows subtraction using only addition logic (like real ALU)
- No negative zero problem

**Cons:**
- Requires fixed "bit-width" (register size)
- Less intuitive for humans

## 3. Romasm ISA (Instruction Set Architecture)

### Concept
Map Roman symbols to CPU operations, treating Romasm as a literal assembly language.

### Instruction Mappings

| Symbol | Operation | Description |
|--------|-----------|-------------|
| I | INC | Increment |
| D | DEC | Decrement |
| V | JMP | Jump |
| X | STORE | Store to memory |
| L | LOAD | Load from memory |
| C | CMP | Compare |
| M | MUL | Multiply |
| A | ADD | Add |
| S | SUB | Subtract |

### Register Mappings
Roman numerals I-IX map to registers 0-8:
- I → Register 0
- II → Register 1
- III → Register 2
- ...
- IX → Register 8

### Examples

```javascript
const isa = new RomasmISA();

// Parse instruction
isa.parse('I II');
// Returns: { opcode: 'I', operation: 'INC', operands: [{ type: 'register', value: 1 }] }

// Execute instruction
isa.execute('X V III', { registers: {}, memory: {}, pc: 0 });
// STORE value 5 to address 3
```

### Example Instructions
- `I II` - Increment register 1
- `X V III` - Store value 5 to address 3
- `L I` - Load from register 0

## 4. Future Extensions (Not Yet Implemented)

### Bijective Numeration
Eliminate zero entirely by using symbols 1 to b instead of 0 to b-1.

### Mixed Radix System
Use different bases for different positions (like time: 60 seconds, 60 minutes, 24 hours).

### High-Value Magnification
- **Vinculum (Overscore):** Multiply by 1000 (historical Roman)
- **Brackets:** Treat value as single "chunk" in larger base system

### Pure Additive Logic
Strictly enforce pure additive notation (IIII instead of IV) for computational efficiency.

## Files

- `romasm-extended.js` - Core extended functionality
- `romasm-extended.html` - Web interface for extended features
- `test-extended.js` - Test suite

## Usage

### Node.js
```javascript
const { RomasmExtended, RomasmISA } = require('./romasm-extended.js');

// Fractions
const ext = new RomasmExtended({ radixChar: ':' });
ext.toRomasm(15.51);  // "I V:V I"

// Negatives
const extNeg = new RomasmExtended({ negativeMode: 'sign-magnitude' });
extNeg.toRomasm(-15);  // "-I V"

// ISA
const isa = new RomasmISA();
isa.parse('I II');  // Parse instruction
```

### Web Interface
Open `romasm-extended.html` in your browser or visit `http://localhost:6969/romasm-extended.html`

## References

These extensions are based on discussions about:
- Radix points in positional notation
- Negative number representation in computer science
- Instruction Set Architectures
- Bijective numeration systems
- Mixed radix systems

