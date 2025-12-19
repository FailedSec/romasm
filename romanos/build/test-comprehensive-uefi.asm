; UEFI Application generated from Romasm
BITS 64

section .text
global efi_main
efi_main:
user_main:
    CALL uefi_init
    LEA RAX, [msg_header]
    CALL uefi_print_string
    LEA RAX, [msg_test1]
    CALL uefi_print_string
    CLD
    PUSHFQ
    POPFQ
    STD
    CLD
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test2]
    CALL uefi_print_string
    MOV RAX, 10
    MOV RBX, 10
    CMP RAX, RBX
    SETZ CL
    CMP RAX, RBX
    SETNZ DL
    MOV RAX, 5
    MOV RBX, 3
    CMP RAX, RBX
    SETG AL
    SETL AL
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test3]
    CALL uefi_print_string
    MOV RAX, 42
    NEG RAX
    MOV RAX, 5
    MOV RBX, 3
    ADD RAX, RBX
    MOV RCX, 2
    CLC
    ADC RCX, RAX
    MOV RAX, 10
    MOV RBX, 3
    SUB RAX, RBX
    MOV RCX, 15
    CLC
    SBB RCX, RAX
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test4]
    CALL uefi_print_string
    XOR RAX, RAX
    CMP RAX, 0
    MOV RBX, 100
    MOV RCX, 200
    CMOVZ RBX, RCX
    MOV RAX, 5
    XOR RBX, RBX
    CMP RAX, 0
    MOV RCX, 300
    CMOVNZ RBX, RCX
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test5]
    CALL uefi_print_string
    MOV RAX, 10
    MOV RBX, 20
    XCHG RAX, RBX
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test6]
    CALL uefi_print_string
    MOV RAX, 5
    BT RAX, 0
    SETC BL
    MOV RAX, 4
    BTS RAX, 0
    MOV RAX, 7
    BTR RAX, 0
    MOV RAX, 5
    BTC RAX, 1
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test7]
    CALL uefi_print_string
    MOV RAX, 20
    BSF RBX, RAX
    BSR RCX, RAX
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test8]
    CALL uefi_print_string
    MOV RAX, 1
    ROL RAX, 2
    MOV RAX, 4
    ROR RAX, 2
    CLC
    MOV RAX, 1
    RCL RAX, 1
    STC
    MOV RAX, 1
    RCR RAX, 1
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    LEA RAX, [msg_test9]
    CALL uefi_print_string
    MOV RAX, 5
    MOV RBX, 1
    TEST RAX, RBX
    JNE test_bit_set
    JMP test_bit_clear
test_bit_set:
    LEA RAX, [msg_passed]
    CALL uefi_print_string
    JMP tests_done
test_bit_clear:
    HLT
tests_done:
    LEA RAX, [msg_complete]
    CALL uefi_print_string
    MOV RAX, 50
    MOV RBX, 100
    MOV RCX, 200
    MOV RDX, 50
    MOV RSI, 4278190335
    CALL uefi_fill_rect
main_loop:
    JMP main_loop
msg_header:
    JMP uefi_exit
uefi_error:
    LEA RAX, [error_msg]
    CALL terminal_print_string
    MOV RAX, 2147483648
uefi_exit:
    POP RBP
    POP RDI
    POP RSI
    POP RDX
    POP RCX
    POP RBX
    RET
gop_init:
    PUSH RBX
    PUSH RCX
    PUSH RDX
msg_test1:
    PUSH RSI
    LEA RAX, [uefi_system_table]
    MOV RBX, QWORD [RAX]
    MOV RCX, 96
    ADD RBX, RCX
    MOV RCX, QWORD [RBX]
    LEA RDX, [uefi_boot_services]
    MOV QWORD [RDX], RCX
    LEA RAX, [gop_guid]
    XOR RBX, RBX
    LEA RCX, [uefi_gop]
    CALL uefi_locate_protocol
    CMP RAX, 0
    JE gop_init_success
    MOV RAX, 2147483650
    JMP gop_init_done
gop_init_success:
    XOR RAX, RAX
gop_init_done:
    POP RSI
    POP RDX
    POP RCX
    POP RBX
    RET
uefi_locate_protocol:
    PUSH RDX
    PUSH RSI
    LEA RDX, [uefi_boot_services]
    MOV RDX, QWORD [RDX]
    MOV RSI, 320
    ADD RDX, RSI
    MOV RSI, QWORD [RDX]
    CALL V
    POP RSI
    POP RDX
    RET
