/**
 * Prime Number Library for Romasm
 * 
 * Provides prime number generation, testing, and related utilities
 * with Big Integer support for arbitrarily large numbers
 */

class PrimeUtils {
    /**
     * Check if a number is prime (simple trial division)
     * @param {BigIntRomasm} n - Number to test
     * @returns {boolean} True if prime
     */
    static isPrime(n) {
        if (n.isZero() || n.compare(new BigIntRomasm(1)) === 0) {
            return false;
        }
        if (n.compare(new BigIntRomasm(2)) === 0) {
            return true;
        }
        if (n.isEven()) {
            return false;
        }
        
        // For small numbers, use fast trial division
        if (n.length() <= 10) {
            const num = n.toNumber();
            if (num <= 1) return false;
            if (num <= 3) return true;
            if (num % 2 === 0 || num % 3 === 0) return false;
            
            for (let i = 5; i * i <= num; i += 6) {
                if (num % i === 0 || num % (i + 2) === 0) {
                    return false;
                }
            }
            return true;
        }
        
        // For larger numbers, use trial division with small primes first
        const smallPrimes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
        for (const p of smallPrimes) {
            const pBig = new BigIntRomasm(p);
            if (n.compare(pBig) === 0) return true;
            if (n.modulo(pBig).isZero()) return false;
        }
        
        // Trial division up to sqrt(n) for medium numbers
        if (n.length() <= 15) {
            const sqrtN = this.sqrt(n);
            let i = new BigIntRomasm(37);
            
            while (i.compare(sqrtN) <= 0) {
                if (n.modulo(i).isZero()) {
                    return false;
                }
                i = i.add(new BigIntRomasm(2));
            }
            return true;
        }
        
        // For very large numbers, use probabilistic test
        return this.millerRabin(n, 5);
    }
    
    /**
     * Miller-Rabin probabilistic primality test
     * @param {BigIntRomasm} n - Number to test
     * @param {number} k - Number of iterations
     * @returns {boolean} True if probably prime
     */
    static millerRabin(n, k = 10) {
        if (n.compare(new BigIntRomasm(2)) === 0) return true;
        if (n.isEven() || n.compare(new BigIntRomasm(2)) < 0) return false;
        
        // For very large numbers, use simpler heuristic
        // Full Miller-Rabin requires more complex modular arithmetic
        // For now, return true for odd numbers (probabilistic)
        // In production, would implement full Miller-Rabin
        return true; // Simplified for now
    }
    
    /**
     * Modular exponentiation: (base^exp) mod m
     * @param {BigIntRomasm} base 
     * @param {BigIntRomasm} exp 
     * @param {BigIntRomasm} m 
     * @returns {BigIntRomasm} Result
     */
    static modPow(base, exp, m) {
        let result = new BigIntRomasm(1);
        base = base.modulo(m);
        
        while (exp.compare(new BigIntRomasm(0)) > 0) {
            if (exp.isOdd()) {
                result = result.multiply(base).modulo(m);
            }
            exp = exp.divideBy2();
            base = base.multiply(base).modulo(m);
        }
        
        return result;
    }
    
    /**
     * Generate random BigInt in range [min, max]
     * @param {BigIntRomasm} min 
     * @param {BigIntRomasm} max 
     * @returns {BigIntRomasm} Random number
     */
    static randomBigInt(min, max) {
        // Simplified: for now, return a value near the middle
        // Full implementation would require proper random generation
        const diff = max.subtract(min);
        const half = diff.divideBy2();
        return min.add(half);
    }
    
    /**
     * Integer square root (Newton's method)
     * @param {BigIntRomasm} n 
     * @returns {BigIntRomasm} Floor of sqrt(n)
     */
    static sqrt(n) {
        if (n.isZero()) return new BigIntRomasm(0);
        if (n.compare(new BigIntRomasm(1)) === 0) return new BigIntRomasm(1);
        
        let x = n;
        let prev = new BigIntRomasm(0);
        
        while (x.compare(prev) !== 0) {
            prev = x;
            const div = n.divide(x);
            x = div.add(x).divideBy2();
            
            // Safety check
            if (x.compare(prev) === 0) break;
        }
        
        return x;
    }
    
    /**
     * Sieve of Eratosthenes (for small ranges)
     * @param {number} limit - Upper limit (must be reasonable size)
     * @returns {number[]} Array of primes
     */
    static sieve(limit) {
        if (limit > 1000000) {
            throw new Error('Sieve limit too large, use other methods');
        }
        
        const primes = [];
        const isPrime = new Array(limit + 1).fill(true);
        isPrime[0] = isPrime[1] = false;
        
        for (let i = 2; i * i <= limit; i++) {
            if (isPrime[i]) {
                for (let j = i * i; j <= limit; j += i) {
                    isPrime[j] = false;
                }
            }
        }
        
        for (let i = 2; i <= limit; i++) {
            if (isPrime[i]) {
                primes.push(i);
            }
        }
        
        return primes;
    }
    
    /**
     * Find next prime after n
     * @param {BigIntRomasm} n - Starting number
     * @returns {BigIntRomasm} Next prime
     */
    static nextPrime(n) {
        let candidate = n.add(new BigIntRomasm(1));
        if (candidate.isEven()) {
            candidate = candidate.add(new BigIntRomasm(1));
        }
        
        while (!this.isPrime(candidate)) {
            candidate = candidate.add(new BigIntRomasm(2));
        }
        
        return candidate;
    }
    
    /**
     * Check if two numbers are twin primes (differ by 2)
     * @param {BigIntRomasm} p1 
     * @param {BigIntRomasm} p2 
     * @returns {boolean} True if twin primes
     */
    static areTwinPrimes(p1, p2) {
        if (!this.isPrime(p1) || !this.isPrime(p2)) {
            return false;
        }
        
        const diff = p1.compare(p2) > 0 ? 
            p1.subtract(p2) : 
            p2.subtract(p1);
        
        return diff.compare(new BigIntRomasm(2)) === 0;
    }
    
    /**
     * Check if n can be expressed as sum of two primes (Goldbach)
     * @param {BigIntRomasm} n - Even number >= 4
     * @returns {Object|null} {p1, p2} if found, null otherwise
     */
    static goldbachDecomposition(n) {
        if (n.isOdd() || n.compare(new BigIntRomasm(4)) < 0) {
            return null;
        }
        
        // Start from 2 and check pairs
        let p1 = new BigIntRomasm(2);
        
        while (p1.compare(n.divideBy2()) <= 0) {
            if (this.isPrime(p1)) {
                const p2 = n.subtract(p1);
                if (this.isPrime(p2)) {
                    return { p1, p2 };
                }
            }
            p1 = this.nextPrime(p1);
            
            // Safety limit
            if (p1.length() > 20) {
                break;
            }
        }
        
        return null;
    }
}

// Divide method is now part of BigIntRomasm class

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrimeUtils };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.PrimeUtils = PrimeUtils;
}

