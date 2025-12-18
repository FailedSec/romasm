/**
 * Positional Roman Numeral System
 * 
 * A positional numeral system using Roman numeral symbols (I, V, X, etc.) 
 * where each position represents a power of 10, similar to modern decimal notation.
 */

// Positional Roman digit set (0-9)
const POSITIONAL_DIGITS = {
    0: 'N',
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII',
    9: 'IX'
};

// Reverse mapping: Roman digit -> decimal value
const DIGIT_TO_VALUE = {};
for (const [key, value] of Object.entries(POSITIONAL_DIGITS)) {
    DIGIT_TO_VALUE[value] = parseInt(key);
}

// Standard Roman numeral values (for comparison/conversion)
const STANDARD_ROMAN_VALUES = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000
};

class PositionalRoman {
    /**
     * A positional Roman numeral system converter.
     * 
     * @param {string} separator - How to separate digits ('space', 'dot', or 'box')
     */
    constructor(separator = 'space') {
        this.separator = separator;
        this._separatorChar = {
            'space': ' ',
            'dot': '·',
            'box': '▢'
        }[separator];
    }

    /**
     * Convert a decimal number to Positional Roman notation.
     * 
     * @param {number} number - The decimal number to convert
     * @returns {string} Positional Roman numeral string with separators
     * 
     * @example
     * const pr = new PositionalRoman();
     * pr.toPositionalRoman(2025); // Returns: "II N II V"
     */
    toPositionalRoman(number) {
        if (number < 0) {
            throw new Error("Negative numbers not supported");
        }
        if (number === 0) {
            return 'N';
        }

        // Convert to string to get digits
        const digits = String(number).split('').map(d => parseInt(d));

        // Convert each digit to its Positional Roman equivalent
        const positionalDigits = digits.map(d => POSITIONAL_DIGITS[d]);

        // Join with separator
        return positionalDigits.join(this._separatorChar);
    }

    /**
     * Convert a Positional Roman numeral to decimal.
     * 
     * @param {string} positionalRoman - Positional Roman numeral string (with or without separators)
     * @returns {number} The decimal equivalent
     * 
     * @example
     * const pr = new PositionalRoman();
     * pr.fromPositionalRoman('II N II V'); // Returns: 2025
     */
    fromPositionalRoman(positionalRoman) {
        // Try to detect and handle separators
        // Remove common separators and split
        let cleaned = positionalRoman.replace(/[ ·▢]/g, ' ');

        // Split by spaces, but also handle cases without separators
        let parts;
        if (cleaned.includes(' ') || positionalRoman.includes('·') || positionalRoman.includes('▢')) {
            // Has separators - split and parse
            parts = cleaned.trim().split(/\s+/).filter(p => p.length > 0);
        } else {
            // No separators - need to parse carefully
            parts = this._parseWithoutSeparators(positionalRoman);
        }

        // Convert each part to decimal digit
        const decimalDigits = parts.map(part => {
            const trimmed = part.trim().toUpperCase();
            if (!(trimmed in DIGIT_TO_VALUE)) {
                throw new Error(`Invalid Positional Roman digit: ${part}`);
            }
            return String(DIGIT_TO_VALUE[trimmed]);
        });

        // Combine digits and convert to int
        return parseInt(decimalDigits.join(''));
    }

