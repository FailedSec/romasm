/**
 * Romasm Optimizer
 * 
 * Optimizes generated x86 assembly for better performance:
 * - Peephole optimization (remove redundant MOVs)
 * - Register allocation improvements
 * - Constant folding
 * - Dead code elimination
 */

class RomasmOptimizer {
    constructor() {
        this.optimizationsEnabled = {
            peephole: true,
            constantFolding: true,
            deadCodeElimination: true,
            registerAllocation: true
        };
    }

    /**
     * Optimize x86 assembly code
     * @param {string} assembly - Generated x86 assembly
     * @returns {string} Optimized assembly
     */
    optimize(assembly) {
        let optimized = assembly;

        if (this.optimizationsEnabled.peephole) {
            optimized = this.peepholeOptimize(optimized);
        }

        if (this.optimizationsEnabled.constantFolding) {
            optimized = this.constantFold(optimized);
        }

        if (this.optimizationsEnabled.deadCodeElimination) {
            optimized = this.eliminateDeadCode(optimized);
        }

        return optimized;
    }

    /**
     * Peephole optimization: Remove redundant instructions
     * Examples:
     * - MOV AX, AX → (remove)
     * - MOV AX, 0; XOR AX, AX → XOR AX, AX
     * - MOV AX, BX; MOV BX, AX → MOV AX, BX (if BX not used between)
     */
    peepholeOptimize(assembly) {
        const lines = assembly.split('\n');
        const optimized = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and labels
            if (!line || line.endsWith(':')) {
                optimized.push(lines[i]);
                continue;
            }
            
            // Match MOV instructions
            const movMatch = line.match(/^\s*MOV\s+(\w+),\s*(\w+|\d+|0x[0-9a-f]+)\s*$/i);
            
            if (movMatch) {
                const [, dest, src] = movMatch;
                
                // Pattern 1: MOV AX, AX (redundant)
                if (dest === src) {
                    continue; // Skip this line
                }
                
                // Pattern 2: MOV AX, 0 followed by XOR AX, AX
                if (src === '0' || src === '0x0') {
                    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
                    if (nextLine.match(new RegExp(`^\\s*XOR\\s+${dest},\\s+${dest}\\s*$`, 'i'))) {
                        // Keep XOR, skip MOV
                        continue;
                    }
                    // Optimize: Convert MOV AX, 0 to XOR AX, AX (smaller, faster)
                    optimized.push(lines[i].replace(/MOV\s+(\w+),\s*0x?0?/i, 'XOR $1, $1'));
                    continue;
                }
                
                // Pattern 3: MOV AX, BX; MOV BX, AX (swap) - can sometimes be optimized
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    const nextMovMatch = nextLine.match(/^\s*MOV\s+(\w+),\s*(\w+)\s*$/i);
                    
                    if (nextMovMatch && nextMovMatch[1] === src && nextMovMatch[2] === dest) {
                        // Check if dest is used between these two MOVs
                        // For now, keep both (could be improved with register tracking)
                    }
                }
            }
            
            // Check for redundant register operations
            // MOV AX, value; MOV AX, value (same value loaded twice)
            if (movMatch && i > 0) {
                const prevLine = lines[i - 1].trim();
                const prevMovMatch = prevLine.match(/^\s*MOV\s+(\w+),\s*(.+)\s*$/i);
                
                if (prevMovMatch && prevMovMatch[1] === movMatch[1] && prevMovMatch[2] === movMatch[2]) {
                    // Same register, same value - skip second MOV
                    continue;
                }
            }
            
