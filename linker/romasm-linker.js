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
     * @param {string} filename - Name of the stdlib file
     * @param {boolean} forceReload - If true, bypass cache and reload
     */
    async loadStdlibFile(filename, forceReload = false) {
        if (!forceReload && this.stdlibCache[filename]) {
            return this.stdlibCache[filename];
        }
        
        try {
            // Add cache-busting query parameter to force reload
            const url = forceReload ? `stdlib/${filename}?t=${Date.now()}` : `stdlib/${filename}`;
            const response = await fetch(url);
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
     * Assemble stdlib source and extract function entry points
     * Uses the assembler's built-in label resolution (more accurate than manual parsing)
     */
    assembleStdlib(source) {
        const result = this.assembler.assemble(source);
        if (!result.success) {
            console.error('Failed to assemble stdlib:', result.errors);
            if (result.errors && result.errors.length > 0) {
                console.error('Assembly errors:', result.errors);
            }
            return null;
        }
        
        // Use the assembler's label map - it's already correctly resolved!
        // The assembler does a two-pass assembly:
        // 1. First pass: collects all labels and their instruction addresses
        // 2. Second pass: assembles instructions
        // So result.labels is the authoritative source of truth
        const labels = result.labels || {};
        
        return {
            instructions: result.instructions,
            labels: labels,
            source: source
        };
    }
    
    /**
     * Load and prepare stdlib functions
     * @param {boolean} forceReload - If true, force reload all stdlib files (bypass cache)
     */
    async loadStdlibFunctions(forceReload = false) {
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
        
        // Clear cache if forcing reload
        if (forceReload) {
            this.stdlibCache = {};
            this.functionLabels = {};
        }
        
        for (const filename of stdlibFiles) {
            const source = await this.loadStdlibFile(filename, forceReload);
            if (!source) continue;
            
            const assembled = this.assembleStdlib(source);
            if (!assembled) continue;
            
            // Map function labels to their offsets
            for (const [label, localOffset] of Object.entries(assembled.labels)) {
                this.functionLabels[label] = offset + localOffset;
            }
            
            // Debug: Log labels found in this file
            if (filename === 'trig.romasm') {
                console.log(`[Linker] Labels found in ${filename}:`, Object.keys(assembled.labels).sort());
                console.log(`[Linker] Total labels: ${Object.keys(assembled.labels).length}, Total instructions: ${assembled.instructions.length}`);
                if (assembled.labels['sin_fast'] !== undefined) {
                    console.log(`✓ sin_fast found at local offset ${assembled.labels['sin_fast']}, global offset ${offset + assembled.labels['sin_fast']}`);
                } else {
                    console.warn(`✗ sin_fast NOT found in ${filename} labels!`);
                    console.warn(`Available labels starting with 'sin':`, Object.keys(assembled.labels).filter(l => l.startsWith('sin')));
                }
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
    async link(userInstructions, requiredFunctions = [], forceReload = false) {
        // Load stdlib if not already loaded, or if forceReload is true
        if (forceReload || Object.keys(this.functionLabels).length === 0) {
            await this.loadStdlibFunctions(forceReload);
        }
        
        // Build combined instruction array
        const linkedInstructions = [];
        
        // First, add stdlib instructions
        const stdlibResult = await this.loadStdlibFunctions(forceReload);
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
                        console.error(`Function ${funcName} not found in stdlib`);
                        console.error(`Available functions:`, Object.keys(this.functionLabels));
                        // Don't fail silently - this could cause infinite loops!
                        throw new Error(`Function ${funcName} not found in stdlib. Available: ${Object.keys(this.functionLabels).join(', ')}`);
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

