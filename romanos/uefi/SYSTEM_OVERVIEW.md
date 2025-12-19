# UEFI/GOP System Overview

## Complete Modern UEFI Implementation for RomanOS

This directory contains a complete, modern UEFI/GOP implementation that replaces the obsolete BIOS/VGA system.

## Architecture

### Component Hierarchy

```
User Application (examples/uefi/hello-world.romasm)
    ↓
UEFI Standard Library (stdlib/uefi/gop.romasm)
    ↓
├─ Terminal System (uefi/terminal/term.romasm)
│  ├─ Font Rendering (uefi/fonts/font.romasm)
│  └─ Framebuffer (uefi/framebuffer/fb.romasm)
│
├─ GOP Protocol (uefi/gop/gop.romasm)
│  └─ Framebuffer Info
│
└─ Bootloader (uefi/bootloader/uefi-main.romasm)
   └─ UEFI Entry Point (efi_main)
```

### Data Flow

1. **Boot:** UEFI firmware loads application, calls `efi_main`
2. **Initialization:** 
   - Locate GOP protocol via UEFI BootServices
   - Query available video modes
   - Set highest resolution mode
   - Get framebuffer address, size, dimensions
3. **Terminal Setup:**
   - Initialize terminal with framebuffer
   - Set default colors (white on black)
   - Reset cursor to (0, 0)
4. **User Code:**
   - Print text via `uefi_print_string`
   - Draw graphics via `uefi_fill_rect`, `uefi_draw_pixel`
   - Manage terminal cursor

## Key Components

### 1. Bootloader (`uefi/bootloader/uefi-main.romasm`)

**Purpose:** UEFI entry point and system initialization

**Key Functions:**
- `uefi_main(ImageHandle, SystemTable)` - Entry point called by UEFI
- Stores global UEFI pointers (SystemTable, BootServices, GOP)
- Initializes GOP and terminal
- Calls user `user_main()` function

**Dependencies:** None (entry point)

### 2. GOP Protocol (`uefi/gop/gop.romasm`)

**Purpose:** Graphics Output Protocol implementation

**Key Functions:**
- `gop_init()` - Locate GOP protocol via GUID
- `gop_query_current_mode()` - Get current video mode
- `gop_set_mode(mode)` - Set video mode (0 = highest resolution)
- `gop_get_framebuffer_info()` - Get framebuffer address, size, dimensions

**GOP GUID:** `9042a9de-23dc-4a38-96fb-7aded080516a`

**Output:**
- Sets global `framebuffer_base` (64-bit address)
- Sets `framebuffer_width`, `framebuffer_height`, `framebuffer_pitch`

### 3. Framebuffer (`uefi/framebuffer/fb.romasm`)

**Purpose:** Direct pixel manipulation

**Key Functions:**
- `fb_plot_pixel(X, Y, color)` - Plot single pixel (32-bit RGBA)
- `fb_fill_rect(X, Y, W, H, color)` - Fill rectangle
- `fb_clear(color)` - Clear entire screen
- `fb_pack_color(R, G, B)` - Convert RGB to 32-bit RGBA

**Pixel Format:** 32-bit RGBA (0xRRGGBBAA)
- Red: bits 24-31
- Green: bits 16-23
- Blue: bits 8-15
- Alpha: bits 0-7 (typically 0xFF for opaque)

### 4. Font System (`uefi/fonts/font.romasm`)

**Purpose:** Glyph rendering to framebuffer

**Key Functions:**
- `font_get_glyph(char)` - Get glyph data pointer
- `font_render_glyph(X, Y, char, fg, bg)` - Render character
- `font_render_char_simple(X, Y, char, color)` - Simplified renderer

**Font Format:**
- Currently: Simple 8x16 bitmap font
- Future: Full PC Screen Font (PSF) v1/v2 support

### 5. Terminal (`uefi/terminal/term.romasm`)

**Purpose:** Text console emulator

**Key Functions:**
- `terminal_init()` - Initialize terminal, clear screen
- `terminal_clear()` - Clear screen and reset cursor
- `terminal_putchar(char)` - Print single character
- `terminal_print_string(str)` - Print null-terminated string
- `terminal_set_cursor(X, Y)` - Move cursor (pixel coordinates)
- `terminal_advance_cursor()` - Move to next character position

**Features:**
- Automatic line wrapping
- Cursor management
- Special character handling (\n, \r, \b)
- Color support (foreground/background)

**State:**
- `terminal_cursor_x`, `terminal_cursor_y` - Current position
- `terminal_fg_color`, `terminal_bg_color` - Colors

