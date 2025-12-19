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
            'CLEAR': 'CLR',  // Canvas: clearRect()
            // System instructions for OS development
            'INT': 'INT',  // Software Interrupt
            'IRET': 'IRET', // Return from Interrupt
            'CLI': 'CLI',  // Clear Interrupt Flag
            'STI': 'STI',  // Set Interrupt Flag
            'HLT': 'HLT',  // Halt CPU
            'NOP': 'NOP',  // No Operation
            'IN': 'IN',    // Input from I/O port
            'OUT': 'OUT',  // Output to I/O port
            // Segment register operations
            'MOV_SEG': 'MSEG', // Move to segment register
            // Control register operations
            'MOV_CR0': 'MCR0', // Move to CR0
            'MOV_CR3': 'MCR3', // Move to CR3
            'MOV_CR4': 'MCR4', // Move to CR4
            // 8-bit register operations (for BIOS compatibility)
            'LOAD8': 'L8',   // Load 8-bit value
            'STORE8': 'X8',  // Store 8-bit value
            'MOV8': 'M8'     // Move 8-bit between registers
        };

        // Register mappings (full 32-bit registers)
        this.registers = {
            'R0': 'I', 'R1': 'II', 'R2': 'III', 'R3': 'IV', 'R4': 'V',
            'R5': 'VI', 'R6': 'VII', 'R7': 'VIII', 'R8': 'IX'
        };
        
        // 8-bit register mappings (for BIOS compatibility)
        // R0 = EAX, so R0L = AL, R0H = AH
        this.registers8bit = {
            'R0L': 'AL', 'R0H': 'AH',  // Low/High byte of R0 (EAX)
            'R1L': 'BL', 'R1H': 'BH',  // Low/High byte of R1 (EBX)
            'R2L': 'CL', 'R2H': 'CH',  // Low/High byte of R2 (ECX)
            'R3L': 'DL', 'R3H': 'DH'   // Low/High byte of R3 (EDX)
        };
        
        // Segment registers
        this.segmentRegisters = {
            'CS': 'CS', 'DS': 'DS', 'ES': 'ES', 'SS': 'SS', 'FS': 'FS', 'GS': 'GS'
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
     * @returns {Object} Assembly result with instructions, data, and labels
     */
    assemble(source) {
        const lines = source.split('\n');
        const instructions = [];
        const data = []; // Data bytes (DB directives)
        const dataLabels = {}; // Labels pointing to data
        const labels = {};
        const errors = [];
        
        // Track data offset (starts after instructions)
        let dataOffset = 0;

        // First pass: collect labels and count instructions/data
        let instructionAddress = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue; // Skip empty lines and comments

            // Check for label
            if (line.endsWith(':')) {
                const label = line.slice(0, -1).trim();
                // We'll determine if it's a data or instruction label later
                continue;
            }

            // Check if it's a data directive
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith('DB ')) {
                // Data directive - will be handled in second pass
                continue;
            }

            // Regular instruction
            instructionAddress++;
        }

        // Second pass: assemble instructions and data
        instructionAddress = 0;
        let currentDataAddress = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';')) continue;

            // Handle labels
            if (line.endsWith(':')) {
                const label = line.slice(0, -1).trim();
                // Check next non-empty line to determine if it's data or instruction
                let nextLine = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const testLine = lines[j].trim();
                    if (testLine && !testLine.startsWith(';')) {
                        nextLine = testLine.toUpperCase();
                        break;
                    }
                }
                
                if (nextLine.startsWith('DB ')) {
                    // Data label
                    dataLabels[label] = currentDataAddress;
                } else {
                    // Instruction label
                    labels[label] = instructionAddress;
                }
                continue;
            }

            // Check for data directives
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith('DB ')) {
                try {
                    const dataBytes = this.parseDataDirective(line);
                    for (const byte of dataBytes) {
                        data.push({
                            address: currentDataAddress,
                            value: byte
                        });
                        currentDataAddress++;
                    }
                } catch (error) {
                    errors.push({
                        line: i + 1,
                        message: error.message,
                        code: line
                    });
                }
                continue;
            }

            // Regular instruction
            try {
                const instruction = this.parseInstruction(line, labels, instructionAddress);
                instructions.push(instruction);
                instructionAddress++;
            } catch (error) {
                errors.push({
                    line: i + 1,
                    message: error.message,
                    code: line
                });
            }
        }

        // Merge labels: data labels are offset by instruction count
        const mergedLabels = { ...labels };
        for (const [label, dataAddr] of Object.entries(dataLabels)) {
            mergedLabels[label] = instructions.length + dataAddr;
        }
        
        return {
            instructions,
            data,
            labels: mergedLabels, // Merged: instruction labels (0 to N-1) and data labels (N+)
            dataLabels,
            errors,
            success: errors.length === 0
        };
    }

    /**
     * Parse a data directive (DB, DW, etc.)
     * @param {string} line - Data directive line
     * @returns {Array<number>} Array of byte values
     */
    parseDataDirective(line) {
        // Remove comments
        const commentIndex = line.indexOf(';');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex).trim();
        }

        const upperLine = line.toUpperCase();
        const bytes = [];

        if (upperLine.startsWith('DB ')) {
            // Define Byte: DB value1, value2, ...
            const values = line.substring(3).trim();
            const parts = values.split(',').map(p => p.trim());
            
            for (const part of parts) {
                // Try to parse as number
                let value;
                if (part.startsWith("'") && part.endsWith("'") && part.length === 3) {
                    // Character literal: 'A'
                    value = part.charCodeAt(1);
                } else if (part.startsWith('"') && part.endsWith('"')) {
                    // String literal: "Hello"
                    const str = part.slice(1, -1);
                    for (let i = 0; i < str.length; i++) {
                        bytes.push(str.charCodeAt(i));
                    }
                    continue;
                } else {
                    // Number (decimal or hex)
                    if (part.toLowerCase().startsWith('0x')) {
                        value = parseInt(part, 16);
                    } else {
                        value = parseInt(part, 10);
                    }
                }
                
                if (isNaN(value)) {
                    throw new Error(`Invalid DB value: ${part}`);
                }
                
                bytes.push(value & 0xFF); // Ensure it's a byte
            }
        } else if (upperLine.startsWith('DW ')) {
            // Define Word: DW value1, value2, ...
            const values = line.substring(3).trim();
            const parts = values.split(',').map(p => p.trim());
            
            for (const part of parts) {
                let value;
                if (part.toLowerCase().startsWith('0x')) {
                    value = parseInt(part, 16);
                } else {
                    value = parseInt(part, 10);
                }
                
                if (isNaN(value)) {
                    throw new Error(`Invalid DW value: ${part}`);
                }
                
                // Store as little-endian bytes
                bytes.push(value & 0xFF);
                bytes.push((value >> 8) & 0xFF);
            }
        } else {
            throw new Error(`Unknown data directive: ${line}`);
        }

        return bytes;
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
            case 'HLT':
            case 'NOP':
            case 'CLI':
            case 'STI':
            case 'IRET':
                // No operands
                if (operands.length !== 0) {
                    throw new Error(`${mnemonic} takes no operands`);
                }
                break;

            case 'INT':
                // Single immediate operand (interrupt number)
                if (operands.length !== 1) {
                    throw new Error(`${mnemonic} requires 1 operand (interrupt number)`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                break;

            case 'IN':
                // Two operands: register, port (register or immediate)
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands (register, port)`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'OUT':
                // Two operands: port (register or immediate), register
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands (port, register)`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'MOV_SEG':
                // Two operands: segment register, source (register or immediate)
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands (segment_register, source)`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
                break;

            case 'MOV_CR0':
            case 'MOV_CR3':
            case 'MOV_CR4':
                // One operand: register
                if (operands.length !== 1) {
                    throw new Error(`${mnemonic} requires 1 operand (register)`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                break;

            case 'LOAD8':
            case 'STORE8':
            case 'MOV8':
                // 8-bit register operations (same as regular LOAD/STORE but for 8-bit)
                if (operands.length !== 2) {
                    throw new Error(`${mnemonic} requires 2 operands`);
                }
                instruction.operands.push(this.parseOperand(operands[0], labels));
                instruction.operands.push(this.parseOperand(operands[1], labels));
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

        const upperOperand = operand.toUpperCase();

        // Check if it's a full register (R0-R8)
        if (upperOperand in this.registers) {
            return {
                type: 'register',
                value: this.registers[upperOperand],
                isMemory
            };
        }

        // Check if it's an 8-bit register (R0L, R0H, etc.)
        if (upperOperand in this.registers8bit) {
            return {
                type: 'register8bit',
                value: this.registers8bit[upperOperand],
                isMemory
            };
        }

        // Check if it's a segment register
        if (upperOperand in this.segmentRegisters) {
            return {
                type: 'segment',
                value: this.segmentRegisters[upperOperand],
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

