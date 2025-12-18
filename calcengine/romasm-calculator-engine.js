/**
 * Romasm Calculator Engine
 * 
 * A complete calculator engine that performs ALL operations in Romasm assembly.
 * Supports: Function mode, Polar mode, Parametric mode, Sequence mode
 */

class RomasmCalculatorEngine {
    constructor() {
        this.assembler = new RomasmAssembler();
        this.mathEngine = new RomasmMathEngine();
        this.linker = new RomasmLinker();
        this.stdlibLoaded = false;
        
        // Calculator state
        this.mode = 'function'; // 'function', 'polar', 'parametric', 'sequence'
        this.angleMode = 'degree'; // 'degree' or 'radian'
        
        // Graph settings
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.stepSize = 0.1;
        
        // Polar window settings (for polar mode)
        this.thetaMin = 0;
        this.thetaMax = 2 * Math.PI; // 2π radians (6.283185307...)
        this.thetaStep = 0.13; // Default step size for polar plots
        
        // Function storage (for Y= editor)
        this.functions = {
            Y1: null,
            Y2: null,
            Y3: null,
            Y4: null,
            Y5: null,
            Y6: null,
            Y7: null,
            Y8: null
        };
        
        // Compiled function cache
        this.compiledFunctions = {};
    }
    
    /**
     * Set calculator mode
     */
    setMode(mode) {
        if (['function', 'polar', 'parametric', 'sequence'].includes(mode)) {
            this.mode = mode;
            return true;
        }
        return false;
    }
    
    /**
     * Set angle mode (degree/radian)
     */
    setAngleMode(mode) {
        if (['degree', 'radian'].includes(mode)) {
            this.angleMode = mode;
            return true;
        }
        return false;
    }
    