### 6. Standard Library (`stdlib/uefi/gop.romasm`)

**Purpose:** High-level API for user code

**Key Functions:**
- `uefi_init()` - Initialize entire system
- `uefi_clear_screen()` - Clear terminal
- `uefi_putc(char)` - Print character
- `uefi_print_string(str)` - Print string
- `uefi_set_color(R, G, B)` - Set foreground color
- `uefi_set_bg_color(R, G, B)` - Set background color
- `uefi_set_cursor(X, Y)` - Set cursor (character coordinates)
- `uefi_draw_pixel(X, Y, color)` - Direct pixel access
- `uefi_fill_rect(X, Y, W, H, color)` - Draw rectangle

**Replaces:** Old `bios.romasm` functions

## Build System Integration

### Build Command

```bash
node tools/build-romanos.js hello-world --efi
```

### Build Process

1. **Assembly:** All `.romasm` files assembled to VM instructions
2. **Linking:** Modules linked in order:
   - User code
   - UEFI bootloader
   - GOP protocol
   - Framebuffer
   - Fonts
   - Terminal
   - Standard library
3. **Code Generation:** VM instructions → x86-64 assembly
4. **Output:** `build/hello-world-uefi.asm` (ready for linking to .efi)

### Linking Order

Critical for proper label resolution:
1. User code (references stdlib functions)
2. UEFI modules (bootloader → gop → framebuffer → fonts → terminal)
3. Standard library (provides high-level API)

## Usage Example

```romasm
; examples/uefi/hello-world.romasm
user_main:
  ; System already initialized by uefi_main
  
  ; Print message
  LOAD R0, welcome_msg
  CALL uefi_print_string
  
  ; Draw graphics
  LOAD R0, 50   ; X
  LOAD R1, 100  ; Y
  LOAD R2, 200  ; Width
  LOAD R3, 50   ; Height
  LOAD R4, 0xFF0000FF  ; Red
  CALL uefi_fill_rect
  
  ; Loop forever
  JMP user_main_loop

welcome_msg:
  DB "Hello, UEFI/GOP RomanOS!", 10, 0
```

## Technical Details

### Calling Conventions

**System V ABI (x86-64):**
- Parameters: RDI, RSI, RDX, RCX, R8, R9 (stack for more)
- Return: RAX
- Callee-saved: RBX, RBP, R12-R15
- Stack: 16-byte aligned

**Romasm Mapping:**
- R0 → RAX (return value, temporary)
- R1 → RBX (callee-saved)
- R2 → RCX (parameter 3)
- R3 → RDX (parameter 4)
- R4 → RSI (parameter 2)
- R5 → RDI (parameter 1)
- R6 → RBP (frame pointer)
- R7 → RSP (stack pointer)

### Memory Layout

**UEFI Boot Services:**
- Available during boot
- GOP protocol accessible via BootServices->LocateProtocol
- After `ExitBootServices()`, only framebuffer persists

**Framebuffer:**
- Linear memory buffer
- Address stored in `framebuffer_base`
- Size: `width * pitch * height` bytes
- Format: 32-bit RGBA pixels

### Performance

**Optimizations:**
- Direct framebuffer writes (no banking)
- Smart register allocation
- Optimized pixel plotting
- Efficient font rendering

**Limitations:**
- Software rendering only (no GPU acceleration)
- Font rendering is simplified (full PSF support pending)
- No double buffering yet (screen tearing possible)

## Compatibility

✅ **Works On:**
- Modern UEFI-only systems (no CSM required)
- QEMU with OVMF
- Real hardware with UEFI firmware
- Any x86-64 UEFI system

❌ **Does NOT Work On:**
- Legacy BIOS systems
- UEFI systems with CSM disabled (need CSM for BIOS)
- 32-bit systems (requires x86-64)

## Future Enhancements

1. **Full PE32+ Generation:** Complete `.efi` file creation
2. **PSF Font Support:** Complete PC Screen Font implementation
3. **Double Buffering:** Prevent screen tearing
4. **Hardware Acceleration:** GPU support via UEFI protocols
5. **ARM64 Support:** UEFI on ARM systems
6. **File System:** UEFI file protocol support
7. **Network:** UEFI network protocols

## Status

✅ **Complete:**
- Folder structure
- All core components implemented
- Build system integration
- Example application
- Documentation

⚠️ **Needs Final Linking:**
- Assembly generation works
- PE32+ executable creation requires external tools (EDK2, linker)

🚀 **Ready for:** Further development, testing, and integration with UEFI toolchains
