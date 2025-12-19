/**
 * Romasm Register Allocator
 * 
 * Implements smarter register allocation to improve code quality:
 * - Live register analysis
 * - Register reuse
 * - Reduced register spills
 * - Dynamic register selection
 */

class RomasmRegisterAllocator {
    constructor() {
        // Available x86 registers (16-bit)
        this.registers16bit = ['AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'BP', 'SP'];
        
        // Register usage tracking
        this.registerState = {}; // Map: Romasm reg → x86 reg
        this.x86RegisterInUse = {}; // Map: x86 reg → Romasm reg (reverse)
        this.registerLiveness = {}; // Map: instruction index → Set of live Romasm registers
    }

    /**
     * Analyze register liveness across instructions
     * @param {Array} instructions - Romasm VM instructions
     * @returns {Object} Liveness map
     */
    analyzeLiveness(instructions) {
        const liveness = {};
        const lastUse = {}; // Track last use of each register
        
        // Forward pass: find first use
        const firstUse = {};
        for (let i = 0; i < instructions.length; i++) {
            const instr = instructions[i];
            this._markRegisterUses(instr, i, firstUse, lastUse);
        }
        
        // Build liveness intervals
        for (const [reg, first] of Object.entries(firstUse)) {
            liveness[reg] = {
                first: first,
                last: lastUse[reg] || first,
                live: true
            };
        }
        
        return liveness;
    }

    /**
     * Mark register uses in an instruction
     */
    _markRegisterUses(instruction, index, firstUse, lastUse) {
        const { opcode, operands } = instruction;
        
        if (!operands) return;
        
        // Destinations (written to)
        let destRegs = [];
        if (operands.length > 0) {
            const firstOp = operands[0];
            if (firstOp.type === 'register') {
                destRegs.push(firstOp.value);
            }
        }
        
        // Sources (read from)
        const srcRegs = [];
        for (let i = 1; i < operands.length; i++) {
            const op = operands[i];
            if (op.type === 'register') {
                srcRegs.push(op.value);
            }
        }
        
        // Handle special cases
        switch (opcode) {
            case 'L': // LOAD: dest = operands[0]
                if (operands.length > 0 && operands[0].type === 'register') {
                    destRegs = [operands[0].value];
                }
                break;
            case 'A': // ADD: dest = operands[0], src = operands[1]
            case 'S': // SUB
            case 'M': // MUL
                if (operands.length > 0 && operands[0].type === 'register') {
                    destRegs = [operands[0].value];
                }
                if (operands.length > 1 && operands[1].type === 'register') {
                    srcRegs.push(operands[1].value);
                }
                break;
            case 'X': // STORE: src = operands[0]
                if (operands.length > 0 && operands[0].type === 'register') {
                    srcRegs.push(operands[0].value);
                }
                break;
        }
        
        // Mark first use
        for (const reg of srcRegs) {
            if (!(reg in firstUse)) {
                firstUse[reg] = index;
            }
        }
        
        // Mark last use
        for (const reg of srcRegs) {
            lastUse[reg] = index;
        }
        for (const reg of destRegs) {
            lastUse[reg] = index;
        }
    }

    /**
     * Allocate a register for a Romasm register
     * @param {string} romasmReg - Romasm register (I, II, III, etc.)
     * @param {number} instructionIndex - Current instruction index
     * @param {Object} liveness - Liveness analysis results
     * @returns {string} x86 register name
     */
    allocateRegister(romasmReg, instructionIndex, liveness) {
        // Check if register is already allocated and still live
        if (romasmReg in this.registerState) {
            const allocatedReg = this.registerState[romasmReg];
            const live = liveness[romasmReg];
            
            // If register is still live, reuse it
            if (live && instructionIndex <= live.last) {
                return allocatedReg;
            }
            
            // Register is dead, free it
            delete this.x86RegisterInUse[allocatedReg];
            delete this.registerState[romasmReg];
        }
        
        // Find available x86 register
        const availableReg = this._findAvailableRegister(instructionIndex, liveness);
        
        if (!availableReg) {
            // No register available - need to spill
            // For now, use a default mapping (can be improved with spilling)
            return this._defaultMapping(romasmReg);
        }
        
        // Allocate the register
        this.registerState[romasmReg] = availableReg;
        this.x86RegisterInUse[availableReg] = romasmReg;
        
        return availableReg;
    }

    /**
     * Find an available x86 register
     * Prioritizes registers that are not in use
     */
    _findAvailableRegister(instructionIndex, liveness) {
        // Priority order: prefer general-purpose registers
        const priority = ['AX', 'BX', 'CX', 'DX', 'SI', 'DI'];
        
        for (const reg of priority) {
            // Skip if register is in use
            if (reg in this.x86RegisterInUse) {
                const romasmReg = this.x86RegisterInUse[reg];
                const live = liveness[romasmReg];
                
                // Check if the register will be freed soon
                if (live && instructionIndex > live.last) {
                    // Register is dead, can reuse
                    delete this.x86RegisterInUse[reg];
                    delete this.registerState[romasmReg];
                    return reg;
                }
                
                continue; // Still in use
            }
            
            // Register is available
            return reg;
        }
        
        return null; // No register available
    }

    /**
     * Default mapping (fallback)
     */
    _defaultMapping(romasmReg) {
        const map = {
            'I': 'AX',
            'II': 'BX',
            'III': 'CX',
            'IV': 'DX',
            'V': 'SI',
            'VI': 'DI',
            'VII': 'BP',
            'VIII': 'SP'
        };
        return map[romasmReg] || 'AX';
    }

    /**
     * Free a register (mark as no longer in use)
     */
    freeRegister(romasmReg) {
        if (romasmReg in this.registerState) {
            const x86Reg = this.registerState[romasmReg];
            delete this.x86RegisterInUse[x86Reg];
            delete this.registerState[romasmReg];
        }
    }

    /**
     * Get current register mapping
     */
    getMapping() {
        return { ...this.registerState };
    }

    /**
     * Reset allocator state
     */
    reset() {
        this.registerState = {};
        this.x86RegisterInUse = {};
        this.registerLiveness = {};
    }

    /**
     * Optimize register usage across a sequence of instructions
     * This is a more sophisticated approach that considers the entire program
     */
    optimizeAllocation(instructions) {
        // Step 1: Analyze liveness
        const liveness = this.analyzeLiveness(instructions);
        
        // Step 2: Build interference graph (which registers conflict)
        const interference = this._buildInterferenceGraph(instructions, liveness);
        
        // Step 3: Allocate with graph coloring (simplified)
        // For now, use a greedy approach
        const allocation = this._greedyAllocate(instructions, liveness, interference);
        
        return allocation;
    }

    /**
     * Build interference graph
     * Two registers interfere if they're live at the same time
     */
    _buildInterferenceGraph(instructions, liveness) {
        const interference = {};
        const regs = Object.keys(liveness);
        
        // Initialize interference map
        for (const reg of regs) {
            interference[reg] = new Set();
        }
        
        // Check for overlapping live ranges
        for (let i = 0; i < regs.length; i++) {
            for (let j = i + 1; j < regs.length; j++) {
                const reg1 = regs[i];
                const reg2 = regs[j];
                const live1 = liveness[reg1];
                const live2 = liveness[reg2];
                
                // Check if ranges overlap
                if (this._rangesOverlap(live1.first, live1.last, live2.first, live2.last)) {
                    interference[reg1].add(reg2);
                    interference[reg2].add(reg1);
                }
            }
        }
        
        return interference;
    }

    /**
     * Check if two ranges overlap
     */
    _rangesOverlap(start1, end1, start2, end2) {
        return !(end1 < start2 || end2 < start1);
    }

    /**
     * Greedy register allocation
     * Assigns registers trying to minimize conflicts
     */
    _greedyAllocate(instructions, liveness, interference) {
        const allocation = {};
        const regs = Object.keys(liveness).sort((a, b) => {
            // Sort by number of interferences (most constrained first)
            return interference[b].size - interference[a].size;
        });
        
        const availableRegs = ['AX', 'BX', 'CX', 'DX', 'SI', 'DI'];
        
        for (const reg of regs) {
            const interfering = interference[reg];
            const usedRegs = new Set();
            
            // Collect registers used by interfering nodes
            for (const interferingReg of interfering) {
                if (interferingReg in allocation) {
                    usedRegs.add(allocation[interferingReg]);
                }
            }
            
            // Find first available register
            for (const x86Reg of availableRegs) {
                if (!usedRegs.has(x86Reg)) {
                    allocation[reg] = x86Reg;
                    break;
                }
            }
            
            // Fallback to default if none available
            if (!(reg in allocation)) {
                allocation[reg] = this._defaultMapping(reg);
            }
        }
        
        return allocation;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmRegisterAllocator };
}
