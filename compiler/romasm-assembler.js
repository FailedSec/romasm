/**
 * Romasm Assembler
 * 
 * Translates human-readable Romasm assembly code into executable instructions
 */

class RomasmAssembler {
    constructor() {
        // Instruction opcodes
        this.opcodes = {
            'INC': 'I',
            'DEC': 'D',
            'JMP': 'V',
            'JEQ': 'JE',  // Jump if Equal
            'JNE': 'JN',  // Jump if Not Equal
            'JLT': 'JL',  // Jump if Less Than
            'JGT': 'JG',  // Jump if Greater Than
            'JLE': 'JLE', // Jump if Less or Equal
            'JGE': 'JGE', // Jump if Greater or Equal
            'STORE': 'X',
            'LOAD': 'L',
            'CMP': 'C',
            'MUL': 'M',
            'DIV': 'DI',  // Divide
            'MOD': 'MO',  // Modulo
            'ADD': 'A',
            'SUB': 'S',
            'SHL': 'SL',  // Shift Left (multiply by 2)
            'SHR': 'SR',  // Shift Right (divide by 2)
            'CALL': 'CA',
            'RET': 'R',
            'PUSH': 'P',
            'POP': 'PO',
            'PRINT': 'PR',
            'MOVE': 'MOV',  // Canvas: moveTo(x, y)
            'DRAW': 'DRW',  // Canvas: lineTo(x, y)
            'STROKE': 'STR', // Canvas: stroke()
            'CLEAR': 'CLR'  // Canvas: clearRect()
        };

        // Register mappings
        this.registers = {
            'R0': 'I', 'R1': 'II', 'R2': 'III', 'R3': 'IV', 'R4': 'V',
            'R5': 'VI', 'R6': 'VII', 'R7': 'VIII', 'R8': 'IX'
        };

        // Reverse mappings
        this.opcodeToName = {};
        for (const [name, code] of Object.entries(this.opcodes)) {
            this.opcodeToName[code] = name;
        }

        this.registerToNum = {};
        for (const [reg, roman] of Object.entries(this.registers)) {
            this.registerToNum[roman] = reg;
        }
    }

    /**
     * Assemble Romasm source code into machine code
     * @param {string} source - Romasm assembly source code
     * @returns {Object} Assembly result with instructions and labels
     */
    assemble(source) {
        const lines = source.split('\n');
        const instructions = [];
        const labels = {};
        const errors = [];

        // First pass: collect labels
        let address = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue; // Skip empty lines and comments

            // Check for label
            if (line.endsWith(':')) {
                const label = line.slice(0, -1).trim();
                labels[label] = address;
                continue;
            }

            address++;
        }

        // Second pass: assemble instructions
        address = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue;

            // Skip label definitions
            if (line.endsWith(':')) continue;

