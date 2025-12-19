# RomanOS - Operating System in Romasm

**RomanOS** is a real operating system written entirely in Romasm! This project demonstrates that Romasm is not just a virtual machine language, but can generate actual x86 machine code for bare-metal execution.

## 🏛️ What is RomanOS?

RomanOS is a complete foundation for building a real operating system using Romasm assembly language. It includes:

- **System Instructions** - Full set of OS-level instructions (INT, CLI, STI, HLT, IN, OUT, etc.)
- **BIOS Library** - Complete BIOS interrupt wrappers written in Romasm
- **x86 Code Generator** - Converts Romasm to real x86 assembly
- **Build System** - Automated pipeline from Romasm source to bootable images
- **Example OS** - Bootable "Hello World" OS

## 🚀 Quick Start

### Prerequisites

- Node.js (for build system)
- NASM (x86 assembler)
- QEMU (for testing)

Install dependencies:
```bash
# Linux
sudo apt-get install nasm qemu-system-x86

# Mac
brew install nasm qemu

# Windows
# Download NASM from https://www.nasm.us/
# Download QEMU from https://www.qemu.org/
```

### Build and Run

```bash
cd romanos

# Build the hello-world example
node tools/build-romanos.js hello-world

# Or use the build script
./tools/build.sh hello-world

# Run in QEMU
./tools/run.sh hello-world

# Or manually
qemu-system-x86_64 -drive file=build/hello-world.img,format=raw,if=floppy
```

## 📁 Project Structure

```
romanos/
├── compiler/
│   └── romasm-x86-generator.js  # x86 code generator
├── stdlib/
│   └── bios.romasm              # BIOS interrupt library
├── examples/
│   └── hello-world.romasm       # Example bootable OS
├── tools/
│   ├── build-romanos.js         # Complete build system
│   ├── romasm-to-x86.js         # Romasm to x86 converter
│   ├── build.sh                 # Build script
│   └── run.sh                   # Run script
├── build/                        # Build output directory
├── README.md                     # This file
├── QUICK_START.md               # Quick start guide
└── IMPLEMENTATION_STATUS.md     # Implementation status
```

## 📝 Writing Your Own OS

### Basic Structure

```romasm
; Your OS in Romasm
start:
  ; Set up segments
  LOAD R0, 0x0000
  MOV_SEG DS, R0
  
  ; Your code here
  CALL bios_clear_screen
  LOAD R0, msg
  CALL bios_print_string
  
  ; Halt
halt:
  HLT
  JMP halt

msg:
  DB 72, 101, 108, 108, 111, 0  ; "Hello"
```

### Available BIOS Functions

- `bios_putc` - Print character (R0 = character)
- `bios_clear_screen` - Clear screen
- `bios_get_key` - Read keyboard (returns in R0)
- `bios_print_string` - Print string (R0 = address)
- `bios_set_cursor` - Set cursor (R0 = row, R1 = column)

### System Instructions

- `INT n` - Software interrupt
- `IRET` - Return from interrupt
- `CLI` / `STI` - Interrupt flag control
- `HLT` - Halt CPU
- `IN` / `OUT` - I/O port operations
- `MOV_SEG` - Segment register operations
- `LOAD8` / `STORE8` / `MOV8` - 8-bit register operations

## 🏗️ Build Pipeline

```
Romasm Source (.romasm)
    ↓
Romasm Assembler
    ↓
VM Instructions
    ↓
Linker (links with stdlib)
    ↓
x86 Generator
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

## 🎯 Features

- ✅ **Everything in Romasm** - The entire OS is written in Romasm!
- ✅ **Real Hardware** - Generates actual x86 machine code
- ✅ **Bootable** - Creates proper boot sectors
- ✅ **BIOS Compatible** - Uses standard BIOS interrupts
- ✅ **Extensible** - Easy to add new features

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Implementation status
- [ROMANOS_ROADMAP.md](ROMANOS_ROADMAP.md) - Development roadmap

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

## 🎉 Success!

You now have a complete foundation for building a real OS in Romasm! The system includes:

- System instructions for OS development
- BIOS library for hardware interaction
- x86 code generator for real hardware
- Complete build system
- Working example OS

**Ready to build your OS in Romasm!** 🏛️🚀
