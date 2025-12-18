/**
 * Romasm Linker
 * 
 * Links user code with standard library functions from /stdlib/
 * Loads .romasm files and makes their functions callable via CALL instruction
 */

class RomasmLinker {
    constructor() {
        this.assembler = new RomasmAssembler();
        this.stdlibCache = {};
        this.functionLabels = {}; // Maps function name -> instruction offset
    }
    
    /**
     * Load a stdlib file (async, fetches from server)
     */
    async loadStdlibFile(filename) {
        if (this.stdlibCache[filename]) {
            return this.stdlibCache[filename];
        }
        
        try {
            const response = await fetch(`stdlib/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }
            const source = await response.text();
            this.stdlibCache[filename] = source;
            return source;
        } catch (error) {
            console.error(`Error loading stdlib file ${filename}:`, error);
            return null;
        }
    }
    
    /**
     * Parse function labels from Romasm source
     * Finds lines like "sin:" or "cos:" and extracts the label name
     */
    parseFunctionLabels(source) {
        const labels = {};
        const lines = source.split('\n');
        let instructionCount = 0;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith(';')) {
                continue;
            }
            
            // Check for label (ends with colon, not a comment)
            if (trimmed.endsWith(':') && !trimmed.startsWith(';')) {
                const label = trimmed.slice(0, -1).trim();
                labels[label] = instructionCount;
            } else {
                // This is an instruction (or data)
                // Count it if it's not just a comment
                const withoutComment = trimmed.split(';')[0].trim();
                if (withoutComment) {
                    instructionCount++;
                }
            }
        }
        
        return labels;
    }
    
    /**
     * Assemble stdlib source and extract function entry points
     */
    assembleStdlib(source) {
        const result = this.assembler.assemble(source);
        if (!result.success) {
            console.error('Failed to assemble stdlib:', result.errors);
            return null;
        }
        
        // Parse labels to find function entry points
        const labels = this.parseFunctionLabels(source);
        
        return {
            instructions: result.instructions,
            labels: labels,
            source: source
        };
    }
    
    /**
     * Load and prepare stdlib functions
     */
    async loadStdlibFunctions() {
        const stdlibFiles = [
            'trig.romasm',
            'math.romasm',
            'sine-taylor.romasm',
            'calculus.romasm',
            'binary.romasm',
            'advanced-math.romasm'
        ];
        
        const allInstructions = [];
        let offset = 0;
        
        for (const filename of stdlibFiles) {
            const source = await this.loadStdlibFile(filename);
            if (!source) continue;
            
            const assembled = this.assembleStdlib(source);
            if (!assembled) continue;
            
            // Map function labels to their offsets
            for (const [label, localOffset] of Object.entries(assembled.labels)) {
                this.functionLabels[label] = offset + localOffset;
            }
            
            // Add instructions to combined program
            allInstructions.push(...assembled.instructions);
            offset += assembled.instructions.length;
        }
        
        return {
            instructions: allInstructions,
            functionLabels: this.functionLabels,
            stdlibSize: offset
        };
    }
    
    /**
     * Link user code with stdlib
     * @param {Array} userInstructions - Compiled user instructions
     * @param {Array} requiredFunctions - List of function names needed (e.g., ['sin', 'cos'])
     * @returns {Object} Linked program with instructions and function map
     */
    async link(userInstructions, requiredFunctions = []) {
        // Load stdlib if not already loaded
        if (Object.keys(this.functionLabels).length === 0) {
            await this.loadStdlibFunctions();
        }
        
        // Build combined instruction array
        const linkedInstructions = [];
        
        // First, add stdlib instructions
        const stdlibResult = await this.loadStdlibFunctions();
        linkedInstructions.push(...stdlibResult.instructions);
        const stdlibSize = stdlibResult.instructions.length;
        
        // Then add user code, resolving CALL instructions
        const resolvedUserInstructions = userInstructions.map((instr, idx) => {
            // If this is a CALL instruction, resolve the label
            if (instr.opcode === 'CA' && instr.operands.length > 0) {
                const operand = instr.operands[0];
                // Check if operand has labelName (unresolved label)
                if (operand.labelName) {
                    const funcName = operand.labelName;
                    if (this.functionLabels[funcName] !== undefined) {
                        // Resolve to actual address
                        return {
                            ...instr,
                            operands: [{
                                ...operand,
                                value: this.functionLabels[funcName],
                                labelName: undefined // Clear labelName since it's resolved
                            }]
                        };
                    } else {
                        console.warn(`Function ${funcName} not found in stdlib`);
                    }
                }
            }
            return instr;
        });
        
        linkedInstructions.push(...resolvedUserInstructions);
        
        // Create function map for reference
        const functionMap = {};
        for (const funcName of requiredFunctions) {
            if (this.functionLabels[funcName] !== undefined) {
                functionMap[funcName] = this.functionLabels[funcName];
            }
        }
        
        return {
            instructions: linkedInstructions,
            functionMap: functionMap,
            stdlibSize: stdlibSize,
            userCodeStart: stdlibSize
        };
    }
    
    /**
     * Resolve CALL instruction to actual address
     * This should be called during assembly or linking
     */
    resolveCall(functionName) {
        if (this.functionLabels[functionName] !== undefined) {
            return this.functionLabels[functionName];
        }
        throw new Error(`Function ${functionName} not found in stdlib`);
    }
}