            try {
                const instruction = this.parseInstruction(line, labels, address);
                instructions.push(instruction);
                address++;
            } catch (error) {
                errors.push({
                    line: i + 1,
                    message: error.message,
                    code: line
                });
            }
        }

        return {
            instructions,
            labels,
            errors,
            success: errors.length === 0
        };
    }

    /**
     * Parse a single instruction line
     * @param {string} line - Instruction line
     * @param {Object} labels - Label address map
     * @param {number} address - Current instruction address
     * @returns {Object} Parsed instruction
     */
    parseInstruction(line, labels, address) {
        // Remove comments
        const commentIndex = line.indexOf(';');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex).trim();
        }

        // Split into parts (handle commas)
        const parts = line.split(/[\s,]+/).filter(p => p.length > 0);
        if (parts.length === 0) {
            throw new Error('Empty instruction');
        }

        const mnemonic = parts[0].toUpperCase();
        const operands = parts.slice(1);

        // Check if it's a known instruction
        if (!(mnemonic in this.opcodes)) {
            throw new Error(`Unknown instruction: ${mnemonic}`);
        }

        const opcode = this.opcodes[mnemonic];
        const instruction = {
            address,
            opcode,
            mnemonic,
            operands: [],
            raw: line
        };

        // Parse operands based on instruction type
        switch (mnemonic) {
            case 'INC':
            case 'DEC':
            case 'POP':
            case 'PRINT':
                // Single register operand
                if (operands.length !== 1) {
                    throw new Error(`${mnemonic} requires 1 operand`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                break;

            case 'RET':
                // RET takes no operands
                if (operands.length !== 0) {
                    throw new Error(`${mnemonic} takes no operands`);
                }
                break;

            case 'LOAD':
            case 'STORE':
                // Two operands: register and address/value
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'ADD':
            case 'SUB':
            case 'MUL':
            case 'DIV':
            case 'MOD':
            case 'CMP':
            case 'SHL':
            case 'SHR':
                // Two register operands
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'JMP':
            case 'JEQ':
            case 'JNE':
            case 'JLT':
            case 'JGT':
            case 'CALL':
            case 'JLE':
            case 'JGE':
                // Single address/label operand
                if (operands.length !== 1) {
                    throw new Error(`${mnemonic} requires 1 operand`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                break;

            case 'PUSH':
                // Single register operand
                if (operands.length !== 1) {
                    throw new Error(`${mnemonic} requires 1 operand`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                break;

            case 'MOVE':
                // Two register operands: MOVE R0, R1 (x, y)
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'DRAW':
                // Two register operands: DRAW R0, R1 (x, y)
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'STROKE':
            case 'CLEAR':
                // No operands
                if (operands.length !== 0) {
                    throw new Error(`${mnemonic} takes no operands`);
                }
                break;

            default:
                throw new Error(`Unhandled instruction: ${mnemonic}`);
        }

        return instruction;
    }

    /**
     * Parse an operand (register, immediate, or label)
     * @param {string} operand - Operand string
     * @param {Object} labels - Label address map
     * @returns {Object} Parsed operand
     */
    parseOperand(operand, labels) {
        // Remove brackets for memory addressing
        const isMemory = operand.startsWith('[') && operand.endsWith(']');
        if (isMemory) {
            operand = operand.slice(1, -1);
        }

        // Check if it's a register
        if (operand.toUpperCase() in this.registers) {
            return {
                type: 'register',
                value: this.registers[operand.toUpperCase()],
                isMemory
            };
        }

        // Check if it's a label
        if (operand in labels) {
            return {
                type: 'label',
                value: labels[operand],
                isMemory
            };
        }

        // Check if it's a number
        const num = parseInt(operand);
        if (!isNaN(num)) {
            return {
                type: 'immediate',
                value: num,
                isMemory
            };
        }

        // If it's not a number and not a register, treat it as an unresolved label
        // This allows CALL sin, CALL cos, etc. to work - linker will resolve them
        // Store the label name so linker can resolve it later
        return {
            type: 'label',
            value: 0, // Placeholder - linker will fix this
            labelName: operand, // Store the label name for linker resolution
            isMemory
        };
    }

    /**
     * Disassemble machine code back to assembly
     * @param {Array} instructions - Machine code instructions
     * @returns {string} Assembly source code
     */
    disassemble(instructions) {
        const lines = [];
        for (const inst of instructions) {
            const mnemonic = this.opcodeToName[inst.opcode] || 'UNKNOWN';
            const operands = inst.operands.map(op => {
                if (op.type === 'register') {
                    const reg = this.registerToNum[op.value];
                    return op.isMemory ? `[${reg}]` : reg;
                } else if (op.type === 'immediate') {
                    return op.isMemory ? `[${op.value}]` : String(op.value);
                } else {
                    return String(op.value);
                }
            }).join(' ');

            lines.push(`${mnemonic} ${operands}`.trim());
        }
        return lines.join('\n');
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmAssembler };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.RomasmAssembler = RomasmAssembler;
}