gop_query_current_mode:
    PUSH RCX
    PUSH RDX
    LEA RAX, [uefi_gop]
    MOV RAX, QWORD [RAX]
    MOV RCX, 24
    ADD RAX, RCX
    MOV RCX, QWORD [RAX]
    MOV RDX, QWORD [RCX]
    MOV RBX, RDX
msg_test2:
    XOR RAX, RAX
    POP RDX
    POP RCX
    RET
gop_set_mode:
    PUSH RBX
    PUSH RCX
    PUSH RDX
    PUSH RSI
    PUSH RDI
    LEA RAX, [uefi_gop]
    MOV RAX, QWORD [RAX]
    MOV RBX, 24
    ADD RAX, RBX
    MOV RCX, QWORD [RAX]
    MOV RDX, 8
    ADD RCX, RDX
    MOV RDX, QWORD [RCX]
    LEA RBX, [uefi_gop]
    MOV RBX, QWORD [RBX]
    MOV RCX, 8
    ADD RBX, RCX
    MOV RCX, QWORD [RBX]
    LEA RAX, [uefi_gop]
    MOV RAX, QWORD [RAX]
msg_test3:
    XOR RBX, RBX
    CALL III
    CMP RAX, 0
    JNE gop_set_mode_done
    CALL gop_get_framebuffer_info
gop_set_mode_done:
    POP RDI
    POP RSI
    POP RDX
    POP RCX
    POP RBX
    RET
gop_get_framebuffer_info:
    PUSH RBX
    PUSH RCX
    PUSH RDX
    LEA RAX, [uefi_gop]
    MOV RAX, QWORD [RAX]
    MOV RBX, 24
    ADD RAX, RBX
    MOV RBX, QWORD [RAX]
    MOV RCX, 16
    ADD RBX, RCX
    MOV RCX, QWORD [RBX]
    LEA RDX, [framebuffer_base]
    MOV QWORD [RDX], RCX
    MOV RCX, 24
    ADD RBX, RCX
    MOV RCX, QWORD [RBX]
    LEA RDX, [framebuffer_size]
    MOV QWORD [RDX], RCX
    MOV RCX, QWORD [RBX]
    MOV RDX, QWORD [RCX]
    LEA RBX, [framebuffer_width]
    MOV QWORD [RBX], RDX
    MOV RBX, 4
    ADD RCX, RBX
    MOV RDX, QWORD [RCX]
    LEA RBX, [framebuffer_height]
    MOV QWORD [RBX], RDX
    MOV RBX, 8
    ADD RCX, RBX
    MOV RDX, QWORD [RCX]
msg_test4:
    LEA RBX, [framebuffer_pitch]
    MOV QWORD [RBX], RDX
    XOR RAX, RAX
    POP RDX
    POP RCX
    POP RBX
    RET
fb_plot_pixel:
    PUSH RDX
    PUSH RSI
    PUSH RDI
    LEA RDX, [framebuffer_base]
    MOV RDX, QWORD [RDX]
    LEA RSI, [framebuffer_pitch]
    MOV RSI, QWORD [RSI]
    MOV RDI, RBX
    MUL RSI
    MOV RDI, RAX
    MOV RSI, RAX
    MOV RAX, 4
    MUL RAX
    MOV RSI, RAX
    ADD RDI, RSI
    ADD RDX, RDI
    MOV QWORD [RDX], RCX
    POP RDI
    POP RSI
    POP RDX
    RET
fb_fill_rect:
    PUSH RDI
    PUSH RBP
    PUSH RSP
    MOV RDI, RAX
    MOV RBP, RBX
    MOV RSP, RCX
msg_test5:
    MOV RAX, RBP
    ADD RBX, RDX
    CMP RAX, RBX
    JGE fb_fill_done
    MOV RAX, RDI
fb_fill_x_loop:
    MOV RBX, RDI
    ADD RBX, RSP
    CMP RAX, RBX
    JGE fb_fill_next_y
    MOV RBX, RBP
    MOV RCX, RSI
    CALL fb_plot_pixel
    INC RAX
    JMP fb_fill_x_loop
fb_fill_next_y:
    INC RBP
    JMP msg_test5
