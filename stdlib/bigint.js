/**
 * Big Integer Library for Romasm
 * 
 * Handles arbitrarily large numbers using string/digit array representation
 * This bypasses JavaScript's Number.MAX_SAFE_INTEGER limit
 */

class BigIntRomasm {
    /**
     * Create a Big Integer from a number or string
     * @param {number|string} value - Initial value
     */
    constructor(value) {
        if (typeof value === 'string') {
            // Remove any non-digit characters
            this.digits = value.replace(/\D/g, '').split('').map(d => parseInt(d));
        } else if (typeof value === 'number') {
            this.digits = String(value).split('').map(d => parseInt(d));
        } else {
            this.digits = [0];
        }
        
        // Remove leading zeros
        while (this.digits.length > 1 && this.digits[0] === 0) {
            this.digits.shift();
        }
    }

    /**
     * Convert to string
     * @returns {string} String representation
     */
    toString() {
        return this.digits.join('');
    }

    /**
     * Convert to number (may lose precision for very large numbers)
     * @returns {number} Numeric value
     */
    toNumber() {
        return parseInt(this.toString()) || 0;
    }

    /**
     * Get number of digits
     * @returns {number} Digit count
     */
    length() {
        return this.digits.length;
    }

    /**
     * Check if zero
     * @returns {boolean} True if zero
     */
    isZero() {
        return this.digits.length === 1 && this.digits[0] === 0;
    }

    /**
     * Check if even
     * @returns {boolean} True if even
     */
    isEven() {
        return this.digits[this.digits.length - 1] % 2 === 0;
    }

    /**
     * Check if odd
     * @returns {boolean} True if odd
     */
    isOdd() {
        return !this.isEven();
    }

    /**
     * Compare with another BigInt
     * @param {BigIntRomasm} other - Other BigInt to compare
     * @returns {number} -1 if less, 0 if equal, 1 if greater
     */
    compare(other) {
        if (this.length() < other.length()) return -1;
        if (this.length() > other.length()) return 1;
        
        for (let i = 0; i < this.digits.length; i++) {
            if (this.digits[i] < other.digits[i]) return -1;
            if (this.digits[i] > other.digits[i]) return 1;
        }
        
        return 0;
    }

    /**
     * Add another BigInt
     * @param {BigIntRomasm} other - BigInt to add
     * @returns {BigIntRomasm} Sum
     */
    add(other) {
        const result = [];
        let carry = 0;
        const maxLen = Math.max(this.digits.length, other.digits.length);
        
        for (let i = 0; i < maxLen || carry > 0; i++) {
            const a = i < this.digits.length ? this.digits[this.digits.length - 1 - i] : 0;
            const b = i < other.digits.length ? other.digits[other.digits.length - 1 - i] : 0;
            const sum = a + b + carry;
            result.unshift(sum % 10);
            carry = Math.floor(sum / 10);
        }
        
        return new BigIntRomasm(result.join(''));
    }

