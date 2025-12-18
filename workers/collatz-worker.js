/**
 * Web Worker for Collatz Conjecture computation
 * Runs in background thread to avoid blocking UI
 */

self.onmessage = function(e) {
    const { startNum, range, useBigInt } = e.data;
    
    if (useBigInt) {
        // Import BigInt library (would need to be bundled or loaded)
        // For now, use simplified version
        computeCollatzBigInt(startNum, range);
    } else {
        computeCollatzRegular(startNum, range);
    }
};

function computeCollatzRegular(start, range) {
    const results = [];
    let current = start;
    let steps = 0;
    let maxValue = start;
    
    while (current !== 1 && steps < range && steps < 100000) {
        if (current % 2 === 0) {
            current = current / 2;
        } else {
            current = current * 3 + 1;
        }
        results.push(current);
        maxValue = Math.max(maxValue, current);
        steps++;
    }
    
    self.postMessage({
        success: true,
        sequence: results,
        steps: steps,
        maxValue: maxValue,
        converged: current === 1
    });
}

function computeCollatzBigInt(startStr, range) {
    // Simplified - would need BigIntRomasm loaded in worker
    // For now, send back a message that BigInt needs to be loaded
    self.postMessage({
        success: false,
        error: 'BigInt computation requires BigIntRomasm library in worker'
    });
}

