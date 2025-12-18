/**
 * Romasm Extended - Advanced features
 * 
 * Extensions:
 * 1. Radix Point for Fractions
 * 2. Negative Numbers (Sign-Magnitude and Ten's Complement)
 * 3. Bijective Numeration (optional)
 */

const { RomasmRegister, RomasmOperations } = require('./romasm.js');

class RomasmExtended {
    /**
     * Extended Romasm with fractions and negative numbers
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.radixChar = options.radixChar || ':';  // Colon for radix point
        this.negativeMode = options.negativeMode || 'sign-magnitude'; // 'sign-magnitude' or 'tens-complement'
        this.registerWidth = options.registerWidth || 4; // For tens-complement
        this.bijective = options.bijective || false; // Use bijective numeration
    }

    /**
     * Convert decimal number to Romasm with radix point support
     * @param {number} number - Decimal number (can be fractional)
     * @returns {string} Romasm representation
     */
    toRomasm(number) {
        if (number < 0) {
            return this._handleNegative(number);
        }

        if (number === 0) {
            return 'N';
        }

        // Split into integer and fractional parts
        const parts = String(number).split('.');
        const integerPart = parseInt(parts[0]);
        const fractionalPart = parts[1] ? parseFloat('0.' + parts[1]) : 0;

        // Convert integer part
        const integerRomasm = this._decimalToRomasmDigits(integerPart);

        // Convert fractional part if present
        if (fractionalPart > 0) {
            const fractionalRomasm = this._fractionalToRomasm(fractionalPart);
            return `${integerRomasm}${this.radixChar}${fractionalRomasm}`;
        }

        return integerRomasm;
    }

    /**
     * Convert Romasm string to decimal
     * @param {string} romasm - Romasm string
     * @returns {number} Decimal value
     */
    fromRomasm(romasm) {
        if (romasm === 'N' || romasm === '') {
            return 0;
        }

        // Check for negative
        let isNegative = false;
        if (romasm.startsWith('-')) {
            isNegative = true;
            romasm = romasm.substring(1).trim();
        }

        // Split by radix point
        const parts = romasm.split(this.radixChar);
        const integerPart = parts[0].trim();
        const fractionalPart = parts[1] ? parts[1].trim() : '';

        // Convert integer part
        let value = this._romasmDigitsToDecimal(integerPart);

        // Convert fractional part
        if (fractionalPart) {
            const fractionalValue = this._romasmFractionalToDecimal(fractionalPart);
            value += fractionalValue;
        }

        return isNegative ? -value : value;
    }

    /**
     * Handle negative numbers
     * @param {number} number - Negative number
     * @returns {string} Romasm representation
     */
    _handleNegative(number) {
        const absValue = Math.abs(number);

        if (this.negativeMode === 'sign-magnitude') {
            // Simple: prefix with minus sign
            return `-${this.toRomasm(absValue)}`;
        } else if (this.negativeMode === 'tens-complement') {
            // Ten's complement: (max_value - abs_value + 1)
            const maxValue = Math.pow(10, this.registerWidth) - 1;
            const complement = maxValue - absValue + 1;
            return this.toRomasm(complement);
        }

        return this.toRomasm(absValue);
    }

    /**
     * Convert decimal integer to Romasm digits (using Positional Roman logic)
     * @param {number} number - Integer
     * @returns {string} Romasm digits
     */
    _decimalToRomasmDigits(number) {
        if (number === 0) return 'N';

        const digits = String(number).split('').map(d => parseInt(d));
        const positionalDigits = digits.map(d => this._digitToRomasm(d));
        return positionalDigits.join(' ');
    }

    /**
     * Convert single digit (0-9) to Romasm
     * @param {number} digit - Digit 0-9
     * @returns {string} Romasm digit
     */
    _digitToRomasm(digit) {
        const digits = {
            0: 'N', 1: 'I', 2: 'II', 3: 'III', 4: 'IV',
            5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX'
        };
        return digits[digit] || 'N';
    }

    /**
     * Convert Romasm digits to decimal
     * @param {string} romasm - Romasm digit string
     * @returns {number} Decimal value
     */
    _romasmDigitsToDecimal(romasm) {
        const parts = romasm.trim().split(/\s+/);
        const digits = parts.map(part => this._romasmToDigit(part));
        return parseInt(digits.join(''));
    }

    /**
     * Convert Romasm digit to decimal digit
     * @param {string} romasm - Single Romasm digit
     * @returns {number} Decimal digit 0-9
     */
    _romasmToDigit(romasm) {
        const digits = {
            'N': 0, 'I': 1, 'II': 2, 'III': 3, 'IV': 4,
            'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9
        };
        return digits[romasm.toUpperCase()] ?? 0;
    }