    /**
     * Parse Positional Roman without separators.
     * This is tricky because digits have variable lengths.
     * We try to match longest possible digits first.
     * 
     * @param {string} text - Text to parse
     * @returns {string[]} Array of digit strings
     */
    _parseWithoutSeparators(text) {
        text = text.toUpperCase().trim();
        const parts = [];
        let i = 0;

        // Sort digits by length (longest first) to match correctly
        const sortedDigits = Object.keys(DIGIT_TO_VALUE).sort((a, b) => b.length - a.length);

        while (i < text.length) {
            let matched = false;
            for (const digit of sortedDigits) {
                if (text.substring(i).startsWith(digit)) {
                    parts.push(digit);
                    i += digit.length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                throw new Error(`Could not parse Positional Roman at position ${i}: '${text.substring(i)}'`);
            }
        }

        return parts;
    }

    /**
     * Convert decimal to standard (additive) Roman numerals.
     * Useful for comparison.
     * 
     * @param {number} number - Decimal number
     * @returns {string} Standard Roman numeral string
     */
    toStandardRoman(number) {
        if (number < 0) {
            throw new Error("Negative numbers not supported");
        }
        if (number === 0) {
            return 'N'; // Using N for zero in standard too
        }

        const result = [];
        let remaining = number;

        // Handle thousands
        const thousands = Math.floor(remaining / 1000);
        result.push('M'.repeat(thousands));
        remaining %= 1000;

        // Handle hundreds
        if (remaining >= 900) {
            result.push('CM');
            remaining -= 900;
        } else if (remaining >= 500) {
            result.push('D');
            remaining -= 500;
        } else if (remaining >= 400) {
            result.push('CD');
            remaining -= 400;
        }

        const hundreds = Math.floor(remaining / 100);
        result.push('C'.repeat(hundreds));
        remaining %= 100;

        // Handle tens
        if (remaining >= 90) {
            result.push('XC');
            remaining -= 90;
        } else if (remaining >= 50) {
            result.push('L');
            remaining -= 50;
        } else if (remaining >= 40) {
            result.push('XL');
            remaining -= 40;
        }

        const tens = Math.floor(remaining / 10);
        result.push('X'.repeat(tens));
        remaining %= 10;

        // Handle ones
        if (remaining >= 9) {
            result.push('IX');
        } else if (remaining >= 5) {
            result.push('V');
            remaining -= 5;
            result.push('I'.repeat(remaining));
        } else if (remaining >= 4) {
            result.push('IV');
        } else {
            result.push('I'.repeat(remaining));
        }

        return result.join('');
    }

    /**
     * Convert standard (additive) Roman numerals to decimal.
     * 
     * @param {string} roman - Standard Roman numeral string
     * @returns {number} Decimal equivalent
     */
    standardToDecimal(roman) {
        roman = roman.toUpperCase().trim();
        if (roman === 'N') {
            return 0;
        }

        let result = 0;
        let i = 0;

        while (i < roman.length) {
            // Check for subtractive pairs first
            if (i + 1 < roman.length) {
                const pair = roman.substring(i, i + 2);
                const subtractiveValues = {
                    'IV': 4,
                    'IX': 9,
                    'XL': 40,
                    'XC': 90,
                    'CD': 400,
                    'CM': 900
                };

                if (pair in subtractiveValues) {
                    result += subtractiveValues[pair];
                    i += 2;
                    continue;
                }
            }

            // Single character
            if (roman[i] in STANDARD_ROMAN_VALUES) {
                result += STANDARD_ROMAN_VALUES[roman[i]];
                i++;
            } else {
                throw new Error(`Invalid Roman numeral character: ${roman[i]}`);
            }
        }

        return result;
    }
}

/**
 * Compare all three numeral systems for a given number.
 * 
 * @param {number} number - The decimal number to convert
 * @param {string} separator - Separator style for Positional Roman
 * @returns {Object} Object with all three representations and explanation
 */
function compareSystems(number, separator = 'space') {
    const pr = new PositionalRoman(separator);
    const positionalRoman = pr.toPositionalRoman(number);
    
    return {
        decimal: number,
        standardRoman: pr.toStandardRoman(number),
        positionalRoman: positionalRoman,
        explanation: explainPositional(positionalRoman, number, separator)
    };
}

/**
 * Generate an explanation of the Positional Roman representation.
 * 
 * @param {string} positionalRoman - Positional Roman string
 * @param {number} number - Original decimal number
 * @param {string} separator - Separator style used
 * @returns {string} Explanation string
 */
function explainPositional(positionalRoman, number, separator) {
    const digits = String(number).split('').map(d => parseInt(d));
    const separatorChar = separator === 'space' ? ' ' : (separator === 'dot' ? '·' : '▢');
    const positionalDigits = positionalRoman.split(separatorChar);

    const explanations = [];
    let power = digits.length - 1;

    for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const posDigit = positionalDigits[i];
        const placeValue = Math.pow(10, power);
        const value = digit * placeValue;
        explanations.push(
            `${posDigit} in the ${placeName(power)} place (${digit} × ${placeValue} = ${value})`
        );
        power--;
    }

    return explanations.join(' | ');
}

/**
 * Get the name of a place value.
 * 
 * @param {number} power - Power of 10
 * @returns {string} Place name
 */
function placeName(power) {
    const names = {
        0: 'ones',
        1: 'tens',
        2: 'hundreds',
        3: 'thousands',
        4: 'ten thousands',
        5: 'hundred thousands',
        6: 'millions'
    };
    return names[power] || `10^${power}`;
}

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PositionalRoman, compareSystems, explainPositional, placeName };
}

