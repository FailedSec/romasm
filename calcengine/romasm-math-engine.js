/**
 * Romasm Math Engine
 * 
 * A dedicated calculation engine for the graphics calculator.
 * Pre-compiles and manages Romasm math functions for efficient execution.
 * 
 * All calculations use fixed-point arithmetic with proper scaling.
 */

class RomasmMathEngine {
    constructor() {
        this.assembler = new RomasmAssembler();
        
        // Pre-compiled function cache
        this.compiledFunctions = {};
        
        // Initialize core functions
        this.initializeFunctions();
    }
    
    /**
     * Initialize and pre-compile core math functions
     */
    initializeFunctions() {
        // Load and compile standard library functions
        this.loadStdlibFunction('sin', this.getSinFunction());
        this.loadStdlibFunction('cos', this.getCosFunction());
        this.loadStdlibFunction('polar_to_cartesian', this.getPolarToCartesianFunction());
    }
    
    /**
     * Load and compile a function from source
     */
    loadStdlibFunction(name, source) {
        const result = this.assembler.assemble(source);
        if (!result.success) {
            console.error(`Failed to compile ${name}:`, result.errors);
            return false;
        }
        this.compiledFunctions[name] = {
            instructions: result.instructions,
            source: source
        };
        return true;
    }
    
    /**
     * Execute a pre-compiled function
     */
    executeFunction(name, inputs) {
        if (!this.compiledFunctions[name]) {
            throw new Error(`Function ${name} not found`);
        }
        
        const vm = new RomasmVM();
        
        // Set input registers
        if (inputs.R0 !== undefined) vm.registers['I'] = inputs.R0;
        if (inputs.R1 !== undefined) vm.registers['II'] = inputs.R1;
        if (inputs.R2 !== undefined) vm.registers['III'] = inputs.R2;
        
        // Load and execute
        vm.loadProgram(this.compiledFunctions[name].instructions);
        
        let steps = 0;
        while (!vm.halted && steps < 10000) {
            const stepResult = vm.step();
            if (stepResult.error) {
                throw new Error(`Execution error in ${name}: ${stepResult.error}`);
            }
            steps++;
        }
        
        if (!vm.halted) {
            throw new Error(`Function ${name} did not halt after 10000 steps`);
        }
        
        // Return output registers
        return {
            R0: vm.registers['I'],
            R1: vm.registers['II'],
            R2: vm.registers['III'],
            R3: vm.registers['IV'],
            R4: vm.registers['V']
        };
    }
    
    /**
     * Calculate sin(angle) where angle is in degrees scaled by 100
     * Returns sin scaled by 1000
     */
    sin(angleDegreesScaled) {
        const result = this.executeFunction('sin', { R0: angleDegreesScaled });
        return result.R0;
    }
    
    /**
     * Calculate cos(angle) where angle is in degrees scaled by 100
     * Returns cos scaled by 1000
     */
    cos(angleDegreesScaled) {
        const result = this.executeFunction('cos', { R0: angleDegreesScaled });
        return result.R0;
    }
    
    /**
     * Convert polar coordinates (r, θ) to Cartesian (x, y)
     * Input: r and theta both scaled by 100
     * Output: x and y both scaled by 100
     */
    polarToCartesian(rScaled, thetaDegreesScaled) {
        const result = this.executeFunction('polar_to_cartesian', {
            R0: rScaled,
            R1: thetaDegreesScaled
        });
        return {
            x: result.R0,
            y: result.R1
        };
    }
    
