/**
 * Romasm Virtual Machine
 * 
 * Executes compiled Romasm programs
 */

class RomasmVM {
    constructor(canvasContext = null) {
        this.canvasContext = canvasContext; // Canvas 2D context for drawing
        this.reset();
    }

    reset() {
        this.registers = {
            'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0,
            'VI': 0, 'VII': 0, 'VIII': 0, 'IX': 0
        };
        // 8-bit register parts (for BIOS compatibility)
        // These are parts of the full registers: R0 = EAX, so R0L = AL, R0H = AH
        this.registers8bit = {
            'AL': 0, 'AH': 0,  // Parts of R0 (EAX)
            'BL': 0, 'BH': 0,  // Parts of R1 (EBX)
            'CL': 0, 'CH': 0,  // Parts of R2 (ECX)
            'DL': 0, 'DH': 0   // Parts of R3 (EDX)
        };
        // Segment registers
        this.segmentRegisters = {
            'CS': 0, 'DS': 0, 'ES': 0, 'SS': 0, 'FS': 0, 'GS': 0
        };
        this.memory = {};
        this.stack = [];
        this.pc = 0; // Program counter
        this.instructions = [];
        this.output = [];
        this.running = false;
        this.halted = false;
        this.flags = {
            equal: false,
            lessThan: false,
            greaterThan: false
        };
        // CPU flags for OS development
        this.cpuFlags = {
            IF: false,  // Interrupt Flag
            TF: false,  // Trap Flag
            DF: false   // Direction Flag
        };
        // Interrupt handling
        this.interruptsEnabled = true;
        this.interruptVector = {}; // Interrupt handlers
        this.inInterrupt = false;
        this.interruptStack = [];
        // I/O ports (emulated)
        this.ioPorts = {};
        // Canvas drawing state
        this.pathStarted = false;
    }

    /**
     * Load a program
     * @param {Array} instructions - Compiled instructions
     */
    loadProgram(instructions) {
        this.instructions = instructions;
        this.pc = 0;
        this.halted = false;
    }

    /**
     * Execute a single instruction
     * @returns {Object} Execution result
     */
    step() {
        if (this.halted || this.pc >= this.instructions.length) {
            this.halted = true;
            return { halted: true };
        }

        const instruction = this.instructions[this.pc];
        const result = {
            instruction,
            pc: this.pc,
            registers: { ...this.registers },
            output: [...this.output]
        };

        try {
            this.executeInstruction(instruction);
            this.pc++;
        } catch (error) {
            result.error = error.message;
            this.halted = true;
        }

        return result;
    }

    /**
     * Execute all instructions
     * @param {number} maxSteps - Maximum number of steps (safety limit)
     * @returns {Object} Execution result
     */
    run(maxSteps = 10000) {
        this.running = true;
        let steps = 0;
        const trace = [];

        while (!this.halted && steps < maxSteps) {
            const result = this.step();
            trace.push(result);
            steps++;

            if (result.error) {
                break;
            }
        }

        this.running = false;

        return {
            success: !this.halted && steps < maxSteps,
            steps,
            trace,
            registers: { ...this.registers },
            memory: { ...this.memory },
            output: [...this.output],
            error: steps >= maxSteps ? 'Maximum steps exceeded' : null
        };
    }

    /**
     * Execute a single instruction
     * @param {Object} instruction - Instruction to execute
     */
    executeInstruction(instruction) {
        const { opcode, operands } = instruction;

        switch (opcode) {
            case 'I': // INC
                this.registers[operands[0].value]++;
                break;

            case 'D': // DEC
                this.registers[operands[0].value]--;
                break;

            case 'L': // LOAD
                {
                    const reg = operands[0].value;
                    const src = operands[1];
                    if (src.isMemory) {
                        this.registers[reg] = this.memory[src.value] || 0;
                    } else if (src.type === 'immediate') {
                        this.registers[reg] = src.value;
                    } else if (src.type === 'register') {
                        this.registers[reg] = this.registers[src.value];
                    }
                }
                break;

            case 'X': // STORE
                {
                    const src = operands[0];
                    const dst = operands[1];
                    let value;
                    if (src.type === 'register') {
                        value = this.registers[src.value];
                    } else {
                        value = src.value;
                    }
                    if (dst.isMemory) {
                        this.memory[dst.value] = value;
                    } else if (dst.type === 'register') {
                        this.registers[dst.value] = value;
                    }
                }
                break;

            case 'A': // ADD
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    this.registers[reg1] += this.registers[reg2];
                }
                break;

            case 'S': // SUB
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    this.registers[reg1] -= this.registers[reg2];
                }
                break;

