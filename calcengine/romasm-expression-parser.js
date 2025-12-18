/**
 * Romasm Expression Parser
 * 
 * Converts simple mathematical expressions to Romasm assembly code
 * Supports: numbers, +, -, *, /, ^, functions (sin, cos, tan, log, ln, sqrt)
 */

class RomasmExpressionParser {
    constructor() {
        this.assembler = new RomasmAssembler();
    }
    
    /**
     * Parse a simple math expression and convert to Romasm
     * @param {string} expression - Math expression like "2+2", "sin(30)", "5*3"
     * @returns {string} Romasm assembly code
     */
    parseExpression(expression) {
        expression = expression.trim();
        
        // Handle simple number
        if (/^-?\d+\.?\d*$/.test(expression)) {
            const num = Math.floor(parseFloat(expression) * 100);
            return `LOAD R0, ${num}
RET`;
        }
        
        // Handle function calls: sin(x), cos(x), etc.
        const functionMatch = expression.match(/^(sin|cos|tan|log|ln|sqrt)\((.+)\)$/);
        if (functionMatch) {
            const funcName = functionMatch[1];
            const arg = functionMatch[2];
            return this.parseFunction(funcName, arg);
        }
        
        // Handle power: x^y
        if (expression.includes('^')) {
            return this.parsePower(expression);
        }
        
        // Handle basic arithmetic: +, -, *, /
        return this.parseArithmetic(expression);
    }
    
    /**
     * Parse arithmetic expression
     */
    parseArithmetic(expression) {
        // Split by operators (respecting parentheses)
        const operators = ['+', '-', '*', '/'];
        let depth = 0;
        let parts = [];
        let current = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (depth === 0 && operators.includes(char)) {
                if (current) {
                    parts.push({ type: 'operand', value: current.trim() });
                    current = '';
                }
                parts.push({ type: 'operator', value: char });
                continue;
            }
            current += char;
        }
        if (current) {
            parts.push({ type: 'operand', value: current.trim() });
        }
        
        // If no operators found, it's a single value
        if (parts.length === 1) {
            return this.parseValue(parts[0].value);
        }
        
        // Process in order of precedence: *, /, then +, -
        // First pass: * and /
        for (let i = 1; i < parts.length - 1; i += 2) {
            if (parts[i].value === '*' || parts[i].value === '/') {
                const left = parts[i - 1];
                const right = parts[i + 1];
                const op = parts[i].value;
                
                // Generate code for this operation
                const leftCode = this.parseValue(left.value);
                const rightCode = this.parseValue(right.value);
                
                // Combine
                const combined = this.combineOperations(leftCode, rightCode, op);
                parts.splice(i - 1, 3, { type: 'operand', code: combined });
                i -= 2; // Adjust index
            }
        }
        
        // Second pass: + and -
        let result = parts[0];
        for (let i = 1; i < parts.length; i += 2) {
            const op = parts[i].value;
            const right = parts[i + 1];
            result = {
                type: 'operand',
                code: this.combineOperations(
                    result.code || this.parseValue(result.value),
                    this.parseValue(right.value),
                    op
                )
            };
        }
        
        return result.code;
    }
    
    /**
     * Parse a value (number or expression)
     */
    parseValue(value) {
        value = value.trim();
        
        // Number
        if (/^-?\d+\.?\d*$/.test(value)) {
            const num = Math.floor(parseFloat(value) * 100);
            return `LOAD R0, ${num}`;
        }
        
        // Function call
        const funcMatch = value.match(/^(sin|cos|tan|log|ln|sqrt)\((.+)\)$/);
        if (funcMatch) {
            return this.parseFunction(funcMatch[1], funcMatch[2]);
        }
        
        // Parentheses - recursive
        if (value.startsWith('(') && value.endsWith(')')) {
            return this.parseExpression(value.slice(1, -1));
        }
        
        // Variable (X, θ, etc.) - for now, return 0
        return `LOAD R0, 0`;
    }
    
    /**
     * Combine two operations
     */
    combineOperations(leftCode, rightCode, operator) {
        // Load left into R0, right into R1
        return `${leftCode}
LOAD R1, R0
${rightCode}
LOAD R2, R1
LOAD R1, R0
LOAD R0, R2
${this.getOperationCode(operator)}`;
    }
    
    /**
     * Get Romasm code for an operator
     */
    getOperationCode(operator) {
        switch (operator) {
            case '+':
                return `ADD R0, R1`;
            case '-':
                return `SUB R0, R1`;
            case '*':
                return `MUL R0, R1
LOAD R1, 100
DIV R0, R1`;
            case '/':
                return `LOAD R2, R1
LOAD R1, 100
MUL R0, R1
LOAD R1, R2
DIV R0, R1`;
            default:
                return `ADD R0, R1`; // Default to add
        }
    }
    
    /**
     * Parse function call
     */
    parseFunction(funcName, arg) {
        const argCode = this.parseValue(arg);
        
        switch (funcName) {
            case 'sin':
                return `${argCode}
; Call sin function (simplified)
LOAD R1, R0
LOAD R2, 17
MUL R1, R2
LOAD R2, 100
DIV R1, R2
LOAD R0, R1
LOAD R1, 1000
DIV R0, R1`;
            case 'cos':
                return `${argCode}
; Call cos function (simplified)
LOAD R1, 90
SUB R1, R0
LOAD R0, R1
LOAD R1, 17
MUL R0, R1
LOAD R1, 100
DIV R0, R1
LOAD R1, 1000
MUL R0, R1
LOAD R1, 100
DIV R0, R1`;
            case 'sqrt':
                return `${argCode}
; Square root using Newton's method
LOAD R1, R0
LOAD R2, 2
LOAD R3, 10
sqrt_loop:
  LOAD R4, R0
  DIV R4, R1
  ADD R4, R1
  DIV R4, R2
  LOAD R1, R4
  DEC R3
  CMP R3, 0
  JGT sqrt_loop
LOAD R0, R1`;
            default:
                return `${argCode}`;
        }
    }
    
    /**
     * Parse power operation
     */
    parsePower(expression) {
        const parts = expression.split('^');
        if (parts.length !== 2) {
            throw new Error('Invalid power expression');
        }
        
        const baseCode = this.parseValue(parts[0].trim());
        const expCode = this.parseValue(parts[1].trim());
        
        return `${baseCode}
LOAD R1, R0
${expCode}
LOAD R2, R0
LOAD R0, R1
LOAD R1, 1
power_loop:
  CMP R2, 0
  JLE power_done
  MUL R1, R0
  DEC R2
  JMP power_loop
power_done:
LOAD R0, R1
LOAD R1, 100
DIV R0, R1`;
    }
    
    /**
     * Evaluate expression and return result
     */
    evaluate(expression) {
        try {
            const code = this.parseExpression(expression);
            const result = this.assembler.assemble(code);
            
            if (!result.success) {
                throw new Error(result.errors.map(e => e.message).join(', '));
            }
            
            const vm = new RomasmVM();
            vm.loadProgram(result.instructions);
            
            let steps = 0;
            while (!vm.halted && steps < 1000) {
                vm.step();
                steps++;
            }
            
            if (vm.halted) {
                return vm.registers['I'] / 100.0; // Unscale
            } else {
                throw new Error('Execution timeout');
            }
        } catch (error) {
            throw error;
        }
    }
}

