# Native Romasm VM - Running Romasm Without x86 Translation

## The Vision

**Goal**: Run Romasm bytecode directly on hardware, without translating to x86 assembly first.

**Current Flow**:
```
Romasm Source → VM Instructions → x86 Assembly → Machine Code → Processor
```

**Desired Flow**:
```
Romasm Source → Romasm Bytecode → Native VM → Processor
```

## Implementation Approaches

### Option 1: Firmware VM Bootloader (RECOMMENDED) ⭐

**Concept**: A minimal x86 bootloader that:
1. Initializes a Romasm VM in memory
2. Loads Romasm bytecode from disk/memory
3. Executes bytecode using the VM interpreter
4. Handles hardware via VM → BIOS mapping

**Architecture**:
```
┌─────────────────────────────────────┐
│     Romasm Source Code              │
│  (hello-world.romasm)               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Romasm Assembler                │
│  → Romasm Bytecode Format           │
│  → Binary .rombin file              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     VM Bootloader (x86)             │
│  - Sets up Romasm VM                │
│  - Loads .rombin from disk          │
│  - Executes bytecode                │
│  - Maps VM operations to BIOS/hw    │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────┐
        │ Hardware │
        └──────────┘
```

**Pros**:
- ✅ Users never write x86 - pure Romasm
- ✅ Portable - same bytecode runs on any x86 machine
- ✅ Faster development - no x86 generation step
- ✅ Easier debugging - VM can add instrumentation
- ✅ Extensible - add new VM instructions easily

**Cons**:
- ⚠️ Slightly slower (interpreted vs native)
- ⚠️ Bootloader must be written in x86 (one-time cost)

### Option 2: FPGA Hardware Implementation

**Concept**: Design actual hardware (FPGA or ASIC) that understands Romasm opcodes natively.

**Pros**:
- ✅ True native execution
- ✅ Could be faster than x86 translation
- ✅ Ultimate "pure Romasm" experience

**Cons**:
- ❌ Requires hardware design knowledge
- ❌ Expensive (FPGA boards, ASIC fabrication)
- ❌ Not portable - needs custom hardware

### Option 3: Hybrid Approach (Best of Both Worlds)

**Concept**: 
- Develop VM bootloader for development/testing (fast iteration)
- Optionally translate to x86 for production (maximum performance)

**Workflow**:
```bash
# Development mode - fast iteration
romasm build hello-world.romasm --vm-mode

# Production mode - optimized x86
romasm build hello-world.romasm --native-mode
```

## Romasm Bytecode Format

### Instruction Encoding

Each instruction is encoded as:

```
[OPCODE: 1 byte] [OPERANDS: variable]
```

### Opcode Table

| Romasm Opcode | Byte | Description |
|---------------|------|-------------|
| NOP           | 0x00 | No operation |
| LOAD          | 0x01 | Load value into register |
| STORE         | 0x02 | Store register to memory |
| ADD           | 0x03 | Add two registers |
| SUB           | 0x04 | Subtract two registers |
| MUL           | 0x05 | Multiply two registers |
| DIV           | 0x06 | Divide two registers |
| INC           | 0x07 | Increment register |
| DEC           | 0x08 | Decrement register |
| CMP           | 0x09 | Compare two registers |
| JMP           | 0x0A | Unconditional jump |
| JEQ           | 0x0B | Jump if equal |
| JNE           | 0x0C | Jump if not equal |
| JLT           | 0x0D | Jump if less than |
| JGT           | 0x0E | Jump if greater than |
| CALL          | 0x0F | Call function |
| RET           | 0x10 | Return from function |
| PUSH          | 0x11 | Push to stack |
| POP           | 0x12 | Pop from stack |
| INT           | 0x13 | Software interrupt |
| MOV_SEG       | 0x14 | Move to segment register |
| ...           | ...  | ... |

### Operand Encoding

**Register Reference**:
- 1 byte: `0xR0-R7` where R0=0x00, R1=0x01, etc.

**Immediate Value**:
- 1 byte: `0x80` (flag)
- 2 bytes: 16-bit value (little-endian)

**Memory Reference**:
- 1 byte: `0x90` (flag)
- 1 byte: Register containing address
- Optional: 1 byte offset (signed)