            case 'M': // MUL
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    this.registers[reg1] *= this.registers[reg2];
                }
                break;

            case 'DI': // DIV
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    const divisor = this.registers[reg2];
                    if (divisor === 0) {
                        throw new Error('Division by zero');
                    }
                    this.registers[reg1] = Math.floor(this.registers[reg1] / divisor);
                }
                break;

            case 'MO': // MOD
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    const divisor = this.registers[reg2];
                    if (divisor === 0) {
                        throw new Error('Modulo by zero');
                    }
                    this.registers[reg1] = this.registers[reg1] % divisor;
                }
                break;

            case 'SL': // SHL (Shift Left - multiply by 2^n)
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    const shift = this.registers[reg2];
                    this.registers[reg1] = this.registers[reg1] << shift;
                }
                break;

            case 'SR': // SHR (Shift Right - divide by 2^n)
                {
                    const reg1 = operands[0].value;
                    const reg2 = operands[1].value;
                    const shift = this.registers[reg2];
                    this.registers[reg1] = Math.floor(this.registers[reg1] >> shift);
                }
                break;

            case 'C': // CMP
                {
                    const reg1 = operands[0].value;
                    const op2 = operands[1];
                    const val1 = this.registers[reg1];
                    // Handle both register and immediate values for second operand
                    let val2;
                    if (op2.type === 'immediate') {
                        val2 = op2.value;
                    } else if (op2.type === 'register') {
                        val2 = this.registers[op2.value];
                    } else {
                        throw new Error('CMP: Invalid operand type for second operand');
                    }
                    this.flags.equal = val1 === val2;
                    this.flags.lessThan = val1 < val2;
                    this.flags.greaterThan = val1 > val2;
                }
                break;

            case 'V': // JMP
                this.pc = operands[0].value - 1; // -1 because pc will be incremented
                break;

            case 'JE': // JEQ
                if (this.flags.equal) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'JN': // JNE
                if (!this.flags.equal) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'JL': // JLT
                if (this.flags.lessThan) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'JG': // JGT
                if (this.flags.greaterThan) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'JLE': // JLE (Jump if Less or Equal)
                if (this.flags.lessThan || this.flags.equal) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'JGE': // JGE (Jump if Greater or Equal)
                if (this.flags.greaterThan || this.flags.equal) {
                    this.pc = operands[0].value - 1;
                }
                break;

            case 'CA': // CALL
                this.stack.push(this.pc);
                this.pc = operands[0].value - 1;
                break;

            case 'R': // RET
                if (this.stack.length > 0) {
                    this.pc = this.stack.pop();
                } else {
                    this.halted = true;
                }
                break;

            case 'P': // PUSH
                {
                    const reg = operands[0].value;
                    this.stack.push(this.registers[reg]);
                }
                break;

            case 'PO': // POP
                {
                    const reg = operands[0].value;
                    if (this.stack.length > 0) {
                        this.registers[reg] = this.stack.pop();
                    }
                }
                break;

            case 'PR': // PRINT
                {
                    const reg = operands[0].value;
                    const value = this.registers[reg];
                    this.output.push(value);
                }
                break;

            // Canvas drawing opcodes (for graphics calculator)
            case 'MOV': // MOVE - Move to point (x, y) from registers
                {
                    if (!this.canvasContext) {
                        throw new Error('Canvas context not provided');
                    }
                    const xReg = operands[0].value;
                    const yReg = operands[1].value;
                    const x = this.registers[xReg];
                    const y = this.registers[yReg];
                    this.canvasContext.moveTo(x, y);
                    this.pathStarted = true;
                }
                break;

            case 'DRW': // DRAW - Line to point (x, y) from registers
                {
                    if (!this.canvasContext) {
                        throw new Error('Canvas context not provided');
                    }
                    const xReg = operands[0].value;
                    const yReg = operands[1].value;
                    const x = this.registers[xReg];
                    const y = this.registers[yReg];
                    if (!this.pathStarted) {
                        this.canvasContext.moveTo(x, y);
                        this.pathStarted = true;
                    } else {
                        this.canvasContext.lineTo(x, y);
                    }
                }
                break;

            case 'STR': // STROKE - Render the path
                {
                    if (!this.canvasContext) {
                        throw new Error('Canvas context not provided');
                    }
                    this.canvasContext.stroke();
                    this.pathStarted = false;
                }
                break;

            case 'CLR': // CLEAR - Clear canvas and begin new path
                {
                    if (!this.canvasContext) {
                        throw new Error('Canvas context not provided');
                    }
                    const width = this.canvasContext.canvas.width;
                    const height = this.canvasContext.canvas.height;
                    this.canvasContext.clearRect(0, 0, width, height);
                    this.pathStarted = false;
                }
                break;

            // System instructions for OS development
            case 'INT': // INT - Software Interrupt
                {
                    const interruptNum = operands[0].value;
                    this.handleInterrupt(interruptNum);
                }
                break;

            case 'IRET': // IRET - Return from Interrupt
                {
                    if (this.interruptStack.length > 0) {
                        const savedState = this.interruptStack.pop();
                        this.pc = savedState.pc;
                        this.flags = savedState.flags;
                        this.cpuFlags = savedState.cpuFlags;
                        this.inInterrupt = false;
                    } else {
                        throw new Error('IRET called but not in interrupt');
                    }
                }
                break;

            case 'CLI': // CLI - Clear Interrupt Flag
                this.cpuFlags.IF = false;
                this.interruptsEnabled = false;
                break;

            case 'STI': // STI - Set Interrupt Flag
                this.cpuFlags.IF = true;
                this.interruptsEnabled = true;
                break;

            case 'HLT': // HLT - Halt CPU
                this.halted = true;
                break;

            case 'NOP': // NOP - No Operation
                // Do nothing
                break;

            case 'IN': // IN - Input from I/O port
                {
                    const reg = operands[0].value;
                    const port = operands[1];
                    let portNum;
                    if (port.type === 'immediate') {
                        portNum = port.value;
                    } else if (port.type === 'register') {
                        portNum = this.registers[port.value];
                    } else {
                        throw new Error('IN: Invalid port operand');
                    }
                    // Read from I/O port (emulated)
                    const value = this.readIOPort(portNum);
                    if (reg in this.registers) {
                        this.registers[reg] = value;
                    } else if (reg in this.registers8bit) {
                        this.registers8bit[reg] = value & 0xFF;
                    }
                }
                break;

            case 'OUT': // OUT - Output to I/O port
                {
                    const port = operands[0];
                    const reg = operands[1].value;
                    let portNum;
                    if (port.type === 'immediate') {
                        portNum = port.value;
                    } else if (port.type === 'register') {
                        portNum = this.registers[port.value];
                    } else {
                        throw new Error('OUT: Invalid port operand');
                    }
                    // Get value from register
                    let value;
                    if (reg in this.registers) {
                        value = this.registers[reg];
                    } else if (reg in this.registers8bit) {
                        value = this.registers8bit[reg];
                    } else {
                        throw new Error('OUT: Invalid register');
                    }
                    // Write to I/O port (emulated)
                    this.writeIOPort(portNum, value);
                }
                break;

            case 'MSEG': // MOV_SEG - Move to segment register
                {
                    const segReg = operands[0].value;
                    const src = operands[1];
                    let value;
                    if (src.type === 'register') {
                        value = this.registers[src.value];
                    } else if (src.type === 'immediate') {
                        value = src.value;
                    } else {
                        throw new Error('MOV_SEG: Invalid source operand');
                    }
                    if (segReg in this.segmentRegisters) {
                        this.segmentRegisters[segReg] = value;
                    } else {
                        throw new Error(`MOV_SEG: Invalid segment register: ${segReg}`);
                    }
                }
                break;

            case 'MCR0': // MOV_CR0 - Move to CR0
            case 'MCR3': // MOV_CR3 - Move to CR3
            case 'MCR4': // MOV_CR4 - Move to CR4
                {
                    // Control register operations - for now, just store in memory
                    // In a real implementation, this would affect CPU state
                    const reg = operands[0].value;
                    const value = this.registers[reg];
                    const crName = opcode === 'MCR0' ? 'CR0' : (opcode === 'MCR3' ? 'CR3' : 'CR4');
                    this.memory[crName] = value;
                }
                break;

            case 'L8': // LOAD8 - Load 8-bit value
                {
                    const reg = operands[0].value;
                    const src = operands[1];
                    let value;
                    if (src.isMemory) {
                        value = this.memory[src.value] || 0;
                    } else if (src.type === 'immediate') {
                        value = src.value;
                    } else if (src.type === 'register8bit') {
                        value = this.registers8bit[src.value];
                    } else if (src.type === 'register') {
                        value = this.registers[src.value] & 0xFF;
                    } else {
                        throw new Error('LOAD8: Invalid source operand');
                    }
                    if (reg in this.registers8bit) {
                        this.registers8bit[reg] = value & 0xFF;
                    } else {
                        throw new Error('LOAD8: Invalid 8-bit register');
                    }
                }
                break;

            case 'X8': // STORE8 - Store 8-bit value
                {
                    const src = operands[0];
                    const dst = operands[1];
                    let value;
                    if (src.type === 'register8bit') {
                        value = this.registers8bit[src.value];
                    } else if (src.type === 'register') {
                        value = this.registers[src.value] & 0xFF;
                    } else {
                        value = src.value & 0xFF;
                    }
                    if (dst.isMemory) {
                        this.memory[dst.value] = value;
                    } else if (dst.type === 'register8bit') {
                        this.registers8bit[dst.value] = value;
                    } else {
                        throw new Error('STORE8: Invalid destination');
                    }
                }
                break;

            case 'M8': // MOV8 - Move 8-bit between registers
                {
                    const dst = operands[0].value;
                    const src = operands[1].value;
                    let value;
                    if (src in this.registers8bit) {
                        value = this.registers8bit[src];
                    } else if (src in this.registers) {
                        value = this.registers[src] & 0xFF;
                    } else {
                        throw new Error('MOV8: Invalid source register');
                    }
                    if (dst in this.registers8bit) {
                        this.registers8bit[dst] = value;
                    } else {
                        throw new Error('MOV8: Invalid destination register');
                    }
                }
                break;

            default:
                throw new Error(`Unknown opcode: ${opcode}`);
        }
    }

    /**
     * Handle software interrupt
     * @param {number} interruptNum - Interrupt number
     */
    handleInterrupt(interruptNum) {
        if (!this.interruptsEnabled && interruptNum !== 0x10 && interruptNum !== 0x16) {
            // Some interrupts can't be disabled (like BIOS interrupts)
            // For now, allow BIOS interrupts even if IF is clear
        }

        // Save current state
        this.interruptStack.push({
            pc: this.pc,
            flags: { ...this.flags },
            cpuFlags: { ...this.cpuFlags }
        });

        this.inInterrupt = true;

        // Call interrupt handler if registered
        if (this.interruptVector[interruptNum]) {
            const handler = this.interruptVector[interruptNum];
            handler.call(this);
        } else {
            // Default interrupt handling
            // For BIOS interrupts, we'll handle them in the x86 generator
            // For now, just log
            this.output.push(`[INT ${interruptNum.toString(16)}]`);
        }
    }

    /**
     * Register an interrupt handler
     * @param {number} interruptNum - Interrupt number
     * @param {Function} handler - Handler function
     */
    registerInterrupt(interruptNum, handler) {
        this.interruptVector[interruptNum] = handler;
    }

    /**
     * Read from I/O port (emulated)
     * @param {number} port - Port number
     * @returns {number} Value read from port
     */
    readIOPort(port) {
        // Default: return 0 or last written value
        return this.ioPorts[port] || 0;
    }

    /**
     * Write to I/O port (emulated)
     * @param {number} port - Port number
     * @param {number} value - Value to write
     */
    writeIOPort(port, value) {
        this.ioPorts[port] = value & 0xFF;
        // In a real implementation, this would trigger hardware
    }

    /**
     * Get current state
     * @returns {Object} VM state
     */
    getState() {
        return {
            registers: { ...this.registers },
            registers8bit: { ...this.registers8bit },
            segmentRegisters: { ...this.segmentRegisters },
            memory: { ...this.memory },
            stack: [...this.stack],
            pc: this.pc,
            flags: { ...this.flags },
            cpuFlags: { ...this.cpuFlags },
            output: [...this.output],
            halted: this.halted,
            interruptsEnabled: this.interruptsEnabled,
            inInterrupt: this.inInterrupt
        };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmVM };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.RomasmVM = RomasmVM;
}

