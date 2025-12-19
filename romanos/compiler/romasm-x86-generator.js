/**
 * Romasm x86 Code Generator
 * 
 * Converts Romasm VM instructions to x86 machine code
 * This allows Romasm programs to run on real hardware!
 */

class RomasmX86Generator {
    constructor() {
        // Register mapping: Romasm registers → x86 registers
        // For 16-bit mode (boot sector)
        this.reg16Map = {
            'I': 'AX',   // R0 → AX
            'II': 'BX',  // R1 → BX
            'III': 'CX', // R2 → CX
            'IV': 'DX',  // R3 → DX
            'V': 'SI',   // R4 → SI
            'VI': 'DI',  // R5 → DI
            'VII': 'BP', // R6 → BP
            'VIII': 'SP' // R7 → SP
        };
        
        // For 32-bit mode (protected mode kernel)
        this.reg32Map = {
            'I': 'EAX',
            'II': 'EBX',
            'III': 'ECX',
            'IV': 'EDX',
            'V': 'ESI',
            'VI': 'EDI',
            'VII': 'EBP',
            'VIII': 'ESP'
        };
        
        // x86 opcode mappings
        this.x86Opcodes = {
            'L': 'MOV',      // LOAD
            'X': 'MOV',      // STORE
            'A': 'ADD',      // ADD
            'S': 'SUB',      // SUB
            'M': 'MUL',      // MUL
            'DI': 'DIV',     // DIV
            'MO': 'MOD',     // MOD (IDIV + remainder)
            'I': 'INC',      // INC
            'D': 'DEC',      // DEC
            'V': 'JMP',      // JMP
            'JE': 'JE',      // JEQ
            'JN': 'JNE',     // JNE
            'JL': 'JL',      // JLT
            'JG': 'JG',      // JGT
            'CA': 'CALL',    // CALL
            'R': 'RET',      // RET
            'P': 'PUSH',     // PUSH
            'PO': 'POP',     // POP
            'C': 'CMP',      // CMP
            'SL': 'SHL',     // SHL
            'SR': 'SHR',     // SHR
            'INT': 'INT',    // INT (interrupt)
            'CLI': 'CLI',    // CLI
            'STI': 'STI',    // STI
            'HLT': 'HLT',    // HLT
            'IN': 'IN',      // IN
            'OUT': 'OUT'     // OUT
        };
    }
    
    /**
     * Generate x86 assembly code from Romasm instructions
     * @param {Array} instructions - Romasm VM instructions
     * @param {boolean} mode16bit - If true, generate 16-bit code (boot sector), else 32-bit
     * @returns {string} x86 assembly code (NASM syntax)
     */
    generateAssembly(instructions, mode16bit = true) {
        const regMap = mode16bit ? this.reg16Map : this.reg32Map;
        const bits = mode16bit ? 16 : 32;
        let asm = '';
        
        // Add header
        if (mode16bit) {
            asm += `; Boot sector code (16-bit)\n`;
            asm += `BITS 16\n`;
            asm += `ORG 0x7C00\n\n`;
        } else {
            asm += `; Protected mode code (32-bit)\n`;
            asm += `BITS 32\n\n`;
        }
        
        // Generate code for each instruction
        for (const instr of instructions) {
            asm += this.generateInstruction(instr, regMap, bits);
        }
        
        return asm;
    }

