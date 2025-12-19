/**
 * Romasm x86 Code Generator
 * 
 * Converts Romasm VM instructions to x86 machine code
 * This allows Romasm programs to run on real hardware!
 */

class RomasmX86Generator {
    constructor(useSmartAllocation = true) {
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
        
        // Smart register allocation
        this.useSmartAllocation = useSmartAllocation;
        if (useSmartAllocation) {
            try {
                const { RomasmRegisterAllocator } = require('./romasm-register-allocator.js');
                this.allocator = new RomasmRegisterAllocator();
            } catch (e) {
                // Fallback to fixed allocation if allocator not available
                this.useSmartAllocation = false;
                this.allocator = null;
            }
        } else {
            this.allocator = null;
        }
        
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
        
        // For 64-bit mode (UEFI)
        this.reg64Map = {
            'I': 'RAX',   // R0 → RAX
            'II': 'RBX',  // R1 → RBX
            'III': 'RCX', // R2 → RCX
            'IV': 'RDX',  // R3 → RDX
            'V': 'RSI',   // R4 → RSI
            'VI': 'RDI',  // R5 → RDI
            'VII': 'RBP', // R6 → RBP
            'VIII': 'RSP' // R7 → RSP
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
     * Generate UEFI application code (64-bit)
     * @param {Array} instructions - Romasm VM instructions
     * @param {Array} data - Data bytes from DB directives
     * @param {Object} labels - Label address map (including data labels)
     * @returns {string} Complete UEFI x86-64 assembly
     */
    generateUEFI(instructions, data = [], labels = {}) {
        // Use 64-bit register mapping for UEFI
        // IMPORTANT: Always use fixed 64-bit mapping for UEFI
        // Smart allocator uses 16-bit registers which break 64-bit mode
        let regMap = { ...this.reg64Map }; // Copy to ensure we always have 64-bit registers
        
        // Disable smart allocation for UEFI - it returns 16-bit registers
        // UEFI requires consistent 64-bit register usage
        if (false && this.useSmartAllocation && this.allocator) {
            // Smart allocation disabled for UEFI mode
        }
        
        const bits = 64;
        let asm = '';
        
        // UEFI application header
        asm += `; UEFI Application generated from Romasm\n`;
        asm += `BITS 64\n\n`;
        
        // Entry point (UEFI uses efi_main)
        asm += `section .text\n`;
        asm += `global efi_main\n`;
        asm += `efi_main:\n`;
        
        // Track which labels we've already output
        const outputLabels = new Set(['efi_main']);
        
        // Generate code for each instruction
        for (let i = 0; i < instructions.length; i++) {
            const instr = instructions[i];
            
            // Check if this instruction address has a label (use instruction index)
            const labelName = this.findLabelName(i, labels);
            if (labelName && !outputLabels.has(labelName)) {
                asm += `${labelName}:\n`;
                outputLabels.add(labelName);
            }
            
            asm += this.generateInstruction(instr, regMap, bits, labels);
        }
        
        // Data section
        if (data && data.length > 0) {
            asm += `\nsection .data\n`;
            
            // Create a map of data array indices to labels
            const dataLabelMap = {};
            for (const [labelName, address] of Object.entries(labels)) {
                if (address >= instructions.length) {
                    const dataIndex = address - instructions.length;
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
                        if (!found) {
                            dataLabelMap[dataIndex] = labelName;
                        }
                    }
                }
            }
            
            // Output data with labels
            let currentLabel = null;
            let dataBytes = [];
            
            for (let i = 0; i < data.length; i++) {
                const dataItem = data[i];
                const label = dataLabelMap[i];
                
                // If we encounter a new label, output previous data first
                if (label && label !== currentLabel) {
                    if (currentLabel !== null && dataBytes.length > 0) {
                        asm += `    db ${dataBytes.join(', ')}\n`;
                        dataBytes = [];
                    }
                    if (label && !outputLabels.has(label)) {
                        asm += `${label}:\n`;
                        outputLabels.add(label);
                    }
                    currentLabel = label;
                } else if (!label && currentLabel !== null) {
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
                    asm += `${currentLabel}:\n`;
                    outputLabels.add(currentLabel);
                }
                asm += `    db ${dataBytes.join(', ')}\n`;
            }
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
        // Use smart register allocation if enabled
        let regMap = this.reg16Map;
        if (this.useSmartAllocation && this.allocator) {
            // Optimize register allocation using liveness analysis
            try {
                const allocation = this.allocator.optimizeAllocation(instructions);
                // Merge optimized allocation with default map (fallback for unused registers)
                regMap = { ...this.reg16Map, ...allocation };
            } catch (e) {
                // If allocation fails, use default mapping
                console.warn('Register allocation failed, using default mapping:', e.message);
                regMap = this.reg16Map;
            }
        }
        
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
            if (operand.value && (operand.value.startsWith('AL') || operand.value.startsWith('BL') || 
                operand.value.startsWith('CL') || operand.value.startsWith('DL') ||
                operand.value.startsWith('AH') || operand.value.startsWith('BH') ||
                operand.value.startsWith('CH') || operand.value.startsWith('DH'))) {
                return operand.value; // Already 8-bit name
            }
            // Map full register to 8-bit
            const reg8Map = {
                'I': 'AL', 'II': 'BL', 'III': 'CL', 'IV': 'DL',
                // For 64-bit registers, extract low byte
                'RAX': 'AL', 'RBX': 'BL', 'RCX': 'CL', 'RDX': 'DL',
                'EAX': 'AL', 'EBX': 'BL', 'ECX': 'CL', 'EDX': 'DL',
                'AX': 'AL', 'BX': 'BL', 'CX': 'CL', 'DX': 'DL'
            };
            const fullReg = regMap[operand.value] || operand.value;
            return reg8Map[fullReg] || reg8Map[operand.value] || 'AL';
        }
        return regMap[operand.value];
    }
    
    /**
     * Generate x86 assembly for a single Romasm instruction
     */
    generateInstruction(instruction, regMap, bits, labels = {}) {
        const { opcode, operands } = instruction;
        let asm = '';
        const is64bit = bits === 64;
        const sizePrefix = is64bit ? 'QWORD' : (bits === 32 ? 'DWORD' : 'WORD');
        
        switch (opcode) {
            case 'L': // LOAD
                if (operands.length >= 2) {
                    const reg = regMap[operands[0].value];
                    const src = operands[1];
                    
                    // Check for memory access FIRST (before register check)
                    if (src.isMemory && src.type === 'register') {
                        // Load from memory via register
                        const regName = regMap[operands[0].value];
                        const srcReg = regMap[src.value];
                        
                        if (is64bit) {
                            // 64-bit mode: Load full 64-bit value
                            asm += `    MOV ${reg}, QWORD [${srcReg}]\n`;
                        } else {
                            // 16/32-bit mode: Handle byte loads
                            const byteRegMap = {
                                'AX': 'AL', 'BX': 'BL', 'CX': 'CL', 'DX': 'DL',
                                'EAX': 'AL', 'EBX': 'BL', 'ECX': 'CL', 'EDX': 'DL'
                            };
                            const byteReg = byteRegMap[regName];
                            
                            if (byteReg) {
                                // Load byte and zero-extend
                                asm += `    MOV ${byteReg}, BYTE [${srcReg}]\n`;
                                // Zero-extend: clear high bytes
                                if (bits === 16) {
                                    const highByteMap = { 'AL': 'AH', 'BL': 'BH', 'CL': 'CH', 'DL': 'DH' };
                                    const highByte = highByteMap[byteReg];
                                    if (highByte) {
                                        asm += `    XOR ${highByte}, ${highByte}\n`;
                                    }
                                } else if (bits === 32) {
                                    // Zero-extend to 32-bit
                                    asm += `    MOVZX ${reg}, ${byteReg}\n`;
                                }
                            } else {
                                // Full register load
                                asm += `    MOV ${reg}, ${sizePrefix} [${srcReg}]\n`;
                            }
                        }
                    } else if (src.isMemory && src.type === 'immediate') {
                        // Load from immediate address
                        if (is64bit) {
                            asm += `    MOV ${reg}, QWORD [${src.value}]\n`;
                        } else {
                            asm += `    MOV ${reg}, [${src.value}]\n`;
                        }
                    } else if (src.type === 'immediate') {
                        // Optimize: Use XOR to zero register (smaller, faster)
                        if (src.value === 0 || src.value === '0' || src.value === '0x0') {
                            asm += `    XOR ${reg}, ${reg}\n`;
                        } else {
                            if (is64bit) {
                                // For 64-bit, use MOV with proper immediate size
                                // If value fits in 32-bit signed, use 32-bit immediate (sign-extended)
                                const val = typeof src.value === 'string' ? parseInt(src.value, 16) : src.value;
                                if (val >= -2147483648 && val <= 2147483647) {
                                    asm += `    MOV ${reg}, ${src.value}\n`; // NASM will use 32-bit immediate
                                } else {
                                    // Large 64-bit immediate - use MOV with QWORD
                                    asm += `    MOV ${reg}, ${src.value}\n`;
                                }
                            } else {
                                asm += `    MOV ${reg}, ${src.value}\n`;
                            }
                        }
                    } else if (src.type === 'register') {
                        const srcReg = regMap[src.value];
                        // Optimize: Skip MOV if source and dest are same
                        if (reg !== srcReg) {
                            asm += `    MOV ${reg}, ${srcReg}\n`;
                        }
                        // If same, skip (will be removed by peephole optimizer)
                    } else if (src.type === 'label' || src.labelName) {
                        // Loading address of a label (data label)
                        const labelName = src.labelName || this.findLabelName(src.value, labels);
                        if (labelName) {
                            if (is64bit) {
                                // Use LEA for 64-bit address loading
                                asm += `    LEA ${reg}, [${labelName}]\n`;
                            } else {
                                asm += `    MOV ${reg}, ${labelName}\n`;
                            }
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
                            const memSize = is64bit ? 'QWORD' : sizePrefix;
                            asm += `    MOV ${memSize} [${regMap[dst.value]}], ${srcReg}\n`;
                        } else {
                            const memSize = is64bit ? 'QWORD' : sizePrefix;
                            asm += `    MOV ${memSize} [${dst.value}], ${srcReg}\n`;
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
                
            case 'D': // DEC
                if (operands.length >= 1) {
                    const reg = regMap[operands[0].value];
                    asm += `    DEC ${reg}\n`;
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
                    if (is64bit) {
                        // In 64-bit: MUL uses implicit RAX, result in RDX:RAX
                        asm += `    MUL ${reg2}\n`;
                        asm += `    MOV ${reg1}, RAX\n`; // Move result to dest register
                    } else {
                        // 16/32-bit: MUL uses implicit AX/EAX
                        asm += `    MUL ${reg2}\n`;
                    }
                }
                break;
                
            case 'DI': // DIV
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    if (is64bit) {
                        // In 64-bit: DIV uses implicit RDX:RAX, quotient in RAX
                        asm += `    DIV ${reg2}\n`;
                        asm += `    MOV ${reg1}, RAX\n`; // Move quotient to dest
                    } else {
                        // 16/32-bit: DIV uses implicit DX:AX or EDX:EAX
                        asm += `    DIV ${reg2}\n`;
                    }
                }
                break;
                
            case 'MO': // MOD
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    if (is64bit) {
                        // In 64-bit: IDIV uses implicit RDX:RAX, remainder in RDX
                        asm += `    IDIV ${reg2}\n`;
                        asm += `    MOV ${reg1}, RDX\n`; // Move remainder to result
                    } else {
                        // 16/32-bit: IDIV uses implicit DX:AX or EDX:EAX, remainder in DX/EDX
                        const remainderReg = bits === 32 ? 'EDX' : 'DX';
                        asm += `    IDIV ${reg2}\n`;
                        asm += `    MOV ${reg1}, ${remainderReg}\n`; // Move remainder to result
                    }
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
                        } else if (typeof target.value === 'number') {
                            // Numeric address - try to find label at that instruction index
                            const labelAtAddr = this.findLabelName(target.value, labels);
                            if (labelAtAddr) {
                                asm += `    JMP ${labelAtAddr}\n`;
                            } else {
                                // Fallback: use numeric address (NASM will accept this, but it's not ideal)
                                asm += `    JMP ${target.value}\n`;
                            }
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
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        // Immediate shift count
                        asm += `    SHL ${reg1}, ${op2.value}\n`;
                    } else {
                        // Shift count in CL register
                        const shiftReg = regMap[op2.value];
                        if (is64bit && shiftReg !== 'CL') {
                            // In 64-bit, move to CL if not already
                            asm += `    MOV CL, ${shiftReg}\n`;
                        }
                        asm += `    SHL ${reg1}, CL\n`;
                    }
                }
                break;
                
            case 'SR': // SHR
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        // Immediate shift count
                        asm += `    SHR ${reg1}, ${op2.value}\n`;
                    } else {
                        // Shift count in CL register
                        const shiftReg = regMap[op2.value];
                        if (is64bit && shiftReg !== 'CL') {
                            // In 64-bit, move to CL if not already
                            asm += `    MOV CL, ${shiftReg}\n`;
                        }
                        asm += `    SHR ${reg1}, CL\n`;
                    }
                }
                break;
                
            case 'AN': // AND
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    AND ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    AND ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'OR': // OR
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    OR ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    OR ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'XO': // XOR
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    XOR ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    XOR ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'NOT': // NOT
                if (operands.length >= 1) {
                    const reg = regMap[operands[0].value];
                    asm += `    NOT ${reg}\n`;
                }
                break;
                
            case 'NEG': // NEG - Negate (two's complement)
                if (operands.length >= 1) {
                    const reg = regMap[operands[0].value];
                    asm += `    NEG ${reg}\n`;
                }
                break;
                
            case 'ADC': // ADC - Add with Carry
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    ADC ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    ADC ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'SBB': // SBB - Subtract with Borrow
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    SBB ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    SBB ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'SETZ': // SETZ - Set if Zero (equal)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true); // 8-bit register
                    asm += `    SETZ ${reg}\n`;
                }
                break;
                
