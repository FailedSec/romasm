/**
 * Romasm Coordinate System
 * 
 * A standardized coordinate system for the Romasm Calculator.
 * Ensures (0,0) is always at the center of the graph crosshair.
 * 
 * Coordinate System:
 * - Graph coordinates: Real-world mathematical coordinates (e.g., -10 to 10)
 * - Screen coordinates: Pixel coordinates on the canvas (0 to width, 0 to height)
 * - Center: (0,0) in graph coordinates is always at the center of the visible graph area
 */

class RomasmCoordinateSystem {
    constructor(canvasWidth, canvasHeight, padding = 20) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.padding = padding;
        
        // Graph bounds (mathematical coordinates)
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        
        // Calculated properties
        this.graphWidth = canvasWidth - 2 * padding;
        this.graphHeight = canvasHeight - 2 * padding;
        this.centerX = canvasWidth / 2;
        this.centerY = canvasHeight / 2;
        
        // Scaling factors
        this.xScale = this.graphWidth / (this.xMax - this.xMin);
        this.yScale = this.graphHeight / (this.yMax - this.yMin);
    }
    
    /**
     * Set graph window bounds
     * Automatically ensures (0,0) is centered if possible
     */
    setWindow(xMin, xMax, yMin, yMax, centerOrigin = true) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
        
        // If centerOrigin is true, adjust bounds to center (0,0)
        if (centerOrigin) {
            this.centerOrigin();
        }
        
        // Recalculate scaling
        this.xScale = this.graphWidth / (this.xMax - this.xMin);
        this.yScale = this.graphHeight / (this.yMax - this.yMin);
    }
    
    /**
     * Center the origin (0,0) in the graph window
     */
    centerOrigin() {
        // Calculate current center
        const currentCenterX = (this.xMin + this.xMax) / 2;
        const currentCenterY = (this.yMin + this.yMax) / 2;
        
        // Calculate ranges
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        
        // Adjust bounds so (0,0) is at center
        this.xMin = -xRange / 2;
        this.xMax = xRange / 2;
        this.yMin = -yRange / 2;
        this.yMax = yRange / 2;
    }
    
    /**
     * Convert graph coordinate to screen X coordinate
     * @param {number} graphX - Graph X coordinate
     * @returns {number} Screen X coordinate (pixels)
     */
    graphToScreenX(graphX) {
        // Center (0,0) at the center of the graph area
        const graphCenterX = (this.xMin + this.xMax) / 2;
        const offsetX = graphX - graphCenterX;
        return this.centerX + offsetX * this.xScale;
    }
    
    /**
     * Convert graph coordinate to screen Y coordinate
     * @param {number} graphY - Graph Y coordinate
     * @returns {number} Screen Y coordinate (pixels, Y increases downward)
     */
    graphToScreenY(graphY) {
        // Center (0,0) at the center of the graph area
        // Note: Screen Y increases downward, so we invert
        const graphCenterY = (this.yMin + this.yMax) / 2;
        const offsetY = graphY - graphCenterY;
        return this.centerY - offsetY * this.yScale; // Invert Y axis
    }
    
    /**
     * Convert screen coordinate to graph X coordinate
     * @param {number} screenX - Screen X coordinate (pixels)
     * @returns {number} Graph X coordinate
     */
    screenToGraphX(screenX) {
        const graphCenterX = (this.xMin + this.xMax) / 2;
        const offsetX = (screenX - this.centerX) / this.xScale;
        return graphCenterX + offsetX;
    }
    
    /**
     * Convert screen coordinate to graph Y coordinate
     * @param {number} screenY - Screen Y coordinate (pixels)
     * @returns {number} Graph Y coordinate
     */
    screenToGraphY(screenY) {
        const graphCenterY = (this.yMin + this.yMax) / 2;
        const offsetY = (this.centerY - screenY) / this.yScale; // Invert Y axis
        return graphCenterY + offsetY;
    }
    
    /**
     * Get the screen position of the origin (0,0)
     * @returns {Object} {x, y} in screen coordinates
     */
    getOriginScreenPosition() {
        return {
            x: this.graphToScreenX(0),
            y: this.graphToScreenY(0)
        };
    }
    
    /**
     * Check if a graph coordinate is within the visible bounds
     * @param {number} graphX - Graph X coordinate
     * @param {number} graphY - Graph Y coordinate
     * @returns {boolean}
     */
    isInBounds(graphX, graphY) {
        return graphX >= this.xMin && graphX <= this.xMax &&
               graphY >= this.yMin && graphY <= this.yMax;
    }
    
    /**
     * Check if a screen coordinate is within the graph area
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {boolean}
     */
    isInGraphArea(screenX, screenY) {
        return screenX >= this.padding && screenX <= this.canvasWidth - this.padding &&
               screenY >= this.padding && screenY <= this.canvasHeight - this.padding;
    }
    
    /**
     * Get grid line positions for drawing
     * @returns {Object} {vertical: [x1, x2, ...], horizontal: [y1, y2, ...]}
     */
    getGridLines() {
        const vertical = [];
        const horizontal = [];
        
        // Vertical lines (constant X)
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            vertical.push(x);
        }
        
        // Horizontal lines (constant Y)
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            horizontal.push(y);
        }
        
        return { vertical, horizontal };
    }
    
    /**
     * Get axis positions (where x=0 and y=0 cross)
     * @returns {Object} {xAxisY: screenY, yAxisX: screenX}
     */
    getAxisPositions() {
        return {
            xAxisY: this.graphToScreenY(0), // Y position of x-axis (y=0)
            yAxisX: this.graphToScreenX(0)  // X position of y-axis (x=0)
        };
    }
    
    /**
     * Update canvas dimensions (call when canvas is resized)
     */
    updateCanvasSize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.graphWidth = width - 2 * this.padding;
        this.graphHeight = height - 2 * this.padding;
        this.centerX = width / 2;
        this.centerY = height / 2;
        
        // Recalculate scaling
        this.xScale = this.graphWidth / (this.xMax - this.xMin);
        this.yScale = this.graphHeight / (this.yMax - this.yMin);
    }
    
    /**
     * Zoom in/out around a point
     * @param {number} factor - Zoom factor (>1 = zoom in, <1 = zoom out)
     * @param {number} centerX - Graph X coordinate to zoom around (default: 0)
     * @param {number} centerY - Graph Y coordinate to zoom around (default: 0)
     */
    zoom(factor, centerX = 0, centerY = 0) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        
        const newXRange = xRange / factor;
        const newYRange = yRange / factor;
        
        this.xMin = centerX - newXRange / 2;
        this.xMax = centerX + newXRange / 2;
        this.yMin = centerY - newYRange / 2;
        this.yMax = centerY + newYRange / 2;
        
        // Recalculate scaling
        this.xScale = this.graphWidth / (this.xMax - this.xMin);
        this.yScale = this.graphHeight / (this.yMax - this.yMin);
    }
    
    /**
     * Pan the view
     * @param {number} deltaX - Amount to pan in X direction (graph coordinates)
     * @param {number} deltaY - Amount to pan in Y direction (graph coordinates)
     */
    pan(deltaX, deltaY) {
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        
        this.xMin += deltaX;
        this.xMax += deltaX;
        this.yMin += deltaY;
        this.yMax += deltaY;
        
        // Recalculate scaling
        this.xScale = this.graphWidth / (this.xMax - this.xMin);
        this.yScale = this.graphHeight / (this.yMax - this.yMin);
    }
}

