# Romasm Compiler

This directory contains the Romasm assembler and virtual machine.

## Files

- `romasm-assembler.js` - Assembler that translates Romasm assembly to machine code
- `romasm-vm.js` - Virtual machine that executes compiled Romasm programs

## Usage

### Node.js

```javascript
const { RomasmAssembler } = require('./romasm-assembler.js');
const { RomasmVM } = require('./romasm-vm.js');

// Assemble source code
const assembler = new RomasmAssembler();
const result = assembler.assemble(`
  LOAD R0, 10
  LOAD R1, 20
  ADD R0, R1
  PRINT R0
`);

if (result.success) {
  // Execute
  const vm = new RomasmVM();
  vm.loadProgram(result.instructions);
  const execution = vm.run();
  console.log('Output:', execution.output);
}
```

### Browser

The files are automatically loaded in `ide.html` and available globally as `RomasmAssembler` and `RomasmVM`.

## Instruction Set

See `ide.html` for the full instruction reference.

## Features

- Label support
- Comments (lines starting with `;`)
- Register operations
- Memory operations
- Control flow (jumps, branches)
- Stack operations (PUSH, POP)
- Subroutines (CALL, RET)
- I/O (PRINT)