    /**
     * Set graph window
     */
    setWindow(xMin, xMax, yMin, yMax, xStep = null, yStep = null) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        if (xStep !== null) this.stepSize = xStep;
    }
    
    /**
     * Set polar window settings
     */
    setPolarWindow(thetaMin, thetaMax, thetaStep) {
        this.thetaMin = thetaMin;
        this.thetaMax = thetaMax;
        this.thetaStep = thetaStep;
    }
    
    /**
     * Define a function (Y1, Y2, etc.)
     * @param {string} name - Function name (Y1, Y2, etc.)
     * @param {string} romasmCode - Romasm assembly code for the function
     * @param {Array} requiredStdlib - List of stdlib functions needed (e.g., ['sin', 'cos'])
     */
    async defineFunction(name, romasmCode, requiredStdlib = []) {
        if (!name.match(/^Y[1-8]$/)) {
            throw new Error('Invalid function name. Use Y1-Y8');
        }
        
        // Load stdlib if needed
        if (requiredStdlib.length > 0 && !this.stdlibLoaded) {
            await this.linker.loadStdlibFunctions();
            this.stdlibLoaded = true;
        }
        
        // Compile the user function
        const userResult = this.assembler.assemble(romasmCode);
        if (!userResult.success) {
            throw new Error(`Assembly failed: ${userResult.errors.map(e => e.message).join(', ')}`);
        }
        
        // Link with stdlib if needed
        let finalInstructions = userResult.instructions;
        if (requiredStdlib.length > 0) {
            const linked = await this.linker.link(userResult.instructions, requiredStdlib);
            finalInstructions = linked.instructions;
        }
        
        this.functions[name] = romasmCode;
        this.compiledFunctions[name] = finalInstructions;
        
        return true;
    }
    
    /**
     * Evaluate a function at a point (in Romasm)
     * @param {string} funcName - Function name (Y1, Y2, etc.)
     * @param {number} x - Input value
     * @returns {number} Function value
     */
    evaluateFunction(funcName, x) {
        if (!this.compiledFunctions[funcName]) {
            throw new Error(`Function ${funcName} not defined`);
        }
        
        const vm = new RomasmVM();
        const scaledX = Math.floor(x * 100); // Scale by 100
        vm.registers['I'] = scaledX; // R0 = x
        
        vm.loadProgram(this.compiledFunctions[funcName]);
        
        let steps = 0;
        while (!vm.halted && steps < 10000) {
            const stepResult = vm.step();
            if (stepResult.error) {
                throw new Error(`Execution error: ${stepResult.error}`);
            }
            steps++;
        }
        
        if (vm.halted) {
            const result = vm.registers['I'] / 100.0; // Unscale
            return result;
        } else {
            throw new Error('Function execution timeout');
        }
    }
    
    /**
     * Plot function mode: y = f(x)
     * Returns array of {x, y} points
     */
    plotFunction(funcName) {
        if (!this.compiledFunctions[funcName]) {
            throw new Error(`Function ${funcName} not defined`);
        }
        
        const points = [];
        const step = (this.xMax - this.xMin) / ((this.xMax - this.xMin) / this.stepSize);
        
        for (let x = this.xMin; x <= this.xMax; x += this.stepSize) {
            try {
                const y = this.evaluateFunction(funcName, x);
                if (isFinite(y) && !isNaN(y) && y >= this.yMin - 10 && y <= this.yMax + 10) {
                    points.push({ x, y });
                }
            } catch (error) {
                // Skip this point
                continue;
            }
        }
        
        return points;
    }
    
    /**
     * Plot polar mode: r = f(θ)
     * Returns array of {x, y} points (converted from polar)
     */
    plotPolar(funcName) {
        if (!this.compiledFunctions[funcName]) {
            throw new Error(`Function ${funcName} not defined`);
        }
        
        const points = [];
        // Use polar window settings
        const thetaStart = this.angleMode === 'degree' ? 
            (this.thetaMin * 180 / Math.PI) : this.thetaMin;
        const thetaEnd = this.angleMode === 'degree' ? 
            (this.thetaMax * 180 / Math.PI) : this.thetaMax;
        const stepSize = this.angleMode === 'degree' ? 
            Math.min(this.thetaStep * 180 / Math.PI, 1.0) : 
            Math.min(this.thetaStep, 0.017); // Max 1° or ~0.017 rad
        
        // First pass: calculate r values
        const rValues = [];
        let maxR = 0;
        
        for (let theta = thetaStart; theta <= thetaEnd; theta += stepSize) {
            const vm = new RomasmVM();
            const scaledTheta = Math.floor(theta * (this.angleMode === 'degree' ? 100 : 1000));
            vm.registers['I'] = scaledTheta;
            vm.loadProgram(this.compiledFunctions[funcName]);
            
            try {
                let steps = 0;
                while (!vm.halted && steps < 1000) {
                    const stepResult = vm.step();
                    if (stepResult.error) break;
                    steps++;
                }
                
                const rScaled = vm.registers['I'];
                const r = rScaled / 100.0;
                
                if (isFinite(r) && !isNaN(r)) {
                    maxR = Math.max(maxR, Math.abs(r));
                    rValues.push({ theta, r });
                }
            } catch (error) {
                continue;
            }
        }
        
        // Auto-adjust bounds
        if (maxR > 0) {
            const range = maxR * 1.2;
            this.xMin = -range;
            this.xMax = range;
            this.yMin = -range;
            this.yMax = range;
        }
        
        // Second pass: convert to Cartesian using Romasm
        for (const { theta, r } of rValues) {
            // Handle negative r
            let actualTheta = theta;
            let actualR = r;
            if (r < 0) {
                actualTheta = theta + (this.angleMode === 'degree' ? 180 : Math.PI);
                actualR = Math.abs(r);
                // Normalize
                if (this.angleMode === 'degree') {
                    while (actualTheta >= 360) actualTheta -= 360;
                    while (actualTheta < 0) actualTheta += 360;
                } else {
                    while (actualTheta >= 2 * Math.PI) actualTheta -= 2 * Math.PI;
                    while (actualTheta < 0) actualTheta += 2 * Math.PI;
                }
            }
            
            // Convert using Romasm math engine
            const scaledR = Math.floor(actualR * 100);
            const scaledTheta = Math.floor(actualTheta * (this.angleMode === 'degree' ? 100 : 1000));
            
            try {
                const result = this.mathEngine.polarToCartesian(scaledR, scaledTheta);
                const x = result.x / 100.0;
                const y = result.y / 100.0;
                
                if (isFinite(x) && isFinite(y) && !isNaN(x) && !isNaN(y)) {
                    points.push({ x, y, theta: actualTheta });
                }
            } catch (error) {
                continue;
            }
        }
        
        // Sort by theta for proper line connection
        points.sort((a, b) => (a.theta || 0) - (b.theta || 0));
        
        return points.map(p => ({ x: p.x, y: p.y }));
    }
    
    /**
     * Plot parametric mode: x = f(t), y = g(t)
     * @param {string} xFuncName - Function for x (X1, X2, etc.)
     * @param {string} yFuncName - Function for y (Y1, Y2, etc.)
     */
    plotParametric(xFuncName, yFuncName) {
        // TODO: Implement parametric mode
        throw new Error('Parametric mode not yet implemented');
    }
    
    /**
     * Plot sequence mode: u_n = f(n) or u_n = f(u_{n-1})
     */
    plotSequence(funcName, initialValue = 0) {
        // TODO: Implement sequence mode
        throw new Error('Sequence mode not yet implemented');
    }
    
    /**
     * Get points for current mode
     */
    getPlotPoints(funcName, xFuncName = null, yFuncName = null) {
        switch (this.mode) {
            case 'function':
                return this.plotFunction(funcName);
            case 'polar':
                return this.plotPolar(funcName);
            case 'parametric':
                return this.plotParametric(xFuncName, yFuncName);
            case 'sequence':
                return this.plotSequence(funcName);
            default:
                throw new Error(`Unknown mode: ${this.mode}`);
        }
    }
}