**Label Reference**:
- 1 byte: `0xA0` (flag)
- 2 bytes: Label ID (resolved at link time)

### Example Bytecode

```romasm
LOAD R0, 42
CALL bios_putc
```

**Bytecode**:
```
0x01 0x00        ; LOAD to R0
0x80 0x2A 0x00   ; Immediate value 42 (little-endian)
0x0F             ; CALL
0xA0 0x01 0x00   ; Label ID 1 (bios_putc)
```

## VM Bootloader Implementation

### Phase 1: Basic VM (Current Priority)

1. **Create Romasm Bytecode Generator**
   - Extend `romasm-assembler.js` to output binary bytecode
   - File format: `.rombin` (Romasm Binary)

2. **Create Minimal Bootloader**
   - Written in x86 (one-time)
   - Loads `.rombin` from disk/memory
   - Sets up VM state (registers, memory, stack)
   - Main execution loop: fetch, decode, execute

3. **Implement VM Core**
   - Instruction decoder
   - Register file (R0-R7 mapped to x86 regs or memory)
   - Memory management
   - Stack management
   - BIOS interrupt mapping

### Phase 2: Optimization

- JIT compilation (translate hot paths to x86)
- Register allocation optimizations
- Instruction caching

### Phase 3: Hardware Integration

- Direct hardware access (bypass BIOS where possible)
- Custom interrupt handlers
- DMA support

## Implementation Plan

### Step 1: Bytecode Generator (`romasm-bytecode-generator.js`)

```javascript
class RomasmBytecodeGenerator {
    generate(assembledProgram) {
        // Convert VM instructions to binary bytecode
        const bytecode = [];
        for (const instr of assembledProgram.instructions) {
            bytecode.push(this.encodeInstruction(instr));
        }
        return Buffer.from(bytecode);
    }
}
```

### Step 2: VM Bootloader (`romanos/vm/romasm-vm-bootloader.asm`)

```assembly
; Minimal x86 bootloader for Romasm VM
BITS 16
ORG 0x7C00

start:
    ; Initialize VM
    call init_vm
    ; Load bytecode
    call load_bytecode
    ; Execute VM
    call vm_execute
    ; Halt
    jmp $

init_vm:
    ; Set up VM registers in memory
    ; Initialize stack pointer
    ; Set up interrupt handlers
    ret

vm_execute:
    ; Main VM loop
    vm_loop:
        ; Fetch instruction
        ; Decode opcode
        ; Execute instruction
        ; Update program counter
        jmp vm_loop
    ret
```

### Step 3: Update Build System

```javascript
// build-romanos.js
if (mode === 'vm') {
    // Generate bytecode
    const bytecode = bytecodeGenerator.generate(assembled);
    // Create bootable image with VM + bytecode
    createVMImage(bytecode);
} else {
    // Current x86 path
    generateX86(assembled);
}
```

## Usage

### Development (VM Mode)

```bash
# Build in VM mode
node tools/build-romanos.js hello-world --vm

# Run
qemu-system-x86_64 -fda build/hello-world.img
```

### Production (Native x86)

```bash
# Build in native mode (current behavior)
node tools/build-romanos.js hello-world --native
```

## Benefits

1. **True Romasm Experience**: Write only Romasm, never see x86
2. **Faster Development**: No x86 translation step
3. **Portability**: Same bytecode on any x86 machine
4. **Debugging**: VM can add breakpoints, tracing, etc.
5. **Extensibility**: Add new VM instructions without changing hardware

## Next Steps

1. ✅ Design bytecode format (this document)
2. ⏳ Implement bytecode generator
3. ⏳ Create VM bootloader skeleton
4. ⏳ Implement core VM instructions (LOAD, STORE, ADD, JMP, CALL)
5. ⏳ Test with hello-world
6. ⏳ Add BIOS interrupt mapping
7. ⏳ Optimize performance

## Questions to Answer

- [ ] Should we support both VM and native modes, or only VM?
- [ ] How to handle interrupts in VM mode?
- [ ] Memory management strategy?
- [ ] Should VM be 16-bit, 32-bit, or 64-bit?
- [ ] Compatibility with existing RomanOS programs?
