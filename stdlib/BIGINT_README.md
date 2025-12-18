# Big Integer Library for Romasm

A JavaScript implementation of arbitrary-precision arithmetic for Romasm, allowing computation with numbers far beyond JavaScript's `Number.MAX_SAFE_INTEGER` limit.

## Problem

JavaScript's `Number` type uses IEEE 754 floating-point representation, which has:
- **Maximum safe integer**: `2^53 - 1` (approximately 9 quadrillion)
- **Precision loss**: Numbers beyond this limit lose precision
- **Infinity/NaN**: Very large numbers become `Infinity` or `NaN`

This limits computational problems like the Collatz Conjecture, which can produce very large intermediate values.

## Solution

The `BigIntRomasm` class implements arbitrary-precision arithmetic using digit arrays (strings), allowing:
- **Unlimited size**: Handle numbers with thousands of digits
- **Exact precision**: No rounding errors
- **Full arithmetic**: Addition, subtraction, multiplication, division

## Usage

### Browser

```javascript
// Automatically loaded in collatz.html
const bigNum = new BigIntRomasm('99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999');

// Check if even
bigNum.isEven(); // false

// Divide by 2
const half = bigNum.divideBy2();

// Multiply by 3 and add 1 (Collatz)
const result = bigNum.multiply3Add1();
```

### Node.js

```javascript
const { BigIntRomasm } = require('./stdlib/bigint.js');

const n = new BigIntRomasm('123456789012345678901234567890');
const doubled = n.add(n);
console.log(doubled.toString());
```

## Methods

### Construction
- `new BigIntRomasm(value)` - Create from number or string

### Properties
- `toString()` - Convert to string
- `toNumber()` - Convert to number (may lose precision)
- `length()` - Number of digits
- `isZero()` - Check if zero
- `isEven()` - Check if even
- `isOdd()` - Check if odd

### Arithmetic
- `add(other)` - Add two BigInts
- `subtract(other)` - Subtract (assumes this >= other)
- `multiply(other)` - Multiply two BigInts
- `divideBy2()` - Fast division by 2 (for Collatz)
- `multiply3Add1()` - Multiply by 3 and add 1 (Collatz operation)
- `modulo(modulus)` - Modulo operation

### Comparison
- `compare(other)` - Compare: -1 (less), 0 (equal), 1 (greater)

## Implementation Details

### Digit Array Representation
Numbers are stored as arrays of digits (0-9), allowing unlimited size:
```javascript
// 12345 is stored as [1, 2, 3, 4, 5]
```

### Grade-School Algorithms
Operations use traditional algorithms:
- **Addition**: Column-by-column with carry
- **Multiplication**: Grade-school multiplication
- **Division**: Long division

### Optimizations
- `divideBy2()` uses digit-by-digit division (faster than general division)
- `isEven()` checks only the last digit
- Leading zeros are automatically removed

## Performance

For very large numbers (100+ digits):
- Addition/Subtraction: O(n) where n is number of digits
- Multiplication: O(n²) - could be optimized with Karatsuba
- Division by 2: O(n) - very fast

## Future Enhancements

- Karatsuba multiplication for faster large number multiplication
- Full division (not just divide by 2)
- Bit-shifting operations
- Square root
- Modular exponentiation
- Integration with Romasm VM for native BigInt operations

## Files

- `bigint.js` - JavaScript implementation
- `bigint.romasm` - Conceptual Romasm assembly implementation (future)