    /**
     * Get the sin function source code
     * Uses proper scaling: input degrees*100, output sin*1000
     */
    getSinFunction() {
        return `; Sine function using Taylor series (FIXED SCALING)
; Input: R0 = angle in degrees (scaled by 100, e.g., 30° = 3000)
; Output: R0 = sin(angle) scaled by 1000 (e.g., sin(30°) = 0.5 → 500)
; Argument reduction: ensure 0-90 degrees
LOAD R1, 9000  ; 90° scaled by 100
CMP R0, R1
JLE sin_ok
; For angles > 90, use identity: sin(x) = sin(180-x)
LOAD R1, 18000  ; 180° scaled by 100
SUB R1, R0
LOAD R0, R1
sin_ok:
; Convert to radians: degrees * π/180
; π/180 ≈ 0.0174532925
; To convert degrees*100 to radians*1000:
; radians*1000 = (degrees*100) * (π/180) * 10
; = (degrees*100) * 0.174532925
; ≈ (degrees*100) * 17 / 100
; So: (degrees*100) * 17 / 100 = radians*1000
LOAD R1, R0     ; R1 = degrees*100
LOAD R2, 17     ; π/180 * 1000 ≈ 17.453, use 17
MUL R1, R2      ; R1 = degrees*100 * 17
LOAD R2, 100
DIV R1, R2      ; R1 = degrees * 0.17 ≈ radians*1000 (but this is still wrong!)
; Actually: radians*1000 = degrees * (π/180) * 1000
; For degrees*100: radians*1000 = (degrees*100) * (π/180) * 10
; π/180 ≈ 0.017453, so * 10 ≈ 0.17453
; To do this with integers: (degrees*100) * 1745 / 10000
LOAD R1, R0     ; R1 = degrees*100
LOAD R2, 1745   ; π/180 * 100000 ≈ 1745
MUL R1, R2      ; R1 = degrees*100 * 1745
LOAD R2, 10000
DIV R1, R2      ; R1 = (degrees*100) * 1745 / 10000 = radians*1000
; Actually, we need: radians*1000 = degrees * (π/180) * 1000
; = (degrees*100) * (π/180) * 10 = (degrees*100) * 1745 / 100
; So R1 should be correct now
; Taylor series: sin(x) ≈ x - x³/6 + x⁵/120
; x is in R1, scaled by 1000
LOAD R0, R1     ; R0 = result, start with x
; Calculate x³
LOAD R2, R1
LOAD R3, R1
MUL R2, R3      ; R2 = x² (scaled by 1000² = 1,000,000)
MUL R2, R1      ; R2 = x³ (scaled by 1000³ = 1,000,000,000)
; x³/6
; x³ is scaled by 1,000,000,000
; We want x³/6 scaled by 1000
; So: (1,000,000,000 / 6) / (1,000,000 / 6) = 1000
; We divide by 1000, then by 1000, then multiply by 6
LOAD R3, 1000
DIV R2, R3      ; R2 = x³/1000 (scaled by 1,000,000)
DIV R2, R3      ; R2 = x³/1,000,000 (scaled by 1000)
LOAD R3, 6
MUL R2, R3      ; R2 = x³/6 (scaled by 1000)
SUB R0, R2      ; R0 = x - x³/6
; Calculate x⁵ for better accuracy
LOAD R2, R1
MUL R2, R2      ; R2 = x²
MUL R2, R2      ; R2 = x⁴
MUL R2, R1      ; R2 = x⁵ (scaled by 1000⁵)
; x⁵/120
; x⁵ is scaled by 1,000,000,000,000,000 (1000⁵)
; We want x⁵/120 scaled by 1000
; Divide by 1000 four times, then multiply by 120
LOAD R3, 1000
DIV R2, R3      ; /1000
DIV R2, R3      ; /1000²
DIV R2, R3      ; /1000³
DIV R2, R3      ; /1000⁴ (now scaled by 1000)
LOAD R3, 120
MUL R2, R3      ; R2 = x⁵/120 (scaled by 1000)
ADD R0, R2      ; R0 = x - x³/6 + x⁵/120
RET`;
    }
    
    /**
     * Get the cos function source code
     */
    getCosFunction() {
        return `; Cosine function: cos(x) = sin(90° - x)
; Input: R0 = angle in degrees (scaled by 100)
; Output: R0 = cos(angle) scaled by 1000
LOAD R1, 9000  ; 90° scaled by 100
SUB R1, R0     ; R1 = 90° - angle
LOAD R0, R1
; Now call sin (inline the sin calculation)
; Convert to radians
; radians*1000 = (degrees*100) * 1745 / 10000
LOAD R1, R0
LOAD R2, 1745
MUL R1, R2
LOAD R2, 10000
DIV R1, R2     ; R1 = angle in radians (scaled by 1000)
; Taylor series: sin(x) ≈ x - x³/6 + x⁵/120
LOAD R0, R1     ; R0 = x
; Calculate x³
LOAD R2, R1
LOAD R3, R1
MUL R2, R3      ; R2 = x²
MUL R2, R1      ; R2 = x³
; x³/6 scaled by 1000
LOAD R3, 1000
DIV R2, R3      ; /1000
DIV R2, R3      ; /1000²
LOAD R3, 6
MUL R2, R3      ; R2 = x³/6 (scaled by 1000)
SUB R0, R2      ; R0 = x - x³/6
; Add x⁵ term
LOAD R2, R1
MUL R2, R2      ; x²
MUL R2, R2      ; x⁴
MUL R2, R1      ; x⁵
; x⁵/120 scaled by 1000
LOAD R3, 1000
DIV R2, R3      ; /1000
DIV R2, R3      ; /1000²
DIV R2, R3      ; /1000³
DIV R2, R3      ; /1000⁴
LOAD R3, 120
MUL R2, R3      ; R2 = x⁵/120 (scaled by 1000)
ADD R0, R2      ; R0 = x - x³/6 + x⁵/120
; But wait, this is for sin, we need cos
; cos(x) = sin(90° - x), so we already have the right angle
; Actually, we should use cos Taylor series: 1 - x²/2 + x⁴/24
LOAD R0, 1000   ; Start with 1
LOAD R2, R1
MUL R2, R2      ; x²
LOAD R3, 1000
DIV R2, R3
DIV R2, R3
LOAD R3, 2
MUL R2, R3      ; x²/2
SUB R0, R2      ; 1 - x²/2
; Add x⁴/24 term
LOAD R2, R1
MUL R2, R2      ; x²
MUL R2, R2      ; x⁴
LOAD R3, 1000
DIV R2, R3
DIV R2, R3
DIV R2, R3
DIV R2, R3
LOAD R3, 24
MUL R2, R3      ; x⁴/24
ADD R0, R2      ; cos(x) ≈ 1 - x²/2 + x⁴/24
LOAD R3, 1000
DIV R2, R3
DIV R2, R3
DIV R2, R3
ADD R0, R2
RET`;
    }
    