fb_fill_done:
    POP RSP
    POP RBP
    POP RDI
    RET
fb_clear:
    PUSH RBX
    PUSH RCX
    PUSH RDX
    XOR RBX, RBX
    XOR RCX, RCX
    LEA RDX, [framebuffer_width]
    MOV RDX, QWORD [RDX]
    PUSH RDX
    LEA RDX, [framebuffer_height]
msg_test6:
    MOV RDX, QWORD [RDX]
    POP RBX
    CALL fb_fill_rect
    POP RDX
    POP RCX
    POP RBX
    RET
fb_get_width:
    LEA RAX, [framebuffer_width]
    MOV RAX, QWORD [RAX]
    RET
fb_get_height:
    LEA RAX, [framebuffer_height]
    MOV RAX, QWORD [RAX]
    RET
fb_pack_color:
    PUSH RDX
    MOV RDX, 255
    AND RAX, RDX
    AND RBX, RDX
    AND RCX, RDX
    MOV RDX, 24
fb_pack_shift_r:
    CMP RDX, 0
    JE fb_pack_g
    SHL RAX, 1
    DEC RDX
    JMP fb_pack_shift_r
fb_pack_g:
    MOV RDX, RBX
    MOV RBX, 16
fb_pack_shift_g:
    CMP RBX, 0
    JE fb_pack_b
    SHL RDX, 1
    DEC RBX
    JMP fb_pack_shift_g
fb_pack_b:
    SHL RCX, 8
    OR RAX, RDX
    OR RAX, RCX
    MOV RDX, 255
    OR RAX, RDX
    POP RDX
    RET
font_get_glyph:
    PUSH RBX
    PUSH RCX
    CMP RAX, 32
    JL font_get_glyph_null
msg_test7:
    CMP RAX, 127
    JGE font_get_glyph_null
    MOV RBX, RAX
    SUB RBX, undefined
    MOV RCX, 16
    MUL RCX
    MOV RBX, RAX
    LEA RAX, [font_data]
    ADD RAX, RBX
    JMP font_get_glyph_done
font_get_glyph_null:
    XOR RAX, RAX
font_get_glyph_done:
    POP RCX
    POP RBX
    RET
font_render_glyph:
    PUSH RDI
    PUSH RBP
    PUSH RSP
    MOV RDI, RCX
    MOV RAX, RDI
    CALL font_get_glyph
    CMP RAX, 0
    JE font_render_done
    MOV RDI, RAX
    LEA RBP, [FONT_WIDTH]
    MOV RBP, QWORD [RBP]
    LEA RSP, [FONT_HEIGHT]
msg_test8:
    MOV RSP, QWORD [RSP]
    PUSH RAX
    PUSH RBX
    PUSH RDX
    PUSH RSI
    XOR RAX, RAX
font_render_row_loop:
    CMP RAX, RSP
    JGE font_render_done_cleanup
    MOV RBX, QWORD [RDI]
    INC RDI
    PUSH RAX
    XOR RAX, RAX
font_render_col_loop:
    CMP RAX, RBP
    JGE font_render_next_row
    MOV RCX, RBX
    MOV RDX, 7
    SUB RDX, RAX
    PUSH RBX
    MOV RBX, RCX
    MOV RDX, 128
    AND RBX, RDX
    POP RBX
    POP RDX
    POP RSI
    PUSH RSI
    PUSH RDX
    CMP RBX, 0
    JE font_render_bg
    MOV RCX, RDX
    JMP font_render_plot
font_render_bg:
    MOV RCX, RSI
font_render_plot:
    POP RDX
    POP RSI
    POP RBX
    POP RAX
    PUSH RAX
    PUSH RBX
    PUSH RDX
    PUSH RSI
    ADD RAX, RAX
    POP RSI
    POP RDX
    POP RBX
    POP RAX
    PUSH RAX
    PUSH RBX
msg_test9:
    POP RBX
    POP RAX
    ADD RAX, RAX
    INC RAX
    SHL RBX, 1
    JMP font_render_col_loop
font_render_next_row:
    POP RAX
    INC RAX
    JMP font_render_row_loop
font_render_done_cleanup:
    POP RSI
    POP RDX
    POP RBX
    POP RAX
font_render_done:
    POP RSP
    POP RBP
    POP RDI
    RET
