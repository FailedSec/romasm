/**
 * Romasm - Roman Numeral Assembly Language
 * 
 * A binary-like system using Roman numerals as register states.
 * Each Roman symbol represents a fixed value that can be "on" or "off" in registers.
 * 
 * Key differences from standard Roman:
 * - Pure additive (no subtraction rules like IV)
 * - Positional register-based (like binary bits)
 * - Supports binary operations (AND, OR, XOR)
 * - Multiplication via peasant math (binary multiplication)
 */

// Roman numeral values (pure additive - no subtraction)
const ROMAN_VALUES = {
    'I': 1,
    'V': 5,
    'X': 10,
    'L': 50,
    'C': 100,
    'D': 500,
    'M': 1000
};

// Ordered by value (ascending) for register operations
const ROMAN_SYMBOLS = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
const ROMAN_VALUES_ORDERED = [1, 5, 10, 50, 100, 500, 1000];

class RomasmRegister {
    /**
     * A register that holds Roman numeral states (like binary bits).
     * Each symbol can be "on" (present) or "off" (absent).
     */
    constructor() {
        // Each symbol is a boolean: true = on, false = off
        this.registers = {
            'I': false,
            'V': false,
            'X': false,
            'L': false,
            'C': false,
            'D': false,
            'M': false
        };
    }

    /**
     * Set a register state
     * @param {string} symbol - Roman symbol (I, V, X, L, C, D, M)
     * @param {boolean} state - true = on, false = off
     */
    set(symbol, state) {
        if (!(symbol in this.registers)) {
            throw new Error(`Invalid Roman symbol: ${symbol}`);
        }
        this.registers[symbol] = state;
    }

    /**
     * Get a register state
     * @param {string} symbol - Roman symbol
     * @returns {boolean} Register state
     */
    get(symbol) {
        return this.registers[symbol];
    }

    /**
     * Get the decimal value of this register
     * @returns {number} Sum of all "on" registers
     */
    getValue() {
        let value = 0;
        for (const [symbol, state] of Object.entries(this.registers)) {
            if (state) {
                value += ROMAN_VALUES[symbol];
            }
        }
        return value;
    }

    /**
     * Set the register from a decimal value (pure additive)
     * @param {number} value - Decimal value to represent
     */
    setValue(value) {
        // Reset all registers
        for (const symbol of ROMAN_SYMBOLS) {
            this.registers[symbol] = false;
        }

        if (value === 0) {
            return;
        }

        // Greedy algorithm: use largest symbols first (pure additive)
        // In Romasm, each symbol register can only be on/off (like a bit)
        // This means we can only represent values that can be made from unique combinations
        // For values requiring multiple of the same symbol, we approximate with available symbols
        
        let remaining = value;
        const symbols = ROMAN_SYMBOLS.slice().reverse(); // Start with largest [M, D, C, L, X, V, I]

        // Use greedy approach: try to use each symbol at most once
        for (const symbol of symbols) {
            const symbolValue = ROMAN_VALUES[symbol];
            if (remaining >= symbolValue) {
                this.registers[symbol] = true;
                remaining -= symbolValue;
                if (remaining === 0) break;
            }
        }

        // If we can't represent the exact value with single symbols,
        // we use the closest approximation
        // In a real Romasm system, you'd have multiple registers for repeatable symbols
        // For now, we'll use the best approximation
        if (remaining > 0) {
            // Try to use smaller symbols to make up the difference
            for (const symbol of ROMAN_SYMBOLS) {
                const symbolValue = ROMAN_VALUES[symbol];
                if (remaining >= symbolValue && !this.registers[symbol]) {
                    this.registers[symbol] = true;
                    remaining -= symbolValue;
                    if (remaining === 0) break;
                }
            }
        }
    }

    /**
     * Get the Roman numeral string representation (pure additive)
     * @returns {string} Roman numeral string (returns 'N' for zero)
     */
    toString() {
        // If value is 0, return 'N' (nulla)
        if (this.getValue() === 0) {
            return 'N';
        }
        
        const parts = [];
        // Iterate from largest to smallest for proper display
        for (const symbol of ROMAN_SYMBOLS.slice().reverse()) {
            if (this.registers[symbol]) {
                parts.push(symbol);
            }
        }
        return parts.join('');
    }

    /**
     * Create a register from a Roman numeral string (pure additive)
     * @param {string} roman - Roman numeral string (e.g., "IIII" for 4, not "IV")
     * @returns {RomasmRegister} New register instance
     */
    static fromRoman(roman) {
        const reg = new RomasmRegister();
        for (const char of roman.toUpperCase()) {
            if (char in ROMAN_VALUES) {
                reg.set(char, true);
            }
        }
        return reg;
    }

    /**
     * Create a register from a decimal value
     * @param {number} value - Decimal value
     * @returns {RomasmRegister} New register instance
     */
    static fromDecimal(value) {
        const reg = new RomasmRegister();
        reg.setValue(value);
        return reg;
    }
}

/**
 * Binary operations on Romasm registers
 */
class RomasmOperations {
    /**
     * OR operation: Combine active registers from both inputs
     * @param {RomasmRegister} a - First register
     * @param {RomasmRegister} b - Second register
     * @returns {RomasmRegister} Result register
     */
    static OR(a, b) {
        const result = new RomasmRegister();
        for (const symbol of ROMAN_SYMBOLS) {
            result.set(symbol, a.get(symbol) || b.get(symbol));
        }
        return result;
    }

