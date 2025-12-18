/**
 * Romasm Polar Curve Engine
 * 
 * Implements polar curve plotting (r = f(θ)) entirely in Romasm assembly
 * Based on Gemini's recommendations for proper polar-to-Cartesian conversion
 */

class RomasmPolarEngine {
    constructor(assembler, mathEngine) {
        this.assembler = assembler;
        this.mathEngine = mathEngine;
    }
    
    /**
     * Generate Romasm code for a rose curve: r = a * cos(n*θ)
     * @param {number} a - Petal length/amplitude
     * @param {number} n - Petal multiplier (odd n = n petals, even n = 2n petals)
     * @returns {string} Romasm assembly code
     */
    generateRoseCurve(a, n) {
        // Input: R0 = θ (in degrees, scaled by 100)
        // Output: R0 = r (scaled by 100)
        // Formula: r = a * cos(n * θ)
        
        return `; Rose curve: r = ${a} * cos(${n} * θ)
; Input: R0 = θ (degrees, scaled by 100)
; Output: R0 = r (scaled by 100)

; Calculate n * θ
LOAD R1, ${Math.floor(n * 100)}  ; n scaled by 100
MUL R1, R0      ; R1 = n * θ (scaled by 100² = 10,000)
LOAD R2, 100
DIV R1, R2      ; R1 = n * θ (scaled by 100)

; Convert to radians and calculate cos(n*θ)
; Use math engine's cos function
; For now, we'll use a simplified approach
; cos(n*θ) where n*θ is in degrees*100
; We need to call the cos function with R1 as input
; Since we can't call functions directly, we'll inline the cos calculation

; Convert n*θ from degrees*100 to radians*1000
LOAD R2, 1745   ; π/180 * 100000 ≈ 1745
MUL R1, R2      ; R1 = (n*θ)*100 * 1745
LOAD R2, 10000
DIV R1, R2      ; R1 = n*θ in radians*1000

; Calculate cos using Taylor series (simplified)
; cos(x) ≈ 1 - x²/2 + x⁴/24
; x is in R1, scaled by 1000
LOAD R0, 1000   ; Start with 1 (scaled by 1000)
; Calculate x²
LOAD R2, R1
MUL R2, R2      ; R2 = x² (scaled by 1000² = 1,000,000)
LOAD R3, 2
DIV R2, R3      ; R2 = x²/2 (scaled by 1,000,000/2 = 500,000)
LOAD R3, 1000
DIV R2, R3
DIV R2, R3      ; R2 = x²/2 (scaled by 1000)
SUB R0, R2      ; R0 = 1 - x²/2

; Multiply by a
LOAD R1, ${Math.floor(a * 100)}  ; a scaled by 100
MUL R0, R1      ; R0 = a * cos(n*θ) (scaled by 100 * 1000 = 100,000)
LOAD R1, 1000
DIV R0, R1      ; R0 = a * cos(n*θ) (scaled by 100)
RET`;
    }
    
    /**
     * Generate Romasm code for cardioid: r = 1 + cos(θ)
     */
    generateCardioid() {
        return `; Cardioid: r = 1 + cos(θ)
; Input: R0 = θ (degrees, scaled by 100)
; Output: R0 = r (scaled by 100)

; Calculate cos(θ) using math engine
; Convert θ to radians
LOAD R1, R0
LOAD R2, 1745
MUL R1, R2
LOAD R2, 10000
DIV R1, R2      ; R1 = θ in radians*1000

; cos(x) ≈ 1 - x²/2
LOAD R2, 1000   ; Start with 1
LOAD R3, R1
MUL R3, R3      ; R3 = x²
LOAD R4, 2
DIV R3, R4
LOAD R4, 1000
DIV R3, R4
DIV R3, R4      ; R3 = x²/2 (scaled by 1000)
SUB R2, R3      ; R2 = cos(θ) (scaled by 1000)

; r = 1 + cos(θ)
LOAD R0, 1000   ; 1 scaled by 1000
ADD R0, R2      ; R0 = 1 + cos(θ) (scaled by 1000)
LOAD R1, 10
DIV R0, R1      ; R0 = 1 + cos(θ) (scaled by 100)
RET`;
    }
    
    /**
     * Generate Romasm code for spiral: r = θ
     */
    generateSpiral() {
        return `; Spiral: r = θ
; Input: R0 = θ (degrees, scaled by 100)
; Output: R0 = r (scaled by 100, but needs to be converted to same units)

; For spiral, r increases linearly with θ
; We'll scale it appropriately
LOAD R1, R0     ; R1 = θ (degrees*100)
; Convert to a reasonable scale (divide by some factor)
LOAD R2, 10
DIV R0, R2      ; Scale down for display
RET`;
    }
    
    /**
     * Plot a polar curve using Romasm
     * @param {string} romasmCode - Romasm code for r = f(θ)
     * @param {Object} options - Plotting options
     * @returns {Array} Array of {x, y} points
     */
    plotPolarCurve(romasmCode, options = {}) {
        const {
            thetaStart = 0,
            thetaEnd = 360,
            stepSize = 0.5,
            angleMode = 'degree'
        } = options;
        
        // Compile the Romasm code
        const result = this.assembler.assemble(romasmCode);
        if (!result.success) {
            throw new Error(`Assembly failed: ${result.errors.map(e => e.message).join(', ')}`);
        }
        
        const points = [];
        const rValues = [];
        let maxR = 0;
        
        // First pass: calculate r values
        for (let theta = thetaStart; theta <= thetaEnd; theta += stepSize) {
            const vm = new RomasmVM();
            const scaledTheta = Math.floor(theta * (angleMode === 'degree' ? 100 : 1000));
            vm.registers['I'] = scaledTheta;
            vm.loadProgram(result.instructions);
            
            try {
                let steps = 0;
                while (!vm.halted && steps < 1000) {
                    const stepResult = vm.step();
                    if (stepResult.error) break;
                    steps++;
                }
                
                if (vm.halted) {
                    const rScaled = vm.registers['I'];
                    const r = rScaled / 100.0;
                    
                    if (isFinite(r) && !isNaN(r)) {
                        maxR = Math.max(maxR, Math.abs(r));
                        rValues.push({ theta, r });
                    }
                }
            } catch (error) {
                continue;
            }
        }
        
        // Second pass: convert to Cartesian using Romasm math engine
        for (const { theta, r } of rValues) {
            // Handle negative r
            let actualTheta = theta;
            let actualR = r;
            if (r < 0) {
                actualTheta = theta + (angleMode === 'degree' ? 180 : Math.PI);
                actualR = Math.abs(r);
                if (angleMode === 'degree') {
                    while (actualTheta >= 360) actualTheta -= 360;
                    while (actualTheta < 0) actualTheta += 360;
                } else {
                    while (actualTheta >= 2 * Math.PI) actualTheta -= 2 * Math.PI;
                    while (actualTheta < 0) actualTheta += 2 * Math.PI;
                }
            }
            
            // Convert using math engine
            const scaledR = Math.floor(actualR * 100);
            const scaledTheta = Math.floor(actualTheta * (angleMode === 'degree' ? 100 : 1000));
            
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
        
        return {
            points: points.map(p => ({ x: p.x, y: p.y })),
            maxR
        };
    }
}

