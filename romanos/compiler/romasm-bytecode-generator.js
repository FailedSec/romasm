/**
 * Romasm Bytecode Generator
 * 
 * Converts assembled Romasm VM instructions into compact binary bytecode
 * that can be executed by the native Romasm VM bootloader.
 */

class RomasmBytecodeGenerator {
    constructor() {
        // Opcode mapping: Romasm VM opcode → bytecode byte
        this.opcodeMap = {
            'NOP': 0x00,
            'L': 0x01,      // LOAD
            'X': 0x02,      // STORE
            'A': 0x03,      // ADD
            'S': 0x04,      // SUB
            'M': 0x05,      // MUL
            'DI': 0x06,     // DIV
            'I': 0x07,      // INC
            'D': 0x08,      // DEC
            'C': 0x09,      // CMP
            'V': 0x0A,      // JMP
            'JE': 0x0B,     // JEQ
            'JN': 0x0C,     // JNE
            'JL': 0x0D,     // JLT
            'JG': 0x0E,     // JGT
            'JLE': 0x0F,    // JLE
            'JGE': 0x10,    // JGE
            'CA': 0x11,     // CALL
            'R': 0x12,      // RET
            'P': 0x13,      // PUSH
            'PO': 0x14,     // POP
            'INT': 0x15,    // INT
            'MSEG': 0x16,   // MOV_SEG
            'CLI': 0x17,    // CLI
            'STI': 0x18,    // STI
            'IRET': 0x19,   // IRET
            'HLT': 0x1A,    // HLT
        };
        
        // Segment register mapping
        this.segmentRegMap = {
            'CS': 0x00,
            'DS': 0x01,
            'ES': 0x02,
            'SS': 0x03,
            'FS': 0x04,
            'GS': 0x05
        };

        // Register mapping: R0-R7 → 0x00-0x07
        this.registerMap = {
            'I': 0x00,      // R0
            'II': 0x01,     // R1
            'III': 0x02,    // R2
            'IV': 0x03,     // R3
            'V': 0x04,      // R4
            'VI': 0x05,     // R5
            'VII': 0x06,    // R6
            'VIII': 0x07,   // R7
        };
    }

    /**
     * Generate bytecode from assembled program
     * @param {Object} assembledProgram - Output from RomasmAssembler
     * @returns {Buffer} Binary bytecode
     */
    generate(assembledProgram) {
        const { instructions, labels, data } = assembledProgram;
        const bytecode = [];

        // Header: Magic number + version
        bytecode.push(0x52, 0x4D, 0x53, 0x4D); // "RMSM" magic
        bytecode.push(0x01, 0x00); // Version 1.0

        // Code section: instruction count (2 bytes)
        const instructionCount = instructions.length;
        bytecode.push(instructionCount & 0xFF);
        bytecode.push((instructionCount >> 8) & 0xFF);

        // Generate instruction bytecode
        for (const instr of instructions) {
            const encoded = this.encodeInstruction(instr, labels);
            bytecode.push(...encoded);
        }

        // Data section: data count (2 bytes)
        const dataCount = data.length;
        bytecode.push(dataCount & 0xFF);
        bytecode.push((dataCount >> 8) & 0xFF);

        // Data bytes
        for (const dataItem of data) {
            bytecode.push(dataItem.value & 0xFF);
        }

        // Label table (for debugging): label count (2 bytes)
        const labelCount = Object.keys(labels).length;
        bytecode.push(labelCount & 0xFF);
        bytecode.push((labelCount >> 8) & 0xFF);

        // Label entries: [name_len(1), name, addr(2)]
        for (const [name, addr] of Object.entries(labels)) {
            const nameBytes = Buffer.from(name, 'utf8');
            bytecode.push(nameBytes.length);
            bytecode.push(...nameBytes);
            bytecode.push(addr & 0xFF);
            bytecode.push((addr >> 8) & 0xFF);
        }

        return Buffer.from(bytecode);
    }

    /**
     * Encode a single instruction
     * @param {Object} instruction - VM instruction object
     * @param {Object} labels - Label address map
     * @returns {Array<number>} Encoded bytes
     */
    encodeInstruction(instruction, labels) {
        const bytes = [];
        const { opcode, operands } = instruction;

        // Opcode byte
        const opcodeByte = this.opcodeMap[opcode];
        if (opcodeByte === undefined) {
            throw new Error(`Unknown opcode: ${opcode}`);
        }
        bytes.push(opcodeByte);

        // Encode operands
        if (operands && operands.length > 0) {
            for (const operand of operands) {
                bytes.push(...this.encodeOperand(operand, labels));
            }
        }

        return bytes;
    }

    /**
     * Encode an operand
     * @param {Object} operand - Operand object
     * @param {Object} labels - Label address map
     * @returns {Array<number>} Encoded bytes
     */
    encodeOperand(operand, labels) {
        const bytes = [];

        if (operand.type === 'register') {
            // Register: [0x00-0x07] (R0-R7)
            const regByte = this.registerMap[operand.value];
            if (regByte === undefined) {
                throw new Error(`Unknown register: ${operand.value}`);
            }
            bytes.push(regByte);
        } else if (operand.type === 'immediate') {
            // Immediate: [0x80] [value_low] [value_high]
            bytes.push(0x80); // Immediate flag
            const value = operand.value;
            bytes.push(value & 0xFF);        // Low byte
            bytes.push((value >> 8) & 0xFF); // High byte
        } else if (operand.type === 'label' || operand.labelName) {
            // Label: [0xA0] [label_addr_low] [label_addr_high]
            bytes.push(0xA0); // Label flag
            let addr;
            if (operand.labelName) {
                // Resolved label name
                addr = labels[operand.labelName];
                if (addr === undefined) {
                    throw new Error(`Unknown label: ${operand.labelName}`);
                }
            } else if (typeof operand.value === 'number') {
                // Already resolved address
                addr = operand.value;
            } else {
                // Try to resolve as label name
                addr = labels[operand.value];
                if (addr === undefined) {
                    throw new Error(`Unknown label: ${operand.value}`);
                }
            }
            bytes.push(addr & 0xFF);        // Low byte
            bytes.push((addr >> 8) & 0xFF); // High byte
        } else if (operand.type === 'segment') {
            // Segment register: [0xB0] [segment_reg_number]
            bytes.push(0xB0); // Segment register flag
            const segRegByte = this.segmentRegMap[operand.value];
            if (segRegByte === undefined) {
                throw new Error(`Unknown segment register: ${operand.value}`);
            }
            bytes.push(segRegByte);
        } else if (operand.isMemory) {
            // Memory reference: [0x90] [register] [offset?]
            bytes.push(0x90); // Memory flag
            if (operand.type === 'register') {
                const regByte = this.registerMap[operand.value];
                if (regByte === undefined) {
                    throw new Error(`Unknown register in memory ref: ${operand.value}`);
                }
                bytes.push(regByte);
                // Optional offset (0 for now)
                bytes.push(0x00);
            } else if (operand.type === 'immediate') {
                // Absolute address
                bytes.push(0xFF); // Special marker for absolute address
                const addr = operand.value;
                bytes.push(addr & 0xFF);
                bytes.push((addr >> 8) & 0xFF);
            }
        } else {
            throw new Error(`Unsupported operand type: ${operand.type}`);
        }

        return bytes;
    }

    /**
     * Save bytecode to file
     * @param {Buffer} bytecode - Binary bytecode
     * @param {string} filepath - Output file path
     */
    save(bytecode, filepath) {
        const fs = require('fs');
        fs.writeFileSync(filepath, bytecode);
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmBytecodeGenerator };
}
