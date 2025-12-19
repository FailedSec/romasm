# UEFI/GOP Support for RomanOS

Modern UEFI-based video support using Graphics Output Protocol (GOP).

## Directory Structure

```
uefi/
├── bootloader/        # UEFI bootloader entry point and initialization
├── gop/              # GOP protocol detection and mode management
├── framebuffer/      # Framebuffer management and pixel operations
├── fonts/            # Font data (PC Screen Fonts) and rendering
└── terminal/         # Terminal/console functions (putchar, print_string, etc.)

stdlib/uefi/          # UEFI standard library (replaces bios.romasm)

examples/uefi/        # UEFI-based examples
```

## Components

### Bootloader
- UEFI entry point (`uefi_main`)
- GOP protocol detection
- Boot services management
- System initialization

### GOP (Graphics Output Protocol)
- Protocol location via GUID
- Mode querying and selection
- Framebuffer address retrieval
- Mode information structures

### Framebuffer
- Pixel plotting (32-bit RGBA)
- Rectangle filling
- Direct memory access
- Double buffering support

### Fonts
- PC Screen Font (PSF) support
- Glyph rendering to framebuffer
- Character width/height management

### Terminal
- Framebuffer-based terminal emulator
- Character printing with font rendering
- Cursor management
- Line wrapping and scrolling
- String printing

## Building UEFI Programs

UEFI builds use `efi` mode instead of `native`:

```bash
node tools/build-romanos.js hello-world --efi
```

## Usage in Romasm

Replace BIOS calls with UEFI/GOP calls:

```romasm
; Initialize UEFI/GOP
CALL uefi_init
CALL gop_set_mode

; Print to framebuffer
LOAD R0, msg
CALL terminal_print_string
```

## Forward Compatibility

This implementation provides:
- ✅ Modern UEFI-only system support
- ✅ High-resolution graphics (up to 4K/8K)
- ✅ 32-bit true color
- ✅ Direct framebuffer access
- ✅ Linear pixel buffer (no banking)