    /**
     * AND operation: Only keep registers that are active in both inputs
     * @param {RomasmRegister} a - First register
     * @param {RomasmRegister} b - Second register
     * @returns {RomasmRegister} Result register
     */
    static AND(a, b) {
        const result = new RomasmRegister();
        for (const symbol of ROMAN_SYMBOLS) {
            result.set(symbol, a.get(symbol) && b.get(symbol));
        }
        return result;
    }

    /**
     * XOR operation: Registers active in exactly one input
     * @param {RomasmRegister} a - First register
     * @param {RomasmRegister} b - Second register
     * @returns {RomasmRegister} Result register
     */
    static XOR(a, b) {
        const result = new RomasmRegister();
        for (const symbol of ROMAN_SYMBOLS) {
            result.set(symbol, a.get(symbol) !== b.get(symbol));
        }
        return result;
    }

    /**
     * ADD operation: Add two registers (sum their values)
     * @param {RomasmRegister} a - First register
     * @param {RomasmRegister} b - Second register
     * @returns {RomasmRegister} Result register
     */
    static ADD(a, b) {
        const sum = a.getValue() + b.getValue();
        return RomasmRegister.fromDecimal(sum);
    }

    /**
     * Peasant Multiplication (Binary Multiplication)
     * Uses the ancient Roman method of duplation and mediation
     * which is effectively binary multiplication.
     * 
     * @param {RomasmRegister} a - First register
     * @param {RomasmRegister} b - Second register
     * @returns {RomasmRegister} Result register
     */
    static MULTIPLY(a, b) {
        let multiplicand = a.getValue();
        let multiplier = b.getValue();
        let result = 0;

        // Peasant multiplication algorithm
        while (multiplier > 0) {
            if (multiplier % 2 === 1) {
                // If multiplier is odd, add multiplicand to result
                result += multiplicand;
            }
            // Double the multiplicand, halve the multiplier
            multiplicand *= 2;
            multiplier = Math.floor(multiplier / 2);
        }

        return RomasmRegister.fromDecimal(result);
    }

    /**
     * Shift left (multiply by 2) - like binary left shift
     * @param {RomasmRegister} reg - Register to shift
     * @returns {RomasmRegister} Result register
     */
    static SHIFT_LEFT(reg) {
        const value = reg.getValue() * 2;
        return RomasmRegister.fromDecimal(value);
    }

    /**
     * Shift right (divide by 2) - like binary right shift
     * @param {RomasmRegister} reg - Register to shift
     * @returns {RomasmRegister} Result register
     */
    static SHIFT_RIGHT(reg) {
        const value = Math.floor(reg.getValue() / 2);
        return RomasmRegister.fromDecimal(value);
    }
}

/**
 * Romasm Virtual Machine
 * Simulates a simple CPU with Roman numeral registers
 */
class RomasmVM {
    constructor() {
        this.registers = {
            'A': new RomasmRegister(),
            'B': new RomasmRegister(),
            'C': new RomasmRegister(),
            'ACC': new RomasmRegister() // Accumulator
        };
    }

    /**
     * Load a value into a register
     * @param {string} regName - Register name (A, B, C, ACC)
     * @param {number|string} value - Decimal value or Roman string
     */
    load(regName, value) {
        if (!(regName in this.registers)) {
            throw new Error(`Invalid register: ${regName}`);
        }

        if (typeof value === 'number') {
            this.registers[regName].setValue(value);
        } else {
            this.registers[regName] = RomasmRegister.fromRoman(value);
        }
    }

    /**
     * Get register value
     * @param {string} regName - Register name
     * @returns {RomasmRegister} Register instance
     */
    getRegister(regName) {
        return this.registers[regName];
    }

    /**
     * Execute an operation
     * @param {string} op - Operation name (OR, AND, XOR, ADD, MULTIPLY)
     * @param {string} regA - First register
     * @param {string} regB - Second register
     * @param {string} destReg - Destination register (default: ACC)
     */
    execute(op, regA, regB, destReg = 'ACC') {
        const a = this.registers[regA];
        const b = this.registers[regB];

        let result;
        switch (op.toUpperCase()) {
            case 'OR':
                result = RomasmOperations.OR(a, b);
                break;
            case 'AND':
                result = RomasmOperations.AND(a, b);
                break;
            case 'XOR':
                result = RomasmOperations.XOR(a, b);
                break;
            case 'ADD':
                result = RomasmOperations.ADD(a, b);
                break;
            case 'MULTIPLY':
            case 'MUL':
                result = RomasmOperations.MULTIPLY(a, b);
                break;
            default:
                throw new Error(`Unknown operation: ${op}`);
        }

        this.registers[destReg] = result;
        return result;
    }

    /**
     * Get state of all registers
     * @returns {Object} Register states
     */
    getState() {
        const state = {};
        for (const [name, reg] of Object.entries(this.registers)) {
            const value = reg.getValue();
            state[name] = {
                value: value,
                roman: reg.toString(), // toString() now returns 'N' for zero
                registers: { ...reg.registers }
            };
        }
        return state;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RomasmRegister,
        RomasmOperations,
        RomasmVM,
        ROMAN_VALUES,
        ROMAN_SYMBOLS
    };
}

