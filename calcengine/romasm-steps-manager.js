/**
 * Romasm Steps Manager
 * 
 * Intelligent step limit management for Romasm VM execution.
 * Handles different script types with appropriate limits and execution strategies.
 */

class RomasmStepsManager {
    constructor() {
        // Default limits for different script types
        this.limits = {
            // Regular scripts - safety limit to prevent infinite loops
            regular: 10000,
            
            // Plotting scripts - need more steps for loops
            plotting: 1000000, // 1 million steps
            
            // Plotting with trig functions - very computationally expensive
            plottingTrig: 5000000, // 5 million steps
            
            // Interactive/real-time scripts - can run longer
            interactive: 500000,
            
            // No limit (use with caution - only for trusted scripts)
            unlimited: Infinity
        };
        
        // Chunk sizes for chunked execution
        this.chunkSizes = {
            regular: 10000,
            plotting: 50000,
            plottingTrig: 100000,
            interactive: 25000
        };
        
        // Execution strategies
        this.strategies = {
            immediate: 'immediate',      // Execute all at once
            chunked: 'chunked',          // Execute in chunks with yields
            background: 'background'     // Execute in Web Worker (future)
        };
    }
    
    /**
     * Analyze a script and determine its type and execution strategy
     * @param {string} code - Romasm assembly code
     * @returns {Object} Analysis result with type, strategy, and limits
     */
    analyzeScript(code) {
        const codeUpper = code.toUpperCase();
        
        // Check for plotting patterns
        const hasPrintInLoop = codeUpper.includes('PRINT') && 
                              (codeUpper.includes('LOOP') || 
                               codeUpper.includes('JMP') || 
                               codeUpper.includes('JLE') || 
                               codeUpper.includes('JLT') || 
                               codeUpper.includes('JGT') ||
                               codeUpper.includes('JGE'));
        
        // Check for trigonometric functions (including fast versions)
        const usesTrig = codeUpper.includes('CALL SIN') || 
                        codeUpper.includes('CALL SIN_FAST') ||
                        codeUpper.includes('CALL COS') || 
                        codeUpper.includes('CALL TAN');
        
        // Check for drawing opcodes
        const hasDrawing = ['MOV', 'DRW', 'STR', 'CLR'].some(op => codeUpper.includes(op));
        
        // Determine script type
        let scriptType = 'regular';
        let strategy = this.strategies.immediate;
        let maxSteps = this.limits.regular;
        let chunkSize = this.chunkSizes.regular;
        
        if (hasPrintInLoop || hasDrawing) {
            // This is a plotting/visualization script
            scriptType = usesTrig ? 'plottingTrig' : 'plotting';
            strategy = this.strategies.chunked;
            maxSteps = usesTrig ? this.limits.plottingTrig : this.limits.plotting;
            chunkSize = usesTrig ? this.chunkSizes.plottingTrig : this.chunkSizes.plotting;
        } else if (codeUpper.includes('INTERACTIVE') || codeUpper.includes('REALTIME')) {
            // Interactive script
            scriptType = 'interactive';
            strategy = this.strategies.chunked;
            maxSteps = this.limits.interactive;
            chunkSize = this.chunkSizes.interactive;
        }
        
        return {
            type: scriptType,
            strategy: strategy,
            maxSteps: maxSteps,
            chunkSize: chunkSize,
            usesTrig: usesTrig,
            hasDrawing: hasDrawing,
            isPlotting: hasPrintInLoop || hasDrawing
        };
    }
    
    /**
     * Execute a script with appropriate step management
     * @param {RomasmVM} vm - The virtual machine instance
     * @param {string} code - Romasm assembly code
     * @param {Function} onProgress - Optional callback for progress updates
     * @returns {Promise<Object>} Execution result
     */
    async execute(vm, code, onProgress = null) {
        const analysis = this.analyzeScript(code);
        const result = {
            success: false,
            steps: 0,
            output: [],
            error: null,
            analysis: analysis
        };
        
        if (analysis.strategy === this.strategies.chunked) {
            return await this.executeChunked(vm, analysis, onProgress);
        } else {
            return await this.executeImmediate(vm, analysis, onProgress);
        }
    }
    
    /**
     * Execute script immediately (for short scripts)
     */
    async executeImmediate(vm, analysis, onProgress) {
        let steps = 0;
        const result = {
            success: false,
            steps: 0,
            output: [],
            error: null
        };
        
        while (!vm.halted && steps < analysis.maxSteps) {
            const stepResult = vm.step();
            
            if (stepResult.error) {
                result.error = stepResult.error;
                break;
            }
            
            steps++;
            result.steps = steps;
            
            if (onProgress && steps % 1000 === 0) {
                onProgress({ steps, total: analysis.maxSteps, percent: (steps / analysis.maxSteps) * 100 });
            }
        }
        
        result.success = vm.halted;
        result.output = [...vm.output];
        
        if (!vm.halted && steps >= analysis.maxSteps) {
            result.error = `Maximum steps (${analysis.maxSteps}) exceeded`;
        }
        
        return result;
    }
    
    /**
     * Execute script in chunks (for long-running scripts)
     */
    async executeChunked(vm, analysis, onProgress) {
        let totalSteps = 0;
        const result = {
            success: false,
            steps: 0,
            output: [],
            error: null,
            chunks: 0
        };
        
        while (!vm.halted && totalSteps < analysis.maxSteps) {
            // Execute one chunk
            let chunkSteps = 0;
            while (!vm.halted && chunkSteps < analysis.chunkSize && totalSteps < analysis.maxSteps) {
                const stepResult = vm.step();
                
                if (stepResult.error) {
                    result.error = stepResult.error;
                    return result;
                }
                
                chunkSteps++;
                totalSteps++;
            }
            
            result.steps = totalSteps;
            result.chunks++;
            
            // Progress callback
            if (onProgress) {
                onProgress({ 
                    steps: totalSteps, 
                    total: analysis.maxSteps, 
                    percent: (totalSteps / analysis.maxSteps) * 100,
                    chunks: result.chunks
                });
            }
            
            // Yield to browser between chunks (prevents freezing)
            if (!vm.halted && totalSteps < analysis.maxSteps) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        result.success = vm.halted;
        result.output = [...vm.output];
        
        if (!vm.halted && totalSteps >= analysis.maxSteps) {
            result.error = `Maximum steps (${analysis.maxSteps}) exceeded. Consider optimizing your script or using a larger step size.`;
        }
        
        return result;
    }
    
    /**
     * Set custom limits for a script type
     * @param {string} type - Script type ('regular', 'plotting', 'plottingTrig', etc.)
     * @param {number} limit - New step limit
     */
    setLimit(type, limit) {
        if (this.limits.hasOwnProperty(type)) {
            this.limits[type] = limit;
        }
    }
    
    /**
     * Set custom chunk size for a script type
     * @param {string} type - Script type
     * @param {number} size - New chunk size
     */
    setChunkSize(type, size) {
        if (this.chunkSizes.hasOwnProperty(type)) {
            this.chunkSizes[type] = size;
        }
    }
}