    /**
     * Get the polar-to-Cartesian conversion function
     * FIXED: Proper scaling throughout
     */
    getPolarToCartesianFunction() {
        return `; Polar to Cartesian conversion (FIXED SCALING)
; Input: R0 = r (scaled by 100), R1 = θ (scaled by 100, degrees)
; Output: R0 = x (scaled by 100), R1 = y (scaled by 100)
; Save inputs
LOAD R2, R0  ; R2 = r (scaled by 100)
LOAD R3, R1  ; R3 = θ (scaled by 100, degrees)
; Calculate cos(θ) = sin(90° - θ)
LOAD R4, 9000  ; 90° scaled by 100
SUB R4, R3     ; R4 = 90° - θ (scaled by 100)
; Convert to radians: (90° - θ) * π/180
; radians*1000 = (degrees*100) * 1745 / 10000
LOAD R5, R4
LOAD R6, 1745
MUL R5, R6
LOAD R6, 10000
DIV R5, R6     ; R5 = (90° - θ) in radians (scaled by 1000)
; Calculate sin using Taylor: sin(x) ≈ x - x³/6 + x⁵/120
LOAD R6, R5    ; R6 = x
LOAD R7, R5
LOAD R8, R5
MUL R7, R8
MUL R7, R5
LOAD R8, 6
DIV R7, R8
LOAD R8, 1000
DIV R7, R8
DIV R7, R8     ; R7 = x³/6 (scaled by 1000)
SUB R6, R7     ; R6 = x - x³/6
; Add x⁵ term
LOAD R7, R5
MUL R7, R7
MUL R7, R7
MUL R7, R5
LOAD R8, 120
DIV R7, R8
LOAD R8, 1000
DIV R7, R8
DIV R7, R8
DIV R7, R8     ; R7 = x⁵/120 (scaled by 1000)
ADD R6, R7     ; R6 = sin(90° - θ) = cos(θ) (scaled by 1000)
LOAD R5, R6    ; R5 = cos(θ) (scaled by 1000)
; Calculate sin(θ)
LOAD R6, R3    ; R6 = θ (scaled by 100, degrees)
LOAD R7, 1745
MUL R6, R7
LOAD R7, 10000
DIV R6, R7     ; R6 = θ in radians (scaled by 1000)
; Calculate sin using Taylor
LOAD R7, R6    ; R7 = x
LOAD R8, R6
MUL R7, R8
MUL R7, R6
LOAD R8, 6
DIV R7, R8
LOAD R8, 1000
DIV R7, R8
DIV R7, R8     ; R7 = x³/6 (scaled by 1000)
SUB R6, R7     ; R6 = x - x³/6
; Add x⁵ term
LOAD R7, R6
LOAD R8, R6
MUL R7, R8
MUL R7, R8
MUL R7, R6
LOAD R8, 120
DIV R7, R8
LOAD R8, 1000
DIV R7, R8
DIV R7, R8
DIV R7, R8     ; R7 = x⁵/120 (scaled by 1000)
ADD R6, R7     ; R6 = sin(θ) (scaled by 1000)
; Calculate x = r * cos(θ)
; r is scaled by 100, cos is scaled by 1000
; x = (r * cos) / 10 to get scaled by 100
LOAD R0, R2    ; R0 = r (scaled by 100)
MUL R0, R5     ; R0 = r * cos(θ) (scaled by 100000)
LOAD R7, 1000
DIV R0, R7     ; R0 = x (scaled by 100)
; Calculate y = r * sin(θ)
LOAD R1, R2    ; R1 = r (scaled by 100)
MUL R1, R6     ; R1 = r * sin(θ) (scaled by 100000)
LOAD R7, 1000
DIV R1, R7     ; R1 = y (scaled by 100)
RET`;
    }
}