    /**
     * Convert fractional part to Romasm
     * @param {number} fraction - Fractional value (0 < fraction < 1)
     * @param {number} precision - Number of decimal places
     * @returns {string} Romasm fractional representation
     */
    _fractionalToRomasm(fraction, precision = 4) {
        const parts = [];
        let remaining = fraction;

        for (let i = 0; i < precision && remaining > 0; i++) {
            remaining *= 10;
            const digit = Math.floor(remaining);
            parts.push(this._digitToRomasm(digit));
            remaining -= digit;
        }

        return parts.join(' ');
    }

    /**
     * Convert Romasm fractional part to decimal
     * @param {string} romasm - Romasm fractional string
     * @returns {number} Fractional decimal value
     */
    _romasmFractionalToDecimal(romasm) {
        const parts = romasm.trim().split(/\s+/);
        let value = 0;
        let place = 0.1;

        for (const part of parts) {
            const digit = this._romasmToDigit(part);
            value += digit * place;
            place /= 10;
        }

        return value;
    }

    /**
     * Convert from Ten's Complement back to signed decimal
     * @param {string} romasm - Romasm in ten's complement
     * @returns {number} Signed decimal value
     */
    fromTensComplement(romasm) {
        const value = this._romasmDigitsToDecimal(romasm);
        const maxValue = Math.pow(10, this.registerWidth) - 1;
        const midpoint = Math.floor(maxValue / 2);

        if (value > midpoint) {
            // Negative number
            return -(maxValue - value + 1);
        } else {
            // Positive number
            return value;
        }
    }
}

/**
 * Romasm ISA - Instruction Set Architecture
 * Maps Roman symbols to CPU operations
 */
class RomasmISA {
    constructor() {
        // Instruction mappings
        this.instructions = {
            'I': 'INC',      // Increment
            'D': 'DEC',      // Decrement
            'V': 'JMP',      // Jump
            'X': 'STORE',    // Store to memory
            'L': 'LOAD',     // Load from memory
            'C': 'CMP',      // Compare
            'M': 'MUL',      // Multiply
            'A': 'ADD',      // Add
            'S': 'SUB',      // Subtract
        };

        // Register mappings
        this.registers = {
            'I': 0, 'II': 1, 'III': 2, 'IV': 3, 'V': 4,
            'VI': 5, 'VII': 6, 'VIII': 7, 'IX': 8
        };
    }

    /**
     * Parse Romasm instruction
     * @param {string} instruction - Romasm instruction string
     * @returns {Object} Parsed instruction
     */
    parse(instruction) {
        const parts = instruction.trim().split(/\s+/);
        if (parts.length === 0) return null;

        const opcode = parts[0];
        const operation = this.instructions[opcode] || 'UNKNOWN';

        const result = {
            opcode: opcode,
            operation: operation,
            raw: instruction
        };

        // Parse operands
        if (parts.length > 1) {
            result.operands = parts.slice(1).map(op => {
                // Check if it's a register
                if (op in this.registers) {
                    return { type: 'register', value: this.registers[op] };
                }
                // Check if it's a number
                const num = parseInt(op);
                if (!isNaN(num)) {
                    return { type: 'immediate', value: num };
                }
                return { type: 'label', value: op };
            });
        }

        return result;
    }

    /**
     * Execute Romasm instruction
     * @param {string} instruction - Romasm instruction
     * @param {Object} vm - Virtual machine state
     * @returns {Object} Execution result
     */
    execute(instruction, vm = { registers: {}, memory: {}, pc: 0 }) {
        const parsed = this.parse(instruction);
        if (!parsed) {
            return { error: 'Invalid instruction' };
        }

        const result = {
            instruction: parsed,
            vm: { ...vm },
            executed: false
        };

        // Simple execution simulation
        switch (parsed.operation) {
            case 'INC':
                if (parsed.operands && parsed.operands[0]) {
                    const reg = parsed.operands[0].value;
                    result.vm.registers[reg] = (result.vm.registers[reg] || 0) + 1;
                    result.executed = true;
                }
                break;
            case 'STORE':
                if (parsed.operands && parsed.operands.length >= 2) {
                    const value = parsed.operands[0].value;
                    const addr = parsed.operands[1].value;
                    result.vm.memory[addr] = value;
                    result.executed = true;
                }
                break;
            // Add more operations as needed
        }

        result.vm.pc = (result.vm.pc || 0) + 1;
        return result;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmExtended, RomasmISA };
}

