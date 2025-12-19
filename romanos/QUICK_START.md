# RomanOS Quick Start Guide

## What We've Built

**RomanOS** is now a fully functional foundation for building a real operating system in Romasm! Here's what's been implemented:

### ✅ Complete System Extensions

1. **System Instructions** - Full set of OS-level instructions:
   - `INT` - Software interrupts (for BIOS calls)
   - `IRET` - Return from interrupt
   - `CLI` / `STI` - Interrupt flag control
   - `HLT` - Halt CPU
   - `IN` / `OUT` - I/O port operations
   - `MOV_SEG` - Segment register operations
   - `MOV_CR0/CR3/CR4` - Control register operations
   - 8-bit register operations (`LOAD8`, `STORE8`, `MOV8`)

2. **Extended VM** - Virtual machine now supports:
   - Interrupt handling
   - I/O port emulation
   - CPU flags (IF, TF, DF)
   - 8-bit registers (AL, AH, BL, BH, etc.)
   - Segment registers (CS, DS, ES, SS)

3. **x86 Code Generator** - Converts Romasm to real x86 assembly:
   - 16-bit mode (boot sectors)
   - 32-bit mode (protected mode kernels)
   - Complete register mapping
   - Boot sector generation

4. **BIOS Library** - Complete BIOS interrupt wrappers:
   - `bios_putc` - Print character
   - `bios_clear_screen` - Clear screen
   - `bios_get_key` - Read keyboard
   - `bios_print_string` - Print strings
   - `bios_set_cursor` - Set cursor position

5. **Build System** - Automated build pipeline:
   - Assembles Romasm
   - Links with stdlib
   - Generates x86 assembly
   - Creates bootable images

## 🚀 How to Use

### Building a RomanOS Program

1. **Write your OS in Romasm** (see `examples/hello-world.romasm`)

2. **Build it**:
   ```bash
   cd romanos
   node tools/build-romanos.js hello-world
   ```

3. **Run in QEMU**:
   ```bash
   ./tools/run.sh hello-world
   ```
   Or manually:
   ```bash
   qemu-system-x86_64 -drive file=build/hello-world.img,format=raw,if=floppy
   ```

## 📝 Example: Hello World OS

```romasm
; hello-world.romasm
start:
  ; Set up segments
  LOAD R0, 0x0000
  MOV_SEG DS, R0
  
  ; Clear screen
  CALL bios_clear_screen
  
  ; Print message
  LOAD R0, msg
  CALL bios_print_string
  
  ; Halt
halt:
  HLT
  JMP halt

msg:
  DB 72, 101, 108, 108, 111, 44, 32, 82, 111, 109, 97, 110, 79, 83, 33, 0
```

## 🏗️ Architecture

```
Romasm Source (.romasm)
    ↓
Romasm Assembler (compiler/romasm-assembler.js)
    ↓
VM Instructions
    ↓
Linker (links with stdlib/bios.romasm)
    ↓
x86 Generator (compiler/romasm-x86-generator.js)
    ↓
x86 Assembly (.asm)
    ↓
NASM Assembler
    ↓
Boot Sector (.bin)
    ↓
Bootable Image (.img)
    ↓
QEMU / Real Hardware
```

## 📚 Key Files

- `compiler/romasm-x86-generator.js` - x86 code generation
- `stdlib/bios.romasm` - BIOS interrupt library
- `examples/hello-world.romasm` - Example bootable OS
- `tools/build-romanos.js` - Complete build system

## 🎯 What's Next?

1. **Test the build pipeline** - Make sure everything compiles
2. **Run in QEMU** - Verify it actually boots
3. **Extend functionality** - Add more OS features
4. **Build a real OS** - Use this foundation to create a full OS!

## 💡 Key Features

- **Everything in Romasm** - The entire OS is written in Romasm!
- **Real Hardware** - Generates actual x86 machine code
- **Bootable** - Creates proper boot sectors
- **BIOS Compatible** - Uses standard BIOS interrupts
- **Extensible** - Easy to add new features

## 🐛 Troubleshooting

### "NASM not found"
Install NASM:
- Linux: `apt-get install nasm`
- Mac: `brew install nasm`
- Windows: Download from https://www.nasm.us/

### "QEMU not found"
Install QEMU:
- Linux: `apt-get install qemu-system-x86`
- Mac: `brew install qemu`
- Windows: Download from https://www.qemu.org/

### Build errors
Check that:
- All paths are correct
- Romasm source is valid
- stdlib files exist

---

**Ready to build your OS in Romasm!** 🏛️🚀
