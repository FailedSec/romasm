/**
 * Test script for Extended Romasm features
 */

const { RomasmExtended, RomasmISA } = require('./romasm-extended.js');

console.log('=== Extended Romasm Test Suite ===\n');

// Test 1: Radix Point (Fractions)
console.log('Test 1: Radix Point for Fractions');
const ext = new RomasmExtended({ radixChar: ':' });

const testNumbers = [15.51, 1.5, 0.25, 2025.1234];
testNumbers.forEach(num => {
    const romasm = ext.toRomasm(num);
    const back = ext.fromRomasm(romasm);
    console.log(`${num} → ${romasm} → ${back.toFixed(4)}`);
});
console.log();

// Test 2: Negative Numbers (Sign-Magnitude)
console.log('Test 2: Negative Numbers (Sign-Magnitude)');
const extSign = new RomasmExtended({ negativeMode: 'sign-magnitude' });

const negativeTests = [-15, -2025, -1.5];
negativeTests.forEach(num => {
    const romasm = extSign.toRomasm(num);
    const back = extSign.fromRomasm(romasm);
    console.log(`${num} → ${romasm} → ${back}`);
});
console.log();

// Test 3: Ten's Complement
console.log('Test 3: Ten\'s Complement');
const extComp = new RomasmExtended({ 
    negativeMode: 'tens-complement',
    registerWidth: 4 
});

const compTests = [15, -15, 2025, -2025];
compTests.forEach(num => {
    const romasm = extComp.toRomasm(num);
    console.log(`${num} → ${romasm}`);
});
console.log();

// Test 4: ISA Parsing
console.log('Test 4: Romasm ISA');
const isa = new RomasmISA();

const instructions = [
    'I II',        // INC register 1
    'X V III',     // STORE value 5 to address 3
    'L I',         // LOAD from register 0
];

instructions.forEach(inst => {
    const parsed = isa.parse(inst);
    console.log(`${inst} →`, JSON.stringify(parsed, null, 2));
    
    const result = isa.execute(inst, { registers: { 0: 10, 1: 5 }, memory: {}, pc: 0 });
    console.log('Execution:', result.executed ? 'SUCCESS' : 'FAILED');
    console.log();
});

console.log('=== All Extended Tests Complete ===');