            optimized.push(lines[i]);
        }
        
        return optimized.join('\n');
    }

    /**
     * Constant folding: Precompute constant expressions at compile time
     * Examples:
     * - MOV AX, 5; ADD AX, 3 → MOV AX, 8
     * - MOV AX, 10; SUB AX, 2 → MOV AX, 8
     */
    constantFold(assembly) {
        const lines = assembly.split('\n');
        const optimized = [];
        const registerValues = {}; // Track register values (when they're constants)
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and labels
            if (!line || line.endsWith(':')) {
                optimized.push(lines[i]);
                continue;
            }
            
            // Track MOV with immediate values
            const movMatch = line.match(/^\s*MOV\s+(\w+),\s*(\d+|0x[0-9a-f]+)\s*$/i);
            if (movMatch) {
                const [, reg, value] = movMatch;
                const numValue = value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10);
                registerValues[reg] = numValue;
                optimized.push(lines[i]);
                continue;
            }
            
            // Check for ADD with constant
            const addMatch = line.match(/^\s*ADD\s+(\w+),\s*(\d+|0x[0-9a-f]+)\s*$/i);
            if (addMatch) {
                const [, reg, value] = addMatch;
                const numValue = value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10);
                
                if (registerValues[reg] !== undefined) {
                    // We know the register's value - fold it
                    const newValue = registerValues[reg] + numValue;
                    optimized.push(`    MOV ${reg}, ${newValue}`);
                    registerValues[reg] = newValue;
                    continue;
                }
            }
            
            // Check for SUB with constant
            const subMatch = line.match(/^\s*SUB\s+(\w+),\s*(\d+|0x[0-9a-f]+)\s*$/i);
            if (subMatch) {
                const [, reg, value] = subMatch;
                const numValue = value.startsWith('0x') ? parseInt(value, 16) : parseInt(value, 10);
                
                if (registerValues[reg] !== undefined) {
                    const newValue = registerValues[reg] - numValue;
                    optimized.push(`    MOV ${reg}, ${newValue}`);
                    registerValues[reg] = newValue;
                    continue;
                }
            }
            
            // If register is modified by unknown instruction, clear its known value
            const regModMatch = line.match(/^\s*(ADD|SUB|MUL|DIV|XOR|OR|AND|INC|DEC|CALL|POP)\s+(\w+)/i);
            if (regModMatch && !movMatch && !addMatch && !subMatch) {
                const [, op, reg] = regModMatch;
                // Clear known value if it's not a constant operation we handle
                if (op !== 'MOV') {
                    delete registerValues[reg];
                }
            }
            
            // Clear register value on CALL (function call might modify it)
            const callMatch = line.match(/^\s*CALL\s+/i);
            if (callMatch) {
                // Clear all caller-saved registers (AX, CX, DX in 16-bit)
                delete registerValues['AX'];
                delete registerValues['CX'];
                delete registerValues['DX'];
            }
            
            optimized.push(lines[i]);
        }
        
        return optimized.join('\n');
    }

    /**
     * Dead code elimination: Remove unreachable code
     * - Code after HLT
     * - Code after unconditional JMP (if no labels reference it)
     */
    eliminateDeadCode(assembly) {
        const lines = assembly.split('\n');
        const optimized = [];
        const labels = new Set();
        const labelReferences = new Set();
        
        // First pass: collect all labels
        for (const line of lines) {
            const labelMatch = line.match(/^(\w+):/);
            if (labelMatch) {
                labels.add(labelMatch[1]);
            }
            
            // Find label references (in JMP, CALL, etc.)
            const refMatch = line.match(/(JMP|CALL|JE|JNE|JL|JG|JLE|JGE)\s+(\w+)/i);
            if (refMatch) {
                labelReferences.add(refMatch[2]);
            }
        }
        
        let deadCode = false;
        
        // Second pass: eliminate dead code
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for HLT
            if (line.match(/^\s*HLT\s*$/i)) {
                optimized.push(lines[i]);
                // Mark code after HLT as dead (unless there's a label)
                deadCode = true;
                continue;
            }
            
            // Check for unconditional JMP
            const jmpMatch = line.match(/^\s*JMP\s+(\w+)\s*$/i);
            if (jmpMatch && !jmpMatch[1].match(/^\d+$/)) {
                // Unconditional jump to label
                optimized.push(lines[i]);
                deadCode = true;
                continue;
            }
            
            // If we hit a label that's referenced, code is alive again
            const labelMatch = line.match(/^(\w+):/);
            if (labelMatch && (labelReferences.has(labelMatch[1]) || labelMatch[1] === 'start')) {
                deadCode = false;
                optimized.push(lines[i]);
                continue;
            }
            
            // Skip dead code
            if (deadCode && !line.endsWith(':')) {
                continue;
            }
            
            optimized.push(lines[i]);
        }
        
        return optimized.join('\n');
    }

    /**
     * Optimize register allocation (future enhancement)
     * This would require more sophisticated analysis
     */
    optimizeRegisterAllocation(instructions) {
        // TODO: Implement smarter register allocation
        // - Track register liveness
        // - Reuse registers when possible
        // - Reduce register spills
        return instructions;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RomasmOptimizer };
}
