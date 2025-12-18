/**
 * Romasm Virtual Machine
 * 
 * Executes compiled Romasm programs
 */

class RomasmVM {
    constructor() {
        this.reset();
    }

    reset() {
        this.registers = {
            'I': 0, 'II': 0, 'III': 0, 'IV': 0, 'V': 0,
            'VI': 0, 'VII': 0, 'VIII': 0, 'IX': 0
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

            default:
                throw new Error(`Unknown opcode: ${opcode}`);
        }
    }

    /**
     * Get current state
     * @returns {Object} VM state
     */
    getState() {
        return {
            registers: { ...this.registers },
            memory: { ...this.memory },
            stack: [...this.stack],
            pc: this.pc,
            flags: { ...this.flags },
            output: [...this.output],
            halted: this.halted
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

