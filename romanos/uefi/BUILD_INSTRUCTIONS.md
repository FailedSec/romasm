# Building UEFI/GOP Applications

## Overview

RomanOS now supports modern UEFI systems using Graphics Output Protocol (GOP) for framebuffer-based graphics. This replaces the deprecated BIOS/VGA text mode approach.

## Quick Start

```bash
# Build UEFI application
node tools/build-romanos.js hello-world --efi

# This generates:
# - build/hello-world-uefi.asm (x86-64 assembly)
```

## Building Complete UEFI Executables

The build system generates x86-64 assembly code, but creating a bootable `.efi` file requires additional steps:

### Option 1: Using NASM + Linker (Manual)

```bash
# 1. Assemble to object file
nasm -f win64 -o hello-world.obj build/hello-world-uefi.asm

# 2. Link to PE32+ executable (requires linker with UEFI support)
# This is complex and requires proper PE structure setup
```

### Option 2: Using EDK2 (Recommended for Production)

The EDK2 (EFI Development Kit II) provides a complete build environment:

1. **Install EDK2:**
   ```bash
   git clone https://github.com/tianocore/edk2.git
   cd edk2
   git submodule update --init
   ```

2. **Build EDK2 BaseTools:**
   ```bash
   make -C BaseTools
   ```

3. **Set up environment:**
   ```bash
   export EDK_TOOLS_PATH=$PWD/BaseTools
   . edksetup.sh
   ```

4. **Configure and build:**
   ```bash
   # Copy your generated .asm file to your application directory
   # Configure build to include your Romasm-generated code
   build
   ```

### Option 3: Using QEMU with OVMF (Testing)

For testing UEFI applications without full EDK2 setup:

1. **Download OVMF (Open Virtual Machine Firmware):**
   ```bash
   # Linux
   sudo apt-get install ovmf
   
   # Or download from: https://github.com/tianocore/edk2/tree/master/OvmfPkg
   ```

2. **Run QEMU with UEFI:**
   ```bash
   qemu-system-x86_64 \
     -bios /usr/share/ovmf/OVMF.fd \
     -drive format=raw,file=your-app.efi \
     -net none
   ```

## Architecture

### Folder Structure

```
uefi/
├── bootloader/        # UEFI entry point (efi_main)
├── gop/              # Graphics Output Protocol implementation
├── framebuffer/      # Pixel buffer management
├── fonts/            # Font rendering system
└── terminal/         # Text terminal emulator

stdlib/uefi/          # High-level UEFI functions

examples/uefi/        # UEFI-based examples
```

### Component Dependencies

1. **uefi-main.romasm** - Entry point, initializes system
2. **gop.romasm** - Locates and initializes GOP protocol
3. **fb.romasm** - Framebuffer pixel operations
4. **font.romasm** - Glyph rendering
5. **term.romasm** - Terminal/console functions
6. **stdlib/uefi/gop.romasm** - High-level API

### Calling Convention

UEFI uses **System V ABI** for x86-64:
- Arguments: RDI, RSI, RDX, RCX, R8, R9 (stack for more)
- Return: RAX
- Callee-saved: RBX, RBP, R12-R15
- Stack alignment: 16 bytes

### Register Mapping (Romasm → x86-64)

- R0 (I) → RAX
- R1 (II) → RBX
- R2 (III) → RCX
- R3 (IV) → RDX
- R4 (V) → RSI
- R5 (VI) → RDI
- R6 (VII) → RBP
- R7 (VIII) → RSP

## Key Features

✅ **Modern UEFI Support** - Works on UEFI-only systems (no CSM required)  
✅ **High Resolution** - Supports up to 4K/8K resolutions  
✅ **32-bit True Color** - Full RGBA pixel support  
✅ **Framebuffer Graphics** - Direct pixel manipulation  
✅ **Font Rendering** - Custom glyph rendering system  
✅ **Terminal Emulator** - Full text console with cursor management  

## Limitations

- Currently generates assembly code only (PE32+ linking requires external tools)
- Font system uses simplified rendering (full PSF support coming)
- No hardware acceleration (pure software rendering)
- Limited to 64-bit x86 systems (no ARM yet)

## Future Enhancements

- [ ] Full PE32+ executable generation
- [ ] Complete PSF font support
- [ ] Hardware acceleration support
- [ ] ARM64 UEFI support
- [ ] UEFI file system access
- [ ] Network support via UEFI protocols

## Resources

- [OSDev Wiki: GOP](https://wiki.osdev.org/GOP)
- [OSDev Wiki: UEFI](https://wiki.osdev.org/UEFI)
- [UEFI Specification](https://uefi.org/specifications)
- [EDK2 Documentation](https://github.com/tianocore/tianocore.github.io/wiki/EDK-II)
