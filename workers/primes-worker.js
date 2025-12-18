/**
 * Web Worker for Prime Number computation
 * Handles sieving and primality testing in background
 */

self.onmessage = function(e) {
    const { task, data } = e.data;
    
    switch (task) {
        case 'sieve':
            sieveRange(data.start, data.end);
            break;
        case 'isPrime':
            checkPrimality(data.number);
            break;
        case 'twinPrimes':
            findTwinPrimes(data.start, data.range);
            break;
        case 'goldbach':
            verifyGoldbach(data.number);
            break;
        default:
            self.postMessage({ success: false, error: 'Unknown task' });
    }
};

function sieveRange(start, end) {
    const primes = [];
    const isPrime = new Array(end - start + 1).fill(true);
    
    // Simple sieve for small ranges
    for (let i = 2; i * i <= end; i++) {
        const startMultiple = Math.max(i * i, Math.ceil(start / i) * i);
        for (let j = startMultiple; j <= end; j += i) {
            if (j >= start) {
                isPrime[j - start] = false;
            }
        }
    }
    
    for (let i = Math.max(2, start); i <= end; i++) {
        if (isPrime[i - start]) {
            primes.push(i);
        }
    }
    
    self.postMessage({
        success: true,
        primes: primes,
        count: primes.length
    });
}

function checkPrimality(n) {
    if (n < 2) {
        self.postMessage({ success: true, isPrime: false });
        return;
    }
    if (n === 2) {
        self.postMessage({ success: true, isPrime: true });
        return;
    }
    if (n % 2 === 0) {
        self.postMessage({ success: true, isPrime: false });
        return;
    }
    
    for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) {
            self.postMessage({ success: true, isPrime: false });
            return;
        }
    }
    
    self.postMessage({ success: true, isPrime: true });
}

function findTwinPrimes(start, range) {
    const twins = [];
    let checked = 0;
    
    for (let i = start; i < start + range && checked < 10000; i++) {
        if (i % 2 === 0) continue;
        
        if (isPrimeSimple(i) && isPrimeSimple(i + 2)) {
            twins.push({ p1: i, p2: i + 2 });
        }
        checked++;
    }
    
    self.postMessage({
        success: true,
        twins: twins,
        checked: checked
    });
}

function verifyGoldbach(n) {
    if (n < 4 || n % 2 !== 0) {
        self.postMessage({ success: false, error: 'Must be even number >= 4' });
        return;
    }
    
    for (let p = 2; p <= n / 2; p++) {
        if (isPrimeSimple(p) && isPrimeSimple(n - p)) {
            self.postMessage({
                success: true,
                found: true,
                p1: p,
                p2: n - p
            });
            return;
        }
    }
    
    self.postMessage({
        success: true,
        found: false
    });
}

function isPrimeSimple(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