    /**
     * Generate boot sector with proper structure
     * @param {Array} instructions - Romasm VM instructions
     * @param {Array} data - Data bytes from DB directives
     * @param {Object} labels - Label address map (including data labels)
     * @returns {string} Complete boot sector x86 assembly
     */
    generateBootSector(instructions, data = [], labels = {}) {
        const regMap = this.reg16Map;
        const bits = 16;
        let asm = '';
        
        // Boot sector header
        asm += `; Boot sector generated from Romasm\n`;
        asm += `BITS 16\n`;
        asm += `ORG 0x7C00\n\n`;
        
        // Entry point
        asm += `start:\n`;
        
        // Track which labels we've already output
        const outputLabels = new Set(['start']);
        
        // Generate code for each instruction, outputting labels as we encounter them
        for (let i = 0; i < instructions.length; i++) {
            const instr = instructions[i];
            
            // Check if this instruction address has a label
            // Only output instruction labels (not data labels)
            // Data labels have addresses >= instructions.length
            const labelName = this.findLabelName(i, labels);
            if (labelName && !outputLabels.has(labelName)) {
                // Double-check: make sure this is an instruction label (not data label)
                const labelAddr = labels[labelName];
                if (labelAddr !== undefined && labelAddr < instructions.length) {
                    asm += `${labelName}:\n`;
                    outputLabels.add(labelName);
                }
            }
            
            asm += this.generateInstruction(instr, regMap, bits, labels);
        }
        
        // Data section (if any)
        if (data && data.length > 0) {
            asm += `\n; Data section\n`;
            
            // Create a map of data array indices to labels
            const dataLabelMap = {};
            for (const [labelName, address] of Object.entries(labels)) {
                // Check if this label points to data (address >= instruction count)
                if (address >= instructions.length) {
                    const dataIndex = address - instructions.length;
                    // Data addresses in the assembler are 0-based and sequential
                    // So dataIndex should directly map to array index
                    if (dataIndex >= 0 && dataIndex < data.length) {
                        // Find the data item at this index by matching address field
                        let found = false;
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].address === dataIndex) {
                                dataLabelMap[i] = labelName;
                                found = true;
                                break;
                            }
                        }
                        // If not found by address match, use index directly (data addresses are sequential)
                        if (!found) {
                            dataLabelMap[dataIndex] = labelName;
                        }
                    }
                }
            }
            
            // Debug: log dataLabelMap if msg is missing
            if (data.length > 0 && !dataLabelMap[0] && labels['msg']) {
                console.error('DEBUG: msg label address:', labels['msg'], 'instruction count:', instructions.length, 'dataIndex:', labels['msg'] - instructions.length);
                console.error('DEBUG: dataLabelMap:', dataLabelMap);
                console.error('DEBUG: data addresses:', data.map(d => d.address));
            }
            
            // Output data with labels
            // Group consecutive data items by label
            let currentLabel = null;
            let dataBytes = [];
            
            for (let i = 0; i < data.length; i++) {
                const dataItem = data[i];
                const label = dataLabelMap[i];
                
                // If we encounter a new label, output previous data first
                if (label && label !== currentLabel) {
                    // Output previous label's data (if any)
                    if (currentLabel !== null && dataBytes.length > 0) {
                        asm += `    db ${dataBytes.join(', ')}\n`;
                        dataBytes = [];
                    }
                    // Start new label
                    if (label && !outputLabels.has(label)) {
                        asm += `${label}:\n`;
                        outputLabels.add(label);
                    }
                    currentLabel = label;
                } else if (!label && currentLabel !== null) {
                    // End of labeled data
                    if (dataBytes.length > 0) {
                        asm += `    db ${dataBytes.join(', ')}\n`;
                        dataBytes = [];
                    }
                    currentLabel = null;
                }
                
                dataBytes.push(dataItem.value);
            }
            
            // Output remaining data
            if (dataBytes.length > 0) {
                if (currentLabel !== null && !outputLabels.has(currentLabel)) {
                    // Shouldn't happen, but handle it
                    asm += `${currentLabel}:\n`;
                    outputLabels.add(currentLabel);
                }
                asm += `    db ${dataBytes.join(', ')}\n`;
            }
        }
        
        // Boot signature (will be added by build system)
        asm += `\n; Boot signature (0xAA55) will be added at offset 510\n`;
        
        // Pad to 510 bytes
        asm += `times 510 - ($ - $$) db 0\n`;
        asm += `dw 0xAA55\n`;
        
        return asm;
    }

    /**
     * Get register name, handling 8-bit registers
     */
    getRegisterName(operand, regMap, bits, force8bit = false) {
        if (operand.type === 'register8bit' || force8bit) {
            // Return 8-bit register name (AL, AH, BL, etc.)
            if (operand.value) {
                return operand.value; // Already 8-bit name
            }
            // Map full register to 8-bit
            const reg8Map = {
                'I': 'AL', 'II': 'BL', 'III': 'CL', 'IV': 'DL'
            };
            return reg8Map[operand.value] || operand.value;
        }
        return regMap[operand.value];
    }
    
    /**
     * Generate x86 assembly for a single Romasm instruction
     */
    generateInstruction(instruction, regMap, bits, labels = {}) {
        const { opcode, operands } = instruction;
        let asm = '';
        
        switch (opcode) {
            case 'L': // LOAD
                if (operands.length >= 2) {
                    const reg = regMap[operands[0].value];
                    const src = operands[1];
                    
                    // Check for memory access FIRST (before register check)
                    if (src.isMemory && src.type === 'register') {
                        // Load byte from memory - use BYTE prefix
                        const regName = regMap[operands[0].value];
                        const srcReg = regMap[src.value];
                        // Map 16-bit registers to their 8-bit low parts for byte loads
                        const byteRegMap = {
                            'AX': 'AL', 'BX': 'BL', 'CX': 'CL', 'DX': 'DL'
                        };
                        const byteReg = byteRegMap[regName];
                        
                        if (byteReg) {
                            // Load byte and zero-extend to 16-bit register
                            asm += `    MOV ${byteReg}, BYTE [${srcReg}]\n`;
                            // Zero-extend: clear high byte
                            const highByteMap = { 'AL': 'AH', 'BL': 'BH', 'CL': 'CH', 'DL': 'DH' };
                            const highByte = highByteMap[byteReg];
                            if (highByte) {
                                asm += `    XOR ${highByte}, ${highByte}\n`;
                            }
                        } else {
                            // For SI, DI, BP, SP, just do word load
                            asm += `    MOV ${reg}, WORD [${srcReg}]\n`;
                        }
                    } else if (src.isMemory && src.type === 'immediate') {
                        // Load from immediate address
                        asm += `    MOV ${reg}, [${src.value}]\n`;
                    } else if (src.type === 'immediate') {
                        asm += `    MOV ${reg}, ${src.value}\n`;
                    } else if (src.type === 'register') {
                        asm += `    MOV ${reg}, ${regMap[src.value]}\n`;
                    } else if (src.type === 'label' || src.labelName) {
                        // Loading address of a label (data label)
                        const labelName = src.labelName || this.findLabelName(src.value, labels);
                        if (labelName) {
                            asm += `    MOV ${reg}, ${labelName}\n`;
                        } else {
                            asm += `    MOV ${reg}, ${src.value}\n`;
                        }
                    }
                }
                break;
                
            case 'X': // STORE
                if (operands.length >= 2) {
                    const src = operands[0];
                    const dst = operands[1];
                    let srcReg;
                    if (src.type === 'register') {
                        srcReg = regMap[src.value];
                    } else {
                        srcReg = src.value;
                    }
                    if (dst.isMemory) {
                        if (dst.type === 'register') {
                            asm += `    MOV [${regMap[dst.value]}], ${srcReg}\n`;
                        } else {
                            asm += `    MOV [${dst.value}], ${srcReg}\n`;
                        }
                    } else if (dst.type === 'register') {
                        asm += `    MOV ${regMap[dst.value]}, ${srcReg}\n`;
                    }
                }
                break;
                
            case 'I': // INC
                if (operands.length >= 1) {
                    const reg = regMap[operands[0].value];
                    asm += `    INC ${reg}\n`;
                }
                break;
                
            case 'A': // ADD
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    // Special case: if adding a constant to AX for BIOS calls (0x0E00 + character)
                    // We want to ensure byte-level operations work correctly
                    asm += `    ADD ${reg1}, ${reg2}\n`;
                }
                break;
                
            case 'S': // SUB
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    SUB ${reg1}, ${reg2}\n`;
                }
                break;
                
            case 'M': // MUL
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    MUL ${reg2}\n`; // MUL uses implicit AX
                }
                break;
                
            case 'DI': // DIV
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    DIV ${reg2}\n`; // DIV uses implicit AX
                }
                break;
                
            case 'MO': // MOD
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    IDIV ${reg2}\n`; // MOD uses IDIV, remainder in DX
                    asm += `    MOV ${reg1}, DX\n`; // Move remainder to result
                }
                break;
                
            case 'C': // CMP
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    CMP ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    CMP ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'V': // JMP
                if (operands.length > 0) {
                    const target = operands[0];
                    // Prioritize labelName if it exists (unresolved label from assembler)
                    if (target.labelName) {
                        asm += `    JMP ${target.labelName}\n`;
                    } else if (target.type === 'label' || target.type === 'immediate') {
                        // Try to find label name from address, otherwise use address directly
                        const labelName = this.findLabelName(target.value, labels);
                        if (labelName) {
                            asm += `    JMP ${labelName}\n`;
                        } else {
                            asm += `    JMP ${target.value}\n`;
                        }
                    } else {
                        asm += `    JMP ${target.value}\n`;
                    }
                }
                break;
                
            case 'JE': // JEQ
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JE ${labelName}\n`;
                    } else {
                        asm += `    JE ${target.value}\n`;
                    }
                }
                break;
                
            case 'JN': // JNE
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JNE ${labelName}\n`;
                    } else {
                        asm += `    JNE ${target.value}\n`;
                    }
                }
                break;
                
            case 'JL': // JLT
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JL ${labelName}\n`;
                    } else {
                        asm += `    JL ${target.value}\n`;
                    }
                }
                break;
                
            case 'JG': // JGT
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JG ${labelName}\n`;
                    } else {
                        asm += `    JG ${target.value}\n`;
                    }
                }
                break;
                
            case 'JLE': // JLE
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JLE ${labelName}\n`;
                    } else {
                        asm += `    JLE ${target.value}\n`;
                    }
                }
                break;
                
            case 'JGE': // JGE
                if (operands.length > 0) {
                    const target = operands[0];
                    const labelName = (target.type === 'label' || target.labelName) ? 
                        (target.labelName || this.findLabelName(target.value, labels)) : null;
                    if (labelName) {
                        asm += `    JGE ${labelName}\n`;
                    } else {
                        asm += `    JGE ${target.value}\n`;
                    }
                }
                break;
                
            case 'CA': // CALL
                if (operands.length > 0) {
                    const target = operands[0];
                    // Prioritize labelName if it exists (unresolved label from assembler)
                    if (target.labelName) {
                        asm += `    CALL ${target.labelName}\n`;
                    } else if (target.type === 'label' || target.type === 'immediate') {
                        // Try to find label name from address, otherwise use address directly
                        const labelName = this.findLabelName(target.value, labels);
                        if (labelName) {
                            asm += `    CALL ${labelName}\n`;
                        } else {
                            asm += `    CALL ${target.value}\n`;
                        }
                    } else {
                        asm += `    CALL ${target.value}\n`;
                    }
                }
                break;
                
            case 'R': // RET
                asm += `    RET\n`;
                break;
                
            case 'P': // PUSH
                if (operands.length > 0) {
                    const reg = regMap[operands[0].value];
                    asm += `    PUSH ${reg}\n`;
                }
                break;
                
            case 'PO': // POP
                if (operands.length > 0) {
                    const reg = regMap[operands[0].value];
                    asm += `    POP ${reg}\n`;
                }
                break;
                
            case 'SL': // SHL
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    SHL ${reg1}, CL\n`; // Use CL for shift count
                }
                break;
                
            case 'SR': // SHR
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    asm += `    SHR ${reg1}, CL\n`; // Use CL for shift count
                }
                break;

            case 'HLT': // HLT
                asm += `    HLT\n`;
                break;

            case 'CLI': // CLI
                asm += `    CLI\n`;
                break;

            case 'STI': // STI
                asm += `    STI\n`;
                break;

            case 'NOP': // NOP
                asm += `    NOP\n`;
                break;

            case 'IRET': // IRET
                asm += `    IRET\n`;
                break;

            case 'INT': // INT
                if (operands.length > 0 && operands[0].type === 'immediate') {
                    const intNum = operands[0].value;
                    // For BIOS interrupts, we need to preserve register state
                    // The registers should already be set up by the calling code
                    // Output as hex (0x10, 0x16, etc.)
                    // For INT 0x10 with AX=3 (clear screen), ensure AH=0 explicitly
                    // But we'll let the caller handle register setup
                    asm += `    INT 0x${intNum.toString(16)}\n`;
                } else if (operands.length > 0 && operands[0].type === 'register') {
                    // INT with register (rare, but possible)
                    asm += `    INT ${regMap[operands[0].value]}\n`;
                }
                break;

            case 'IN': // IN
                if (operands.length >= 2) {
                    const reg = this.getRegisterName(operands[0], regMap, bits);
                    const port = operands[1];
                    if (port.type === 'immediate') {
                        asm += `    IN ${reg}, ${port.value}\n`;
                    } else if (port.type === 'register') {
                        // Port in DX register
                        asm += `    IN ${reg}, DX\n`;
                    }
                }
                break;

            case 'OUT': // OUT
                if (operands.length >= 2) {
                    const port = operands[0];
                    const reg = this.getRegisterName(operands[1], regMap, bits);
                    if (port.type === 'immediate') {
                        asm += `    OUT ${port.value}, ${reg}\n`;
                    } else if (port.type === 'register') {
                        // Port in DX register
                        asm += `    OUT DX, ${reg}\n`;
                    }
                }
                break;

            case 'MSEG': // MOV_SEG
                if (operands.length >= 2) {
                    const segReg = operands[0].value; // Segment register name
                    const src = operands[1];
                    if (src.type === 'register') {
                        asm += `    MOV ${segReg}, ${regMap[src.value]}\n`;
                    } else if (src.type === 'immediate') {
                        asm += `    MOV ${segReg}, ${src.value}\n`;
                    }
                }
                break;

            case 'MCR0': // MOV_CR0
            case 'MCR3': // MOV_CR3
            case 'MCR4': // MOV_CR4
                if (operands.length > 0) {
                    const crName = opcode === 'MCR0' ? 'CR0' : (opcode === 'MCR3' ? 'CR3' : 'CR4');
                    const reg = regMap[operands[0].value];
                    asm += `    MOV ${crName}, ${reg}\n`;
                }
                break;

            case 'L8': // LOAD8
                if (operands.length >= 2) {
                    const dstReg = this.getRegisterName(operands[0], regMap, bits, true);
                    const src = operands[1];
                    if (src.type === 'immediate') {
                        asm += `    MOV ${dstReg}, ${src.value}\n`;
                    } else if (src.type === 'register') {
                        asm += `    MOV ${dstReg}, ${regMap[src.value]}\n`;
                    } else if (src.isMemory) {
                        asm += `    MOV ${dstReg}, [${regMap[src.value]}]\n`;
                    }
                }
                break;

            case 'X8': // STORE8
                if (operands.length >= 2) {
                    const src = operands[0];
                    const dst = operands[1];
                    let srcReg;
                    if (src.type === 'register8bit') {
                        srcReg = src.value; // AL, BL, etc.
                    } else if (src.type === 'register') {
                        srcReg = regMap[src.value];
                    } else {
                        srcReg = src.value;
                    }
                    if (dst.isMemory) {
                        asm += `    MOV [${regMap[dst.value]}], ${srcReg}\n`;
                    } else if (dst.type === 'register8bit') {
                        asm += `    MOV ${dst.value}, ${srcReg}\n`;
                    }
                }
                break;

            case 'M8': // MOV8
                if (operands.length >= 2) {
                    const dst = this.getRegisterName(operands[0], regMap, bits, true);
                    const src = this.getRegisterName(operands[1], regMap, bits, true);
                    asm += `    MOV ${dst}, ${src}\n`;
                }
                break;
                
            default:
                asm += `    ; Unknown opcode: ${opcode}\n`;
        }
        
        return asm;
    }

    /**
     * Find label name by address
     * @param {number} address - Label address
     * @param {Object} labels - Label map
     * @returns {string|null} Label name or null
     */
    findLabelName(address, labels) {
        for (const [name, addr] of Object.entries(labels)) {
            if (addr === address) {
                return name;
            }
        }
        return null;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RomasmX86Generator;
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.RomasmX86Generator = RomasmX86Generator;
}