            case 'SETNZ': // SETNZ - Set if Not Zero (not equal)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETNZ ${reg}\n`;
                }
                break;
                
            case 'SETL': // SETL - Set if Less (signed)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETL ${reg}\n`;
                }
                break;
                
            case 'SETG': // SETG - Set if Greater (signed)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETG ${reg}\n`;
                }
                break;
                
            case 'SETLE': // SETLE - Set if Less or Equal (signed)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETLE ${reg}\n`;
                }
                break;
                
            case 'SETGE': // SETGE - Set if Greater or Equal (signed)
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETGE ${reg}\n`;
                }
                break;
                
            case 'SETC': // SETC - Set if Carry
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETC ${reg}\n`;
                }
                break;
                
            case 'SETNC': // SETNC - Set if No Carry
                if (operands.length >= 1) {
                    const reg = this.getRegisterName(operands[0], regMap, bits, true);
                    asm += `    SETNC ${reg}\n`;
                }
                break;
                
            case 'CMOVZ': // CMOVZ - Conditional Move if Zero
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVZ ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        // CMOV doesn't support immediate, need to load to temp reg first
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVZ ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVNZ': // CMOVNZ - Conditional Move if Not Zero
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVNZ ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVNZ ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVL': // CMOVL - Conditional Move if Less
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVL ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVL ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVG': // CMOVG - Conditional Move if Greater
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVG ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVG ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVLE': // CMOVLE - Conditional Move if Less or Equal
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVLE ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVLE ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVGE': // CMOVGE - Conditional Move if Greater or Equal
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVGE ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVGE ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVC': // CMOVC - Conditional Move if Carry
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVC ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVC ${reg1}, ${tempReg}\n`;
                    }
                }
                break;
                
            case 'CMOVNC': // CMOVNC - Conditional Move if No Carry
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    CMOVNC ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    CMOVNC ${reg1}, ${tempReg}\n`;
                    }
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
                
            case 'CLD': // CLD - Clear Direction Flag (forward)
                asm += `    CLD\n`;
                break;
                
            case 'STD': // STD - Set Direction Flag (backward)
                asm += `    STD\n`;
                break;
                
            case 'CLC': // CLC - Clear Carry Flag
                asm += `    CLC\n`;
                break;
                
            case 'STC': // STC - Set Carry Flag
                asm += `    STC\n`;
                break;
                
            case 'CMC': // CMC - Complement Carry Flag
                asm += `    CMC\n`;
                break;
                
            case 'PUSHF': // PUSHF - Push Flags
                if (is64bit) {
                    asm += `    PUSHFQ\n`;  // 64-bit push flags
                } else {
                    asm += `    PUSHF\n`;
                }
                break;
                
            case 'POPF': // POPF - Pop Flags
                if (is64bit) {
                    asm += `    POPFQ\n`;  // 64-bit pop flags
                } else {
                    asm += `    POPF\n`;
                }
                break;
                
            case 'TEST': // TEST - Test bits (sets flags without modifying operands)
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    TEST ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    TEST ${reg1}, ${regMap[op2.value]}\n`;
                    }
                }
                break;
                
            case 'MOVS': // MOVS - Move String (copy memory)
                // MOVS copies from [RSI] to [RDI] (or [ESI] to [EDI] in 32-bit)
                // Operands: destination, source
                if (operands.length >= 2) {
                    const dstReg = regMap[operands[0].value];
                    const srcReg = regMap[operands[1].value];
                    
                    // String instructions use implicit registers:
                    // RSI/ESI = source, RDI/EDI = destination
                    // We need to set these up first
                    const srcStrReg = is64bit ? 'RSI' : 'ESI';
                    const dstStrReg = is64bit ? 'RDI' : 'EDI';
                    const sizeSuffix = is64bit ? 'Q' : (bits === 32 ? 'D' : 'W');
                    
                    // Move source address to RSI/ESI
                    if (srcReg !== srcStrReg) {
                        asm += `    MOV ${srcStrReg}, ${srcReg}\n`;
                    }
                    // Move destination address to RDI/EDI
                    if (dstReg !== dstStrReg) {
                        asm += `    MOV ${dstStrReg}, ${dstReg}\n`;
                    }
                    
                    // Add REP prefix if present
                    const repPrefix = instruction.repPrefix || '';
                    if (repPrefix === 'REP') {
                        asm += `    REP MOVS${sizeSuffix}\n`;
                    } else if (repPrefix === 'REPE' || repPrefix === 'REPZ') {
                        asm += `    REPE MOVS${sizeSuffix}\n`;
                    } else if (repPrefix === 'REPNE' || repPrefix === 'REPNZ') {
                        asm += `    REPNE MOVS${sizeSuffix}\n`;
                    } else {
                        asm += `    MOVS${sizeSuffix}\n`;
                    }
                    
                    // Update destination register with new RDI/EDI value
                    if (dstReg !== dstStrReg) {
                        asm += `    MOV ${dstReg}, ${dstStrReg}\n`;
                    }
                    // Update source register with new RSI/ESI value
                    if (srcReg !== srcStrReg) {
                        asm += `    MOV ${srcReg}, ${srcStrReg}\n`;
                    }
                }
                break;
                
            case 'STOS': // STOS - Store String (fill memory)
                // STOS stores RAX/EAX/AX to [RDI]/[EDI]/[DI]
                // Operands: destination address, value to store
                if (operands.length >= 2) {
                    const dstReg = regMap[operands[0].value];
                    const valueReg = regMap[operands[1].value];
                    
                    const dstStrReg = is64bit ? 'RDI' : 'EDI';
                    const accReg = is64bit ? 'RAX' : (bits === 32 ? 'EAX' : 'AX');
                    const sizeSuffix = is64bit ? 'Q' : (bits === 32 ? 'D' : 'W');
                    
                    // Move value to accumulator
                    if (valueReg !== accReg) {
                        asm += `    MOV ${accReg}, ${valueReg}\n`;
                    }
                    // Move destination address to RDI/EDI
                    if (dstReg !== dstStrReg) {
                        asm += `    MOV ${dstStrReg}, ${dstReg}\n`;
                    }
                    
                    // Add REP prefix if present
                    const repPrefix = instruction.repPrefix || '';
                    if (repPrefix === 'REP') {
                        asm += `    REP STOS${sizeSuffix}\n`;
                    } else {
                        asm += `    STOS${sizeSuffix}\n`;
                    }
                    
                    // Update destination register
                    if (dstReg !== dstStrReg) {
                        asm += `    MOV ${dstReg}, ${dstStrReg}\n`;
                    }
                }
                break;
                
            case 'LODS': // LODS - Load String (read sequential memory)
                // LODS loads from [RSI]/[ESI]/[SI] to RAX/EAX/AX
                // Operands: destination register, source address
                if (operands.length >= 2) {
                    const dstReg = regMap[operands[0].value];
                    const srcReg = regMap[operands[1].value];
                    
                    const srcStrReg = is64bit ? 'RSI' : 'ESI';
                    const accReg = is64bit ? 'RAX' : (bits === 32 ? 'EAX' : 'AX');
                    const sizeSuffix = is64bit ? 'Q' : (bits === 32 ? 'D' : 'W');
                    
                    // Move source address to RSI/ESI
                    if (srcReg !== srcStrReg) {
                        asm += `    MOV ${srcStrReg}, ${srcReg}\n`;
                    }
                    
                    // Add REP prefix if present
                    const repPrefix = instruction.repPrefix || '';
                    if (repPrefix === 'REP') {
                        asm += `    REP LODS${sizeSuffix}\n`;
                    } else {
                        asm += `    LODS${sizeSuffix}\n`;
                    }
                    
                    // Move accumulator to destination
                    if (dstReg !== accReg) {
                        asm += `    MOV ${dstReg}, ${accReg}\n`;
                    }
                    // Update source register
                    if (srcReg !== srcStrReg) {
                        asm += `    MOV ${srcReg}, ${srcStrReg}\n`;
                    }
                }
                break;
                
            case 'CMPS': // CMPS - Compare String
                // CMPS compares [RSI] with [RDI]
                // Operands: first address, second address
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const reg2 = regMap[operands[1].value];
                    
                    const srcStrReg = is64bit ? 'RSI' : 'ESI';
                    const dstStrReg = is64bit ? 'RDI' : 'EDI';
                    const sizeSuffix = is64bit ? 'Q' : (bits === 32 ? 'D' : 'W');
                    
                    // Set up string registers
                    if (reg1 !== srcStrReg) {
                        asm += `    MOV ${srcStrReg}, ${reg1}\n`;
                    }
                    if (reg2 !== dstStrReg) {
                        asm += `    MOV ${dstStrReg}, ${reg2}\n`;
                    }
                    
                    // Add REP prefix if present
                    const repPrefix = instruction.repPrefix || '';
                    if (repPrefix === 'REPE' || repPrefix === 'REPZ') {
                        asm += `    REPE CMPS${sizeSuffix}\n`;
                    } else if (repPrefix === 'REPNE' || repPrefix === 'REPNZ') {
                        asm += `    REPNE CMPS${sizeSuffix}\n`;
                    } else {
                        asm += `    CMPS${sizeSuffix}\n`;
                    }
                }
                break;
                
            case 'SCAS': // SCAS - Scan String
                // SCAS compares [RDI] with RAX/EAX/AX
                // Operands: address to scan, value to search for
                if (operands.length >= 2) {
                    const addrReg = regMap[operands[0].value];
                    const valueReg = regMap[operands[1].value];
                    
                    const dstStrReg = is64bit ? 'RDI' : 'EDI';
                    const accReg = is64bit ? 'RAX' : (bits === 32 ? 'EAX' : 'AX');
                    const sizeSuffix = is64bit ? 'Q' : (bits === 32 ? 'D' : 'W');
                    
                    // Move value to accumulator
                    if (valueReg !== accReg) {
                        asm += `    MOV ${accReg}, ${valueReg}\n`;
                    }
                    // Move address to RDI/EDI
                    if (addrReg !== dstStrReg) {
                        asm += `    MOV ${dstStrReg}, ${addrReg}\n`;
                    }
                    
                    // Add REP prefix if present
                    const repPrefix = instruction.repPrefix || '';
                    if (repPrefix === 'REPE' || repPrefix === 'REPZ') {
                        asm += `    REPE SCAS${sizeSuffix}\n`;
                    } else if (repPrefix === 'REPNE' || repPrefix === 'REPNZ') {
                        asm += `    REPNE SCAS${sizeSuffix}\n`;
                    } else {
                        asm += `    SCAS${sizeSuffix}\n`;
                    }
                }
                break;
                
            case 'XCHG': // XCHG - Exchange (atomic swap)
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    XCHG ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.type === 'immediate') {
                        // XCHG with immediate is not supported in x86 (use MOV + XCHG)
                        const tempReg = is64bit ? 'RCX' : (bits === 32 ? 'ECX' : 'CX');
                        asm += `    MOV ${tempReg}, ${op2.value}\n`;
                        asm += `    XCHG ${reg1}, ${tempReg}\n`;
                    } else if (op2.isMemory) {
                        // XCHG with memory
                        if (op2.type === 'register') {
                            asm += `    XCHG ${reg1}, [${regMap[op2.value]}]\n`;
                        } else {
                            asm += `    XCHG ${reg1}, [${op2.value}]\n`;
                        }
                    }
                }
                break;
                
            case 'CMPXCHG': // CMPXCHG - Compare and Exchange (atomic)
                // CMPXCHG dest, src
                // Compares RAX/EAX/AX with dest, if equal: dest = src, else: RAX = dest
                // Operands: destination (memory or register), source (register)
                if (operands.length >= 2) {
                    const dest = operands[0];
                    const srcReg = regMap[operands[1].value];
                    const accReg = is64bit ? 'RAX' : (bits === 32 ? 'EAX' : 'AX');
                    
                    if (dest.isMemory) {
                        if (dest.type === 'register') {
                            asm += `    CMPXCHG [${regMap[dest.value]}], ${srcReg}\n`;
                        } else {
                            asm += `    CMPXCHG [${dest.value}], ${srcReg}\n`;
                        }
                    } else if (dest.type === 'register') {
                        const destReg = regMap[dest.value];
                        // CMPXCHG compares with accumulator, so we need to save/restore
                        asm += `    CMPXCHG ${destReg}, ${srcReg}\n`;
                    }
                }
                break;
                
            case 'BT': // BT - Bit Test (sets carry flag)
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    BT ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    BT ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BT [${regMap[op2.value]}], ${reg1}\n`;
                        } else {
                            asm += `    BT [${op2.value}], ${reg1}\n`;
                        }
                    }
                }
                break;
                
            case 'BTS': // BTS - Bit Test and Set
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    BTS ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    BTS ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BTS [${regMap[op2.value]}], ${reg1}\n`;
                        } else {
                            asm += `    BTS [${op2.value}], ${reg1}\n`;
                        }
                    }
                }
                break;
                
            case 'BTR': // BTR - Bit Test and Reset (clear)
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    BTR ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    BTR ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BTR [${regMap[op2.value]}], ${reg1}\n`;
                        } else {
                            asm += `    BTR [${op2.value}], ${reg1}\n`;
                        }
                    }
                }
                break;
                
            case 'BTC': // BTC - Bit Test and Complement (toggle)
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    BTC ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        asm += `    BTC ${reg1}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BTC [${regMap[op2.value]}], ${reg1}\n`;
                        } else {
                            asm += `    BTC [${op2.value}], ${reg1}\n`;
                        }
                    }
                }
                break;
                
            case 'BSF': // BSF - Bit Scan Forward (find first set bit)
                // BSF dest, src - finds index of first set bit in src, stores in dest
                if (operands.length >= 2) {
                    const destReg = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    BSF ${destReg}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BSF ${destReg}, [${regMap[op2.value]}]\n`;
                        } else {
                            asm += `    BSF ${destReg}, [${op2.value}]\n`;
                        }
                    }
                }
                break;
                
            case 'BSR': // BSR - Bit Scan Reverse (find last set bit)
                // BSR dest, src - finds index of last set bit in src, stores in dest
                if (operands.length >= 2) {
                    const destReg = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'register') {
                        asm += `    BSR ${destReg}, ${regMap[op2.value]}\n`;
                    } else if (op2.isMemory) {
                        if (op2.type === 'register') {
                            asm += `    BSR ${destReg}, [${regMap[op2.value]}]\n`;
                        } else {
                            asm += `    BSR ${destReg}, [${op2.value}]\n`;
                        }
                    }
                }
                break;
                
            case 'ROL': // ROL - Rotate Left
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    ROL ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        // ROL with register uses CL as count
                        const countReg = 'CL';
                        asm += `    MOV ${countReg}, ${regMap[op2.value]}\n`;
                        asm += `    ROL ${reg1}, CL\n`;
                    }
                }
                break;
                
            case 'ROR': // ROR - Rotate Right
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    ROR ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        const countReg = 'CL';
                        asm += `    MOV ${countReg}, ${regMap[op2.value]}\n`;
                        asm += `    ROR ${reg1}, CL\n`;
                    }
                }
                break;
                
            case 'RCL': // RCL - Rotate Left through Carry
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    RCL ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        const countReg = 'CL';
                        asm += `    MOV ${countReg}, ${regMap[op2.value]}\n`;
                        asm += `    RCL ${reg1}, CL\n`;
                    }
                }
                break;
                
            case 'RCR': // RCR - Rotate Right through Carry
                if (operands.length >= 2) {
                    const reg1 = regMap[operands[0].value];
                    const op2 = operands[1];
                    if (op2.type === 'immediate') {
                        asm += `    RCR ${reg1}, ${op2.value}\n`;
                    } else if (op2.type === 'register') {
                        const countReg = 'CL';
                        asm += `    MOV ${countReg}, ${regMap[op2.value]}\n`;
                        asm += `    RCR ${reg1}, CL\n`;
                    }
                }
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