font_render_char_simple:
    PUSH RSI
    PUSH RDI
    LEA RSI, [FONT_WIDTH]
    MOV RSI, QWORD [RSI]
    LEA RDI, [FONT_HEIGHT]
msg_passed:
    MOV RDI, QWORD [RDI]
    MOV RCX, RSI
    MOV RSI, RDX
    MOV RDX, RDI
    CALL fb_fill_rect
    POP RDI
msg_complete:
    POP RSI
    RET
terminal_init:
    PUSH RAX
    PUSH RBX
    XOR RAX, RAX
    CALL fb_clear
    XOR RAX, RAX
    LEA RBX, [terminal_cursor_x]
    MOV QWORD [RBX], RAX
    LEA RBX, [terminal_cursor_y]
    MOV QWORD [RBX], RAX
    MOV RAX, 4294967295
    LEA RBX, [terminal_fg_color]
    MOV QWORD [RBX], RAX
    XOR RAX, RAX
    LEA RBX, [terminal_bg_color]
    MOV QWORD [RBX], RAX
    POP RBX
    POP RAX
    RET
terminal_clear:
    PUSH RAX
    XOR RAX, RAX
    CALL fb_clear
    XOR RAX, RAX
    PUSH RBX
    LEA RBX, [terminal_cursor_x]
    MOV QWORD [RBX], RAX
    LEA RBX, [terminal_cursor_y]
    MOV QWORD [RBX], RAX
    POP RBX
    POP RAX
    RET
terminal_set_cursor:
    PUSH RCX
    LEA RCX, [terminal_cursor_x]
    MOV QWORD [RCX], RAX
    LEA RCX, [terminal_cursor_y]
    MOV QWORD [RCX], RBX
    POP RCX
    RET
terminal_advance_cursor:
    PUSH RAX
    PUSH RBX
    PUSH RCX
    LEA RAX, [terminal_cursor_x]
    MOV RAX, QWORD [RAX]
    LEA RBX, [terminal_cursor_y]
    MOV RBX, QWORD [RBX]
    LEA RCX, [FONT_WIDTH]
    MOV RCX, QWORD [RCX]
    ADD RAX, RCX
    PUSH RDX
    LEA RDX, [framebuffer_width]
    MOV RDX, QWORD [RDX]
    CMP RAX, RDX
uefi_image_handle:
    JL terminal_advance_done
    XOR RAX, RAX
    LEA RCX, [FONT_HEIGHT]
    MOV RCX, QWORD [RCX]
    ADD RBX, RCX
    LEA RDX, [framebuffer_height]
    MOV RDX, QWORD [RDX]
    CMP RBX, RDX
uefi_system_table:
    JL terminal_advance_done
    XOR RBX, RBX
terminal_advance_done:
    POP RDX
    LEA RCX, [terminal_cursor_x]
    MOV QWORD [RCX], RAX
    LEA RCX, [terminal_cursor_y]
    MOV QWORD [RCX], RBX
    POP RCX
uefi_boot_services:
    POP RBX
    POP RAX
    RET
terminal_putchar:
    PUSH RBX
    PUSH RCX
    PUSH RDX
    PUSH RSI
    CMP RAX, 10
uefi_gop:
    JE terminal_putchar_newline
    CMP RAX, 13
    JE terminal_putchar_return
    CMP RAX, 8
    JE terminal_putchar_backspace
    LEA RBX, [terminal_cursor_x]
    MOV RBX, QWORD [RBX]
    LEA RCX, [terminal_cursor_y]
welcome_msg:
    MOV RCX, QWORD [RCX]
    LEA RDX, [terminal_fg_color]
    MOV RDX, QWORD [RDX]
    LEA RSI, [terminal_bg_color]
    MOV RSI, QWORD [RSI]
    PUSH RAX
    MOV RAX, RBX
    MOV RBX, RCX
    MOV RCX, RAX
    POP RAX
    MOV RAX, RBX
    PUSH RAX
    MOV RAX, RBX
    MOV RBX, RCX
    MOV RCX, RAX
    POP RAX
    PUSH RAX
    LEA RAX, [terminal_cursor_x]
    MOV RAX, QWORD [RAX]
    LEA RBX, [terminal_cursor_y]
    MOV RBX, QWORD [RBX]
    MOV RCX, RAX
    POP RAX
    LEA RDX, [terminal_fg_color]
    MOV RDX, QWORD [RDX]
    CALL font_render_char_simple
    CALL terminal_advance_cursor
    JMP terminal_putchar_done
