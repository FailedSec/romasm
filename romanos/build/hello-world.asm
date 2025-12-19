; Boot sector generated from Romasm
BITS 16
ORG 0x7C00

start:
    MOV AX, 0
    MOV DS, AX
    MOV AX, 0
    MOV SS, AX
    MOV SP, 31744
    CALL bios_clear_screen
    MOV AX, msg
    CALL bios_print_string
halt:
    NOP
    NOP
    NOP
    JMP halt
bios_putc:
    PUSH BX
    PUSH CX
    MOV BX, AX
    MOV AX, 3584
    ADD AX, BX
    MOV BX, 7
    INT 0x10
    POP CX
    POP BX
    RET
bios_clear_screen:
    PUSH AX
    PUSH BX
    MOV AX, 3
    INT 0x10
    POP BX
    POP AX
    RET
bios_get_key:
    PUSH BX
    MOV AX, 0
    INT 0x16
    POP BX
    RET
bios_key_available:
    PUSH BX
    MOV AX, 256
    INT 0x16
    MOV AX, 1
    POP BX
    RET
bios_print_string:
    PUSH BX
    PUSH CX
    MOV BX, AX
bios_print_loop:
    MOV CL, BYTE [BX]
    XOR CH, CH
    CMP CX, 0
    JE bios_print_done
    MOV AX, CX
    CALL bios_putc
    INC BX
    JMP bios_print_loop
bios_print_done:
    POP CX
    POP BX
    RET
bios_set_cursor:
    PUSH CX
    INT 0x10
    POP CX
    RET

; Data section
msg:
    db 72
    db 101, 108, 108, 111, 44, 32, 82, 111, 109, 97, 110, 79, 83, 33, 13, 10, 0

; Boot signature (0xAA55) will be added at offset 510
times 510 - ($ - $$) db 0
dw 0xAA55