    /**
     * Subtract another BigInt (assumes this >= other)
     * @param {BigIntRomasm} other - BigInt to subtract
     * @returns {BigIntRomasm} Difference
     */
    subtract(other) {
        if (this.compare(other) < 0) {
            throw new Error('Subtraction would result in negative number');
        }
        
        const result = [];
        let borrow = 0;
        
        for (let i = 0; i < this.digits.length; i++) {
            const a = this.digits[this.digits.length - 1 - i];
            const b = i < other.digits.length ? other.digits[other.digits.length - 1 - i] : 0;
            let diff = a - b - borrow;
            
            if (diff < 0) {
                diff += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            
            result.unshift(diff);
        }
        
        // Remove leading zeros
        while (result.length > 1 && result[0] === 0) {
            result.shift();
        }
        
        return new BigIntRomasm(result.join(''));
    }

    /**
     * Multiply by another BigInt
     * @param {BigIntRomasm} other - BigInt to multiply by
     * @returns {BigIntRomasm} Product
     */
    multiply(other) {
        if (this.isZero() || other.isZero()) {
            return new BigIntRomasm(0);
        }
        
        const result = new Array(this.digits.length + other.digits.length).fill(0);
        
        for (let i = this.digits.length - 1; i >= 0; i--) {
            for (let j = other.digits.length - 1; j >= 0; j--) {
                const product = this.digits[i] * other.digits[j];
                const pos1 = i + j;
                const pos2 = i + j + 1;
                
                const sum = product + result[pos2];
                result[pos2] = sum % 10;
                result[pos1] += Math.floor(sum / 10);
            }
        }
        
        // Remove leading zeros
        while (result.length > 1 && result[0] === 0) {
            result.shift();
        }
        
        return new BigIntRomasm(result.join(''));
    }

    /**
     * Divide by 2 (fast operation for Collatz)
     * @returns {BigIntRomasm} Quotient
     */
    divideBy2() {
        const result = [];
        let remainder = 0;
        
        for (let i = 0; i < this.digits.length; i++) {
            const dividend = remainder * 10 + this.digits[i];
            result.push(Math.floor(dividend / 2));
            remainder = dividend % 2;
        }
        
        // Remove leading zeros
        while (result.length > 1 && result[0] === 0) {
            result.shift();
        }
        
        return new BigIntRomasm(result.join(''));
    }

    /**
     * Multiply by 3 and add 1 (Collatz odd operation)
     * @returns {BigIntRomasm} Result
     */
    multiply3Add1() {
        const multiplied = this.multiply(new BigIntRomasm(3));
        return multiplied.add(new BigIntRomasm(1));
    }

    /**
     * Modulo operation
     * @param {BigIntRomasm} modulus - Modulus
     * @returns {BigIntRomasm} Remainder
     */
    modulo(modulus) {
        // For mod 2, just check last digit
        if (modulus.toNumber() === 2) {
            return new BigIntRomasm(this.digits[this.digits.length - 1] % 2);
        }
        
        // For other moduli, use long division
        // Simplified: for small moduli, we can use this approach
        const modNum = modulus.toNumber();
        if (modNum > 0 && modNum < 1000) {
            // Use string-based modulo for small moduli
            let remainder = 0;
            for (let i = 0; i < this.digits.length; i++) {
                remainder = (remainder * 10 + this.digits[i]) % modNum;
            }
            return new BigIntRomasm(remainder);
        }
        
        // For large moduli, use full long division
        return this.moduloLongDivision(modulus);
    }
    
    /**
     * Modulo using long division (for large moduli)
     * @param {BigIntRomasm} modulus - Modulus
     * @returns {BigIntRomasm} Remainder
     */
    moduloLongDivision(modulus) {
        if (this.compare(modulus) < 0) {
            return new BigIntRomasm(this.toString());
        }
        
        let remainder = new BigIntRomasm(0);
        
        for (let i = 0; i < this.digits.length; i++) {
            remainder = remainder.multiply(new BigIntRomasm(10)).add(new BigIntRomasm(this.digits[i]));
            
            while (remainder.compare(modulus) >= 0) {
                remainder = remainder.subtract(modulus);
            }
        }
        
        return remainder;
    }
    
    /**
     * Division operation
     * @param {BigIntRomasm} other - Divisor
     * @returns {BigIntRomasm} Quotient
     */
    divide(other) {
        if (other.isZero()) {
            throw new Error('Division by zero');
        }
        
        if (this.compare(other) < 0) {
            return new BigIntRomasm(0);
        }
        
        const result = [];
        let remainder = new BigIntRomasm(0);
        
        for (let i = 0; i < this.digits.length; i++) {
            remainder = remainder.multiply(new BigIntRomasm(10)).add(new BigIntRomasm(this.digits[i]));
            
            let quotient = 0;
            while (remainder.compare(other) >= 0) {
                remainder = remainder.subtract(other);
                quotient++;
            }
            
            if (result.length > 0 || quotient > 0) {
                result.push(quotient);
            }
        }
        
        return result.length > 0 ? new BigIntRomasm(result.join('')) : new BigIntRomasm(0);
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BigIntRomasm };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.BigIntRomasm = BigIntRomasm;
}