terminal_putchar_newline:
    XOR RAX, RAX
    LEA RBX, [terminal_cursor_x]
    MOV QWORD [RBX], RAX
    LEA RBX, [terminal_cursor_y]
    MOV RAX, QWORD [RBX]
    LEA RCX, [FONT_HEIGHT]
    MOV RCX, QWORD [RCX]
    ADD RAX, RCX
    MOV QWORD [RBX], RAX
    JMP terminal_putchar_done
terminal_putchar_return:
    XOR RAX, RAX
    LEA RBX, [terminal_cursor_x]
    MOV QWORD [RBX], RAX
    JMP terminal_putchar_done
terminal_putchar_backspace:
    LEA RAX, [terminal_cursor_x]
    MOV RAX, QWORD [RAX]
    LEA RBX, [FONT_WIDTH]
    MOV RBX, QWORD [RBX]
    SUB RAX, RBX
    CMP RAX, 0
    JGE terminal_backspace_ok
    XOR RAX, RAX
terminal_backspace_ok:
    LEA RBX, [terminal_cursor_x]
    MOV QWORD [RBX], RAX
    JMP terminal_putchar_done
terminal_putchar_done:
    POP RSI
    POP RDX
    POP RCX
    POP RBX
    RET
terminal_print_string:
    PUSH RBX
    PUSH RCX
    MOV RBX, RAX
terminal_print_loop:
    MOV RCX, QWORD [RBX]
    CMP RCX, 0
    JE terminal_print_done
    MOV RAX, RCX
    CALL terminal_putchar
    INC RBX
    JMP terminal_print_loop
terminal_print_done:
    POP RCX
    POP RBX
    RET
terminal_print_fb_info:
    PUSH RAX
    PUSH RBX
    LEA RAX, [fb_info_msg]
    CALL terminal_print_string
    CALL fb_get_width
    MOV RAX, 87
    CALL terminal_putchar
    MOV RAX, 58
    CALL terminal_putchar
    CALL fb_get_height
    MOV RAX, 72
    CALL terminal_putchar
    MOV RAX, 58
error_msg:
    CALL terminal_putchar
    MOV RAX, 10
    CALL terminal_putchar
    POP RBX
    POP RAX
    RET
uefi_init:
    CALL gop_init
    CMP RAX, 0
    JNE uefi_init_error
    CALL gop_set_mode
    CMP RAX, 0
    JNE uefi_init_error
    CALL terminal_init
    XOR RAX, RAX
    RET
uefi_init_error:
    RET
uefi_clear_screen:
    CALL terminal_clear
    RET
uefi_putc:
    CALL terminal_putchar
    RET
uefi_print_string:
    CALL terminal_print_string
    RET
uefi_newline:
    PUSH RAX
    MOV RAX, 10
    CALL terminal_putchar
    POP RAX
    RET
uefi_set_color:
    PUSH RDX
    PUSH RSI
    CALL fb_pack_color
    MOV RDX, RAX
    LEA RSI, [terminal_fg_color]
    MOV QWORD [RSI], RDX
    POP RSI
    POP RDX
    RET
uefi_set_bg_color:
    PUSH RDX
    PUSH RSI
    CALL fb_pack_color
    MOV RDX, RAX
    LEA RSI, [terminal_bg_color]
    MOV QWORD [RSI], RDX
    POP RSI
    POP RDX
    RET
uefi_set_cursor:
    PUSH RCX
    PUSH RDX
    LEA RCX, [FONT_WIDTH]
    MOV RCX, QWORD [RCX]
    MUL RCX
    LEA RDX, [FONT_HEIGHT]
    MOV RDX, QWORD [RDX]
    MUL RDX
    MOV RBX, RAX
    CALL terminal_set_cursor
    POP RDX
    POP RCX
    RET
uefi_get_width:
    CALL fb_get_width
    RET
uefi_get_height:
    CALL fb_get_height
    RET
uefi_draw_pixel:
    CALL fb_plot_pixel
    RET
uefi_fill_rect:
    CALL fb_fill_rect
    RET

