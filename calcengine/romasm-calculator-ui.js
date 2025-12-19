/**
 * Romasm Calculator UI
 * 
 * Provides a TI-84-like interface for the Romasm Calculator Engine
 * All calculations are performed in Romasm assembly
 */

class RomasmCalculatorUI {
    constructor(containerId, engine) {
        this.engine = engine;
        this.container = document.getElementById(containerId);
        this.currentState = 'calculator'; // 'calculator', 'graphing', 'yequals', 'window', 'zoom', 'trace'
        this.selectedFunction = 'Y1';
        this.cursorPosition = { row: 0, col: 0 };
        this.secondKey = false; // For 2nd key functions
        this.alphaKey = false; // For alpha key functions
        
        // Coordinate system (will be initialized after canvas is created)
        this.coords = null;
        
        // Calculator mode state
        this.calculatorExpression = '';
        this.calculatorResult = null;
        this.calculatorHistory = [];
        
        // Y= editor state
        this.yEditorVisible = false;
        this.yEditorActive = false;
        this.selectedY = 'Y1';
        
        // Window editor state
        this.windowEditorVisible = false;
        this.windowField = 'xmin';
        
        // Zoom state
        this.zoomLevel = 1;
        this.zoomCenter = { x: 0, y: 0 };
        
        // Trace state
        this.traceActive = false;
        this.traceX = 0;
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    render() {
        // The calculator UI needs to be rendered into the container
        // Check if container exists
        if (!this.container) {
            console.error('Calculator container not found!');
            return;
        }
        
        // Render the calculator UI
        this.container.innerHTML = `
            <div class="romasm-calculator">
                <div class="calc-screen">
                    <div class="calc-status-bar">
                        <span class="status-text">ROMASM ${this.engine.mode.toUpperCase()} ${this.engine.angleMode.toUpperCase()}</span>
                        <span class="battery">●●●●●</span>
                    </div>
                    <div class="calc-display" id="calc-display">
                        <canvas id="calc-canvas" width="500" height="300"></canvas>
                    </div>
                </div>
                <div class="calc-keypad">
                    <div class="keypad-row">
                        <button class="calc-key function-key" data-key="yequals">Y=</button>
                        <button class="calc-key function-key" data-key="window">WINDOW</button>
                        <button class="calc-key function-key" data-key="zoom">ZOOM</button>
                        <button class="calc-key function-key" data-key="trace">TRACE</button>
                        <button class="calc-key function-key" data-key="graph">GRAPH</button>
                    </div>
                    <div class="keypad-main">
                        <!-- Mode keys -->
                        <button class="calc-key" data-key="2nd">2nd</button>
                        <button class="calc-key" data-key="mode">MODE</button>
                        <button class="calc-key" data-key="del">DEL</button>
                        <button class="calc-key" data-key="alpha">ALPHA</button>
                        
                        <!-- Navigation pad -->
                        <div class="nav-pad">
                            <button class="calc-key nav-key" data-key="up">▲</button>
                            <button class="calc-key nav-key" data-key="left">◄</button>
                            <button class="calc-key nav-key nav-center" data-key="enter">ENTER</button>
                            <button class="calc-key nav-key" data-key="right">►</button>
                            <button class="calc-key nav-key" data-key="down">▼</button>
                        </div>
                        
                        <!-- Math functions -->
                        <button class="calc-key" data-key="sin">sin</button>
                        <button class="calc-key" data-key="cos">cos</button>
                        <button class="calc-key" data-key="tan">tan</button>
                        <button class="calc-key" data-key="log">log</button>
                        <button class="calc-key" data-key="ln">ln</button>
                        
                        <!-- Numbers -->
                        <button class="calc-key" data-key="7">7</button>
                        <button class="calc-key" data-key="8">8</button>
                        <button class="calc-key" data-key="9">9</button>
                        <button class="calc-key" data-key="multiply">×</button>
                        
                        <button class="calc-key" data-key="4">4</button>
                        <button class="calc-key" data-key="5">5</button>
                        <button class="calc-key" data-key="6">6</button>
                        <button class="calc-key" data-key="subtract">-</button>
                        
                        <button class="calc-key" data-key="1">1</button>
                        <button class="calc-key" data-key="2">2</button>
                        <button class="calc-key" data-key="3">3</button>
                        <button class="calc-key" data-key="add">+</button>
                        
                        <button class="calc-key" data-key="0">0</button>
                        <button class="calc-key" data-key="decimal">.</button>
                        <button class="calc-key" data-key="negative">(-)</button>
                        <button class="calc-key" data-key="enter">ENTER</button>
                        
                        <!-- Other keys -->
                        <button class="calc-key" data-key="clear">CLEAR</button>
                        <button class="calc-key" data-key="x">X</button>
                        <button class="calc-key" data-key="theta">θ</button>
                        <button class="calc-key" data-key="divide">÷</button>
                    </div>
                </div>
            </div>
        `;
        
        // Get canvas reference
        this.canvas = document.getElementById('calc-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            // Initialize coordinate system
            this.coords = new RomasmCoordinateSystem(
                this.canvas.width,
                this.canvas.height,
                20 // padding
            );
            // Set initial window bounds (will center origin)
            this.coords.setWindow(
                this.engine.xMin,
                this.engine.xMax,
                this.engine.yMin,
                this.engine.yMax,
                true // center origin
            );
            // Make canvas accessible globally for console
            window.calculatorCanvas = this.canvas;
            window.calculatorCanvasContext = this.ctx;
        } else {
            console.error('Canvas not found after render!');
        }
    }
    
    attachEventListeners() {
        // Keypad buttons
        const keypad = this.container.querySelector('.calc-keypad');
        if (keypad) {
            keypad.querySelectorAll('.calc-key').forEach(button => {
                button.addEventListener('click', (e) => {
                    const key = e.target.dataset.key || e.target.closest('.calc-key')?.dataset.key;
                    if (key) {
                        this.handleKeyPress(key);
                    }
                });
            });
        }
        
        // Function keys (Y=, WINDOW, etc.)
        const functionKeys = this.container.querySelectorAll('.function-key');
        functionKeys.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                this.handleFunctionKey(key);
            });
        });
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
    }
    
    handleFunctionKey(key) {
        switch (key) {
            case 'yequals':
                if (this.currentState === 'calculator') {
                    this.currentState = 'graphing';
                    this.showYEditor();
                } else {
                    this.showYEditor();
                }
                break;
            case 'window':
                if (this.currentState === 'calculator') {
                    this.currentState = 'graphing';
                    this.showWindowEditor();
                } else {
                    this.showWindowEditor();
                }
                break;
            case 'zoom':
                if (this.currentState === 'calculator') {
                    this.currentState = 'graphing';
                    this.showZoomMenu();
                } else {
                    this.showZoomMenu();
                }
                break;
            case 'trace':
                if (this.currentState === 'calculator') {
                    this.currentState = 'graphing';
                    this.toggleTrace();
                } else {
                    this.toggleTrace();
                }
                break;
            case 'graph':
                if (this.currentState === 'calculator') {
                    this.currentState = 'graphing';
                }
                this.plotCurrentFunctions();
                break;
        }
    }
    
    handleKeyPress(key) {
        // Handle 2nd key
        if (key === '2nd') {
            this.secondKey = !this.secondKey;
            this.updateStatusBar();
            return;
        }
        
        // Handle alpha key
        if (key === 'alpha') {
            this.alphaKey = !this.alphaKey;
            this.updateStatusBar();
            return;
        }
        
        // Handle mode key
        if (key === 'mode') {
            this.showModeMenu();
            return;
        }
        
        // Route to appropriate handler based on state
        switch (this.currentState) {
            case 'calculator':
                this.handleCalculatorKey(key);
                break;
            case 'graphing':
                this.handleGraphingKey(key);
                break;
            case 'yequals':
                this.handleYEqualsKey(key);
                break;
            case 'window':
                this.handleWindowKey(key);
                break;
            case 'zoom':
                this.handleZoomKey(key);
                break;
            case 'trace':
                this.handleTraceKey(key);
                break;
            default:
                this.handleGraphingKey(key);
        }
    }
    
    handleCalculatorKey(key) {
        // Handle calculator mode input
        if (key >= '0' && key <= '9') {
            this.calculatorExpression += key;
            this.updateDisplay();
        } else if (key === 'decimal') {
            if (!this.calculatorExpression.includes('.')) {
                this.calculatorExpression += '.';
                this.updateDisplay();
            }
        } else if (key === 'negative') {
            if (this.calculatorExpression.startsWith('-')) {
                this.calculatorExpression = this.calculatorExpression.substring(1);
            } else {
                this.calculatorExpression = '-' + this.calculatorExpression;
            }
            this.updateDisplay();
        } else if (key === 'add') {
            this.calculatorExpression += ' + ';
            this.updateDisplay();
        } else if (key === 'subtract') {
            this.calculatorExpression += ' - ';
            this.updateDisplay();
        } else if (key === 'multiply') {
            this.calculatorExpression += ' * ';
            this.updateDisplay();
        } else if (key === 'divide') {
            this.calculatorExpression += ' / ';
            this.updateDisplay();
        } else if (key === 'x') {
            this.calculatorExpression += 'X';
            this.updateDisplay();
        } else if (key === 'theta') {
            this.calculatorExpression += 'θ';
            this.updateDisplay();
        } else if (key === 'sin' || key === 'cos' || key === 'tan' || key === 'log' || key === 'ln') {
            this.calculatorExpression += `${key}(`;
            this.updateDisplay();
        } else if (key === 'enter') {
            this.calculateExpression();
        } else if (key === 'clear') {
            this.calculatorExpression = '';
            this.calculatorResult = null;
            this.updateDisplay();
        } else if (key === 'del') {
            this.calculatorExpression = this.calculatorExpression.slice(0, -1);
            this.updateDisplay();
        } else if (key === 'up' && this.secondKey) {
            // 2nd + Up = opening parenthesis
            this.calculatorExpression += '(';
            this.updateDisplay();
        } else if (key === 'down' && this.secondKey) {
            // 2nd + Down = closing parenthesis
            this.calculatorExpression += ')';
            this.updateDisplay();
        }
    }
    
    calculateExpression() {
        if (!this.calculatorExpression.trim()) return;
        
        try {
            // Try to use Romasm expression parser if available
            if (typeof RomasmExpressionParser !== 'undefined') {
                const parser = new RomasmExpressionParser();
                const result = parser.evaluate(this.calculatorExpression);
                this.calculatorResult = result;
                this.calculatorHistory.push({
                    expression: this.calculatorExpression,
                    result: result
                });
            } else {
                // Fallback to JavaScript eval (for simple expressions)
                // Replace variables with 0 for now
                const expr = this.calculatorExpression.replace(/X/g, '0').replace(/θ/g, '0');
                const result = eval(expr);
                this.calculatorResult = result;
                this.calculatorHistory.push({
                    expression: this.calculatorExpression,
                    result: result
                });
            }
            this.updateDisplay();
        } catch (error) {
            this.calculatorResult = `Error: ${error.message}`;
            this.updateDisplay();
        }
    }
    
    handleGraphingKey(key) {
        switch (key) {
            case 'clear':
                this.clearGraph();
                break;
            case 'enter':
                this.plotCurrentFunctions();
                break;
            case 'up':
            case 'down':
            case 'left':
            case 'right':
                this.navigateGraph(key);
                break;
            default:
                // Numbers and operations can be used for quick calculations
                break;
        }
    }
    
    handleYEqualsKey(key) {
        if (!this.yEditorVisible) {
            this.showYEditor();
            return;
        }
        
        const textarea = document.getElementById(`${this.selectedY.toLowerCase()}-code`);
        if (!textarea) return;
        
        switch (key) {
            case 'up':
                this.selectPreviousY();
                break;
            case 'down':
                this.selectNextY();
                break;
            case 'enter':
                this.updateFunctionFromEditor();
                break;
            case 'clear':
                textarea.value = '';
                break;
            case 'del':
                // Delete character at cursor
                const cursorPos = textarea.selectionStart;
                textarea.value = textarea.value.slice(0, cursorPos - 1) + textarea.value.slice(cursorPos);
                textarea.setSelectionRange(cursorPos - 1, cursorPos - 1);
                break;
            default:
                // Insert text for function names
                if (key === 'x') {
                    this.insertAtCursor(textarea, 'X');
                } else if (key === 'theta') {
                    this.insertAtCursor(textarea, 'θ');
                }
                break;
        }
    }
    
    handleWindowKey(key) {
        if (!this.windowEditorVisible) {
            this.showWindowEditor();
            return;
        }
        
        const input = document.getElementById(this.windowField);
        if (!input) return;
        
        switch (key) {
            case 'up':
            case 'down':
                this.selectWindowField(key === 'up' ? -1 : 1);
                break;
            case 'left':
            case 'right':
                this.adjustWindowValue(key === 'left' ? -1 : 1);
                break;
            case 'enter':
                this.applyWindowSettings();
                break;
            case 'clear':
                input.value = '0';
                break;
        }
    }
    
    handleZoomKey(key) {
        switch (key) {
            case 'enter':
                this.applyZoom();
                break;
            case 'up':
                this.zoomIn();
                break;
            case 'down':
                this.zoomOut();
                break;
            case 'clear':
                this.zoomStandard();
                break;
        }
    }
    
    handleTraceKey(key) {
        switch (key) {
            case 'left':
                this.traceMove(-0.1);
                break;
            case 'right':
                this.traceMove(0.1);
                break;
            case 'up':
                this.traceNextFunction();
                break;
            case 'down':
                this.tracePreviousFunction();
                break;
            case 'enter':
                this.traceCalculate();
                break;
            case 'clear':
                this.traceActive = false;
                this.updateDisplay();
                break;
        }
    }
    
    // Y= Editor Functions
    showYEditor() {
        this.currentState = 'yequals';
        this.yEditorVisible = true;
        const editor = document.querySelector('.function-editor');
        if (editor) {
            editor.style.display = 'block';
            editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        this.updateStatusBar();
    }
    
    hideYEditor() {
        this.yEditorVisible = false;
        this.currentState = 'graphing';
        this.updateStatusBar();
    }
    
    selectNextY() {
        const yIndex = parseInt(this.selectedY.substring(1));
        if (yIndex < 8) {
            this.selectedY = `Y${yIndex + 1}`;
            this.highlightSelectedY();
        }
    }
    
    selectPreviousY() {
        const yIndex = parseInt(this.selectedY.substring(1));
        if (yIndex > 1) {
            this.selectedY = `Y${yIndex - 1}`;
            this.highlightSelectedY();
        }
    }
    
    highlightSelectedY() {
        document.querySelectorAll('.function-item').forEach((item, idx) => {
            if (`Y${idx + 1}` === this.selectedY) {
                item.style.border = '2px solid var(--primary-color)';
                item.style.backgroundColor = 'var(--surface-light)';
            } else {
                item.style.border = 'none';
                item.style.backgroundColor = 'transparent';
            }
        });
    }
    
    updateFunctionFromEditor() {
        const textarea = document.getElementById(`${this.selectedY.toLowerCase()}-code`);
        if (!textarea) return;
        
        const code = textarea.value.trim();
        if (code) {
            try {
                this.engine.defineFunction(this.selectedY, code);
                console.log(`${this.selectedY} updated successfully`);
                this.hideYEditor();
                this.plotCurrentFunctions();
            } catch (error) {
                console.error(`Error defining ${this.selectedY}:`, error);
                alert(`Error: ${error.message}`);
            }
        }
    }
    
    insertAtCursor(textarea, text) {
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        textarea.value = textBefore + text + textAfter;
        textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
        textarea.focus();
    }
    
    // Window Editor Functions
    showWindowEditor() {
        this.currentState = 'window';
        this.windowEditorVisible = true;
        this.windowField = 'xmin';
        const windowSettings = document.querySelector('.window-settings');
        if (windowSettings) {
            windowSettings.style.display = 'grid';
            windowSettings.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        this.highlightWindowField();
        this.updateStatusBar();
    }
    
    selectWindowField(direction) {
        const fields = ['xmin', 'xmax', 'ymin', 'ymax'];
        const currentIndex = fields.indexOf(this.windowField);
        const newIndex = Math.max(0, Math.min(fields.length - 1, currentIndex + direction));
        this.windowField = fields[newIndex];
        this.highlightWindowField();
    }
    
    highlightWindowField() {
        document.querySelectorAll('.window-setting input').forEach(input => {
            if (input.id === this.windowField) {
                input.style.border = '2px solid var(--primary-color)';
                input.focus();
            } else {
                input.style.border = '2px solid var(--border-color)';
            }
        });
    }
    
    adjustWindowValue(direction) {
        const input = document.getElementById(this.windowField);
        if (!input) return;
        
        const currentValue = parseFloat(input.value) || 0;
        const step = direction > 0 ? 1 : -1;
        input.value = (currentValue + step).toFixed(1);
    }
    
    applyWindowSettings() {
        const xMin = parseFloat(document.getElementById('xmin').value);
        const xMax = parseFloat(document.getElementById('xmax').value);
        const yMin = parseFloat(document.getElementById('ymin').value);
        const yMax = parseFloat(document.getElementById('ymax').value);
        
        if (xMin < xMax && yMin < yMax) {
            this.engine.setWindow(xMin, xMax, yMin, yMax);
            this.windowEditorVisible = false;
            this.currentState = 'graphing';
            this.plotCurrentFunctions();
        } else {
            alert('Invalid window settings: min must be less than max');
        }
    }
    
    // Zoom Functions
    showZoomMenu() {
        this.currentState = 'zoom';
        this.updateStatusBar();
        // Could show a zoom menu overlay
    }
    
    zoomIn() {
        const centerX = (this.engine.xMin + this.engine.xMax) / 2;
        const centerY = (this.engine.yMin + this.engine.yMax) / 2;
        const xRange = (this.engine.xMax - this.engine.xMin) * 0.5;
        const yRange = (this.engine.yMax - this.engine.yMin) * 0.5;
        
        this.engine.setWindow(
            centerX - xRange,
            centerX + xRange,
            centerY - yRange,
            centerY + yRange
        );
        this.plotCurrentFunctions();
    }
    
    zoomOut() {
        const centerX = (this.engine.xMin + this.engine.xMax) / 2;
        const centerY = (this.engine.yMin + this.engine.yMax) / 2;
        const xRange = (this.engine.xMax - this.engine.xMin) * 2;
        const yRange = (this.engine.yMax - this.engine.yMin) * 2;
        
        this.engine.setWindow(
            centerX - xRange,
            centerX + xRange,
            centerY - yRange,
            centerY + yRange
        );
        this.plotCurrentFunctions();
    }
    
    zoomStandard() {
        this.engine.setWindow(-10, 10, -10, 10);
        this.plotCurrentFunctions();
    }
    
    applyZoom() {
        this.currentState = 'graphing';
        this.updateStatusBar();
    }
    
    // Trace Functions
    toggleTrace() {
        this.traceActive = !this.traceActive;
        if (this.traceActive) {
            this.currentState = 'trace';
            this.traceX = 0;
        } else {
            this.currentState = 'graphing';
        }
        this.updateDisplay();
        this.updateStatusBar();
    }
    
    traceMove(delta) {
        this.traceX += delta;
        this.traceX = Math.max(this.engine.xMin, Math.min(this.engine.xMax, this.traceX));
        this.updateDisplay();
    }
    
    traceNextFunction() {
        const yIndex = parseInt(this.selectedFunction.substring(1));
        if (yIndex < 8) {
            this.selectedFunction = `Y${yIndex + 1}`;
        }
        this.updateDisplay();
    }
    
    tracePreviousFunction() {
        const yIndex = parseInt(this.selectedFunction.substring(1));
        if (yIndex > 1) {
            this.selectedFunction = `Y${yIndex - 1}`;
        }
        this.updateDisplay();
    }
    
    traceCalculate() {
        if (this.engine.compiledFunctions[this.selectedFunction]) {
            try {
                const y = this.engine.evaluateFunction(this.selectedFunction, this.traceX);
                console.log(`Trace: ${this.selectedFunction}(${this.traceX.toFixed(2)}) = ${y.toFixed(2)}`);
            } catch (error) {
                console.error('Trace error:', error);
            }
        }
        this.updateDisplay();
    }
    
    // Navigation
    navigateGraph(direction) {
        const step = 1;
        switch (direction) {
            case 'up':
                this.engine.yMin += step;
                this.engine.yMax += step;
                break;
            case 'down':
                this.engine.yMin -= step;
                this.engine.yMax -= step;
                break;
            case 'left':
                this.engine.xMin -= step;
                this.engine.xMax -= step;
                break;
            case 'right':
                this.engine.xMin += step;
                this.engine.xMax += step;
                break;
        }
        this.plotCurrentFunctions();
    }
    
    // Mode Menu
    showModeMenu() {
        // Toggle between calculator and graphing modes
        if (this.currentState === 'calculator') {
            this.currentState = 'graphing';
        } else {
            this.currentState = 'calculator';
            this.calculatorExpression = '';
            this.calculatorResult = null;
        }
        
        this.updateStatusBar();
        this.updateDisplay();
    }
    
    // Display Functions
    updateDisplay() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentState === 'graphing' || this.currentState === 'trace') {
            this.drawGraph();
        } else {
            this.drawText();
        }
    }
    
    drawGraph() {
        if (!this.ctx || !this.canvas || !this.coords) return;
        
        // Update coordinate system with current engine bounds
        this.coords.setWindow(
            this.engine.xMin,
            this.engine.xMax,
            this.engine.yMin,
            this.engine.yMax,
            true // center origin at (0,0)
        );
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = this.coords.padding;
        
        // Clear background (but preserve any console drawings)
        // Only clear if we're not preserving console drawings
        if (!this.preserveConsoleDrawing) {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(0, 0, width, height);
        }
        
        // Draw grid
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        const gridLines = this.coords.getGridLines();
        
        // Vertical grid lines
        for (const x of gridLines.vertical) {
            const screenX = this.coords.graphToScreenX(x);
            if (this.coords.isInGraphArea(screenX, padding)) {
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, padding);
                this.ctx.lineTo(screenX, height - padding);
                this.ctx.stroke();
            }
        }
        
        // Horizontal grid lines
        for (const y of gridLines.horizontal) {
            const screenY = this.coords.graphToScreenY(y);
            if (this.coords.isInGraphArea(padding, screenY)) {
                this.ctx.beginPath();
                this.ctx.moveTo(padding, screenY);
                this.ctx.lineTo(width - padding, screenY);
                this.ctx.stroke();
            }
        }
        
        // Draw axes (crosshair at origin)
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        
        const axes = this.coords.getAxisPositions();
        
        // X-axis (horizontal line at y=0)
        if (axes.xAxisY >= padding && axes.xAxisY <= height - padding) {
            this.ctx.beginPath();
            this.ctx.moveTo(padding, axes.xAxisY);
            this.ctx.lineTo(width - padding, axes.xAxisY);
            this.ctx.stroke();
        }
        
        // Y-axis (vertical line at x=0)
        if (axes.yAxisX >= padding && axes.yAxisX <= width - padding) {
            this.ctx.beginPath();
            this.ctx.moveTo(axes.yAxisX, padding);
            this.ctx.lineTo(axes.yAxisX, height - padding);
            this.ctx.stroke();
        }
        
        // Draw origin crosshair marker (small circle at 0,0)
        const origin = this.coords.getOriginScreenPosition();
        if (this.coords.isInGraphArea(origin.x, origin.y)) {
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(origin.x, origin.y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // Plot functions with different colors
        const colors = ['#0f0', '#00f', '#f00', '#ff0', '#0ff', '#f0f', '#fa0', '#0af'];
        
        for (let i = 1; i <= 8; i++) {
            const funcName = `Y${i}`;
            if (this.engine.compiledFunctions[funcName]) {
                try {
                    const points = this.engine.getPlotPoints(funcName);
                    if (points.length > 0) {
                        this.ctx.strokeStyle = colors[(i - 1) % colors.length];
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        let first = true;
                        for (const point of points) {
                            const screenX = this.coords.graphToScreenX(point.x);
                            const screenY = this.coords.graphToScreenY(point.y);
                            
                            if (this.coords.isInGraphArea(screenX, screenY)) {
                                if (first) {
                                    this.ctx.moveTo(screenX, screenY);
                                    first = false;
                                } else {
                                    this.ctx.lineTo(screenX, screenY);
                                }
                            } else {
                                first = true;
                            }
                        }
                        this.ctx.stroke();
                    }
                } catch (error) {
                    console.error(`Error plotting ${funcName}:`, error);
                }
            }
        }
        
        // Draw trace cursor if active
        if (this.traceActive) {
            const screenX = this.coords.graphToScreenX(this.traceX);
            if (this.coords.isInGraphArea(screenX, padding)) {
                this.ctx.strokeStyle = '#f00';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(screenX, padding);
                this.ctx.lineTo(screenX, height - padding);
                this.ctx.stroke();
                
                // Show trace value
                if (this.engine.compiledFunctions[this.selectedFunction]) {
                    try {
                        const y = this.engine.evaluateFunction(this.selectedFunction, this.traceX);
                        const screenY = this.coords.graphToScreenY(y);
                        this.ctx.fillStyle = '#f00';
                        this.ctx.fillRect(screenX - 3, screenY - 3, 6, 6);
                        
                        // Display coordinates
                        this.ctx.fillStyle = '#000';
                        this.ctx.font = '10px monospace';
                        this.ctx.fillText(`(${this.traceX.toFixed(2)}, ${y.toFixed(2)})`, screenX + 5, screenY - 5);
                    } catch (error) {
                        // Ignore
                    }
                }
            }
        }
    }
    
    drawText() {
        if (this.currentState === 'calculator') {
            this.drawCalculatorMode();
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.font = '14px monospace';
            this.ctx.fillText('Romasm Calculator', 10, 30);
            this.ctx.fillText(`State: ${this.currentState}`, 10, 50);
            this.ctx.fillText(`Mode: ${this.engine.mode}`, 10, 70);
        }
    }
    
    drawCalculatorMode() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear background
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw calculator display
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px monospace';
        
        // Display expression
        const expression = this.calculatorExpression || '0';
        this.ctx.fillText(expression, 10, 40);
        
        // Display result
        if (this.calculatorResult !== null) {
            this.ctx.fillStyle = '#0066cc';
            this.ctx.font = '20px monospace';
            const resultText = typeof this.calculatorResult === 'number' 
                ? this.calculatorResult.toFixed(6).replace(/\.?0+$/, '')
                : this.calculatorResult.toString();
            this.ctx.fillText(resultText, 10, 70);
        }
        
        // Display history (last 3 entries)
        if (this.calculatorHistory.length > 0) {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px monospace';
            const historyStart = height - (this.calculatorHistory.length * 20 + 10);
            this.calculatorHistory.slice(-3).forEach((entry, idx) => {
                const y = historyStart + idx * 20;
                this.ctx.fillText(`${entry.expression} = ${entry.result}`, 10, y);
            });
        }
        
        // Draw cursor
        if (this.currentState === 'calculator') {
            this.ctx.fillStyle = '#000';
            const textWidth = this.ctx.measureText(expression).width;
            this.ctx.fillRect(10 + textWidth, 25, 2, 20);
        }
    }
    
    plotCurrentFunctions() {
        this.currentState = 'graphing';
        this.updateDisplay();
    }
    
    clearGraph() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateDisplay();
    }
    
    updateStatusBar() {
        const statusBar = document.querySelector('.calc-status-bar .status-text');
        if (statusBar) {
            let status = 'ROMASM ';
            if (this.currentState === 'calculator') {
                status += 'CALCULATOR';
            } else {
                status += `${this.engine.mode.toUpperCase()} ${this.engine.angleMode.toUpperCase()}`;
            }
            if (this.secondKey) status += ' 2ND';
            if (this.alphaKey) status += ' ALPHA';
            statusBar.textContent = status;
        }
    }
    
    setState(state) {
        this.currentState = state;
        this.updateDisplay();
        this.updateStatusBar();
    }
    
    handleKeyboardInput(e) {
        // Map keyboard keys to calculator keys
        const keyMap = {
            'Enter': 'enter',
            'Escape': 'clear',
            'Backspace': 'del',
            'Delete': 'del',
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'x': 'x',
            'X': 'x',
            't': 'theta',
            'T': 'theta'
        };
        
        if (keyMap[e.key]) {
            e.preventDefault();
            this.handleKeyPress(keyMap[e.key]);
        } else if (e.key >= '0' && e.key <= '9') {
            // Numbers
            e.preventDefault();
            // Could insert into current editor
        }
    }
}
