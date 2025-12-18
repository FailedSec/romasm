/**
 * Test script for Romasm
 */

const { RomasmRegister, RomasmOperations, RomasmVM } = require('./romasm.js');

console.log('=== Romasm Test Suite ===\n');

// Test 1: Basic Register Operations
console.log('Test 1: Basic Register Operations');
const reg1 = RomasmRegister.fromDecimal(11);
console.log(`Value: ${reg1.getValue()}, Roman: ${reg1.toString()}`);
console.log(`Registers:`, reg1.registers);
console.log();

// Test 2: OR Operation
console.log('Test 2: OR Operation');
const a = RomasmRegister.fromDecimal(11); // X + I = 11
const b = RomasmRegister.fromDecimal(6);  // V + I = 6
const orResult = RomasmOperations.OR(a, b);
console.log(`A: ${a.getValue()} (${a.toString()}) - Registers: X=ON, I=ON`);
console.log(`B: ${b.getValue()} (${b.toString()}) - Registers: V=ON, I=ON`);
console.log(`OR: ${orResult.getValue()} (${orResult.toString()}) - Combines: X=ON, V=ON, I=ON`);
console.log(`   (X=10 + V=5 + I=1 = 16)`);
console.log();

// Test 3: AND Operation
console.log('Test 3: AND Operation');
const andResult = RomasmOperations.AND(a, b);
console.log(`A: ${a.getValue()} (${a.toString()}) - Registers: X=ON, I=ON`);
console.log(`B: ${b.getValue()} (${b.toString()}) - Registers: V=ON, I=ON`);
console.log(`AND: ${andResult.getValue()} (${andResult.toString()}) - Common: I=ON`);
console.log(`   (Only I is ON in both, so result is 1)`);
console.log();

// Test 4: XOR Operation
console.log('Test 4: XOR Operation');
const c = RomasmRegister.fromDecimal(10); // X
const d = RomasmRegister.fromDecimal(5);   // V
const xorResult = RomasmOperations.XOR(c, d);
console.log(`A: ${c.getValue()} (${c.toString()}) - Registers: X=ON`);
console.log(`B: ${d.getValue()} (${d.toString()}) - Registers: V=ON`);
console.log(`XOR: ${xorResult.getValue()} (${xorResult.toString()}) - Exclusive: X=ON, V=ON`);
console.log(`   (X=10 + V=5 = 15, only registers active in one input)`);
console.log();

// Test 5: ADD Operation
console.log('Test 5: ADD Operation');
const addResult = RomasmOperations.ADD(a, b);
console.log(`A: ${a.getValue()} (${a.toString()})`);
console.log(`B: ${b.getValue()} (${b.toString()})`);
console.log(`ADD: ${addResult.getValue()} (${addResult.toString()})`);
console.log(`   (11 + 6 = 17)`);
console.log();

// Test 6: MULTIPLY Operation
console.log('Test 6: MULTIPLY Operation (Peasant Multiplication)');
const multA = RomasmRegister.fromDecimal(7);
const multB = RomasmRegister.fromDecimal(13);
const multResult = RomasmOperations.MULTIPLY(multA, multB);
console.log(`A: ${multA.getValue()} (${multA.toString()})`);
console.log(`B: ${multB.getValue()} (${multB.toString()})`);
console.log(`MULTIPLY: ${multResult.getValue()} (${multResult.toString()})`);
console.log(`Expected: ${7 * 13} = 91`);
console.log(`   (Uses binary multiplication: 7×1 + 14×0 + 28×0 + 56×1 = 7 + 56 = 63, then continues...)`);
console.log();

// Test 7: VM Operations
console.log('Test 7: Virtual Machine');
const vm = new RomasmVM();
vm.load('A', 11);
vm.load('B', 6);
vm.execute('OR', 'A', 'B', 'ACC');
const state = vm.getState();
console.log('VM State:');
for (const [name, regState] of Object.entries(state)) {
    console.log(`  ${name}: ${regState.value} (${regState.roman || 'N'})`);
}
console.log();

console.log('=== All Tests Complete ===');