section .data
gop_guid:
    db 84, 101, 115, 116, 105, 110, 103, 32, 97, 108, 108, 32, 110, 101, 119, 32, 105, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 115, 46, 46, 46, 10, 10, 0, 49, 46, 32, 70, 108, 97, 103, 32, 67, 111, 110, 116, 114, 111, 108, 32, 40, 67, 76, 68, 44, 32, 83, 84, 68, 44, 32, 80, 85, 83, 72, 70, 44, 32, 80, 79, 80, 70, 41, 58, 32, 0, 50, 46, 32, 83, 69, 84, 99, 99, 32, 73, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 115, 58, 32
framebuffer_base:
    db 0, 51, 46, 32, 69, 120, 116, 101, 110, 100, 101, 100, 32, 65, 114, 105
framebuffer_size:
    db 116, 104, 109, 101, 116, 105, 99, 32
framebuffer_width:
    db 40, 65, 68, 67, 44, 32, 83, 66
framebuffer_height:
    db 66, 44, 32, 78
framebuffer_pitch:
    db 69, 71, 41, 58
FB_COLOR_BLACK:
    db 32, 0, 52, 46, 32, 67, 111, 110, 100, 105, 116, 105, 111, 110, 97, 108, 32, 77, 111, 118, 101, 115, 32, 40, 67, 77, 79, 86, 99, 99, 41, 58, 32, 0, 53, 46, 32, 65, 116, 111, 109, 105, 99, 32, 79, 112, 101, 114, 97, 116, 105, 111, 110, 115, 32, 40, 88, 67, 72, 71, 41, 58, 32, 0, 54, 46, 32, 66, 105, 116, 32, 77, 97, 110, 105, 112, 117, 108, 97, 116, 105, 111, 110, 32, 40, 66, 84, 44, 32, 66, 84, 83, 44, 32, 66, 84, 82
FB_COLOR_WHITE:
    db 44, 32, 66, 84
FB_COLOR_RED:
    db 67, 41, 58, 32
FB_COLOR_GREEN:
    db 0, 55, 46, 32
FB_COLOR_BLUE:
    db 66, 105, 116, 32
FONT_WIDTH:
    db 83, 99, 97, 110, 32, 40, 66, 83, 70, 44, 32, 66, 83, 82, 41, 58, 32, 0, 56, 46, 32, 82, 111, 116, 97, 116, 101, 32, 73, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 115, 32, 40, 82, 79, 76, 44, 32, 82, 79, 82, 44, 32, 82, 67, 76, 44, 32, 82, 67, 82, 41, 58, 32, 0, 57, 46, 32, 84, 69, 83, 84, 32, 73, 110, 115, 116, 114, 117, 99, 116, 105, 111, 110, 58, 32, 0, 80, 65, 83, 83, 10, 0, 10, 65, 108, 108, 32, 116, 101, 115, 116, 115, 32, 99, 111, 109, 112, 108, 101
FONT_HEIGHT:
    db 116, 101, 33, 10
font_data:
    db 0, 0, 0
terminal_cursor_x:
    db 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 101, 108, 108, 111, 44, 32, 82, 111, 109, 97, 110, 79, 83, 32, 40, 85, 69, 70, 73, 47, 71, 79, 80, 32, 69, 100, 105, 116, 105, 111, 110, 41, 33, 13, 10, 77, 111, 100, 101, 114, 110, 32, 102, 114, 97, 109, 101, 98, 117, 102, 102, 101, 114, 45, 98, 97, 115, 101, 100, 32, 79, 83, 32, 119, 114, 105, 116, 116, 101, 110, 32, 105, 110, 32, 82, 111, 109, 97, 115, 109, 13, 10, 0, 69, 82, 82, 79, 82, 58, 32, 70, 97, 105, 108, 101, 100, 32, 116, 111, 32, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 32, 85, 69, 70, 73, 47, 71, 79, 80, 32, 115, 121, 115, 116, 101, 109, 13, 10, 0, 222, 169, 66, 144, 220, 35, 56, 74, 150, 251, 122, 222, 208, 128, 81, 106, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
terminal_cursor_y:
    db 0, 0, 255, 255
terminal_fg_color:
    db 255, 255, 255, 0
terminal_bg_color:
    db 0, 255, 255, 0
fb_info_msg:
    db 255, 0, 255, 255
    db 0, 0, 8, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 60, 60, 24, 24, 0, 24, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 0, 0, 0, 0, 70, 114, 97, 109, 101, 98, 117, 102, 102, 101, 114, 32, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 58, 32, 0
