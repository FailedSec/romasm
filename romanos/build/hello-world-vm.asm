; Romasm VM Bootloader
; This is a minimal x86 bootloader that loads and executes Romasm bytecode
; Users never write or modify this - it's the VM runtime

BITS 16
ORG 0x7C00

; VM State Structure (in memory at 0x6000)
; Offset 0x0000: VM Registers (R0-R7, 16 bytes = 8 words)
; Offset 0x0010: VM Flags (2 bytes: equal flag, less flag, greater flag)
; Offset 0x0012: VM Stack Pointer (2 bytes)
; Offset 0x0014: VM Program Counter (2 bytes)
; Offset 0x0016: VM Memory base address (2 bytes)
; Offset 0x0018: Bytecode base address (2 bytes)
; Offset 0x001A: Bytecode instruction offset (skip header)
; Offset 0x001C: Instruction count (2 bytes)
; Offset 0x001E: Data section offset (2 bytes)
; Offset 0x0020: Stack space (4096 bytes)

VM_BASE equ 0x6000
VM_REGS equ VM_BASE + 0x0000
VM_FLAGS equ VM_BASE + 0x0010
VM_SP equ VM_BASE + 0x0012
VM_PC equ VM_BASE + 0x0014
VM_MEMORY equ VM_BASE + 0x0016
VM_BYTECODE equ VM_BASE + 0x0018
VM_INST_OFFSET equ VM_BASE + 0x001A
VM_INST_COUNT equ VM_BASE + 0x001C
VM_DATA_OFFSET equ VM_BASE + 0x001E
VM_STACK equ VM_BASE + 0x0020
STACK_SIZE equ 4096

; Operand decoding temp storage
TEMP_REG equ VM_BASE + 0x2000
TEMP_VALUE equ VM_BASE + 0x2002
TEMP_TYPE equ VM_BASE + 0x2004

start:
    ; Initialize segment registers
    cli
    mov ax, 0
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00  ; Stack grows downward from boot sector

    ; Clear screen
    mov ax, 3
    int 0x10

    ; Initialize VM
    call vm_init

    ; Load bytecode (embedded after bootloader)
    call vm_load_bytecode

    ; Execute VM
    call vm_execute

    ; Halt
halt_loop:
    hlt
    jmp halt_loop

; Initialize VM state
vm_init:
    push ax
    push bx
    push cx
    push di

    ; Clear VM registers (R0-R7, 8 words)
    mov di, VM_REGS
    mov cx, 8
    xor ax, ax
    rep stosw

    ; Initialize flags (3 bytes: equal, less, greater)
    mov byte [VM_FLAGS], 0
    mov byte [VM_FLAGS+1], 0
    mov byte [VM_FLAGS+2], 0

    ; Initialize stack pointer (grows downward)
    mov word [VM_SP], VM_STACK + STACK_SIZE

    ; Initialize program counter
    mov word [VM_PC], 0

    ; Set memory base (for data section)
    mov word [VM_MEMORY], VM_BASE + 0x3000

    pop di
    pop cx
    pop bx
    pop ax
    ret

; Load bytecode and parse header
vm_load_bytecode:
    push ax
    push bx
    push cx
    push si
    push di

    ; Point to bytecode start
    mov si, bytecode_start
    
    ; Verify magic number "RMSM"
    cmp dword [si], 0x4D534D52  ; "RMSM" in little-endian
    jne vm_load_error
    add si, 4
    
    ; Skip version (2 bytes)
    add si, 2
    
    ; Read instruction count
    mov ax, word [si]
    mov word [VM_INST_COUNT], ax
    add si, 2
    
    ; Store instruction section offset (where instructions start)
    mov word [VM_INST_OFFSET], si
    mov word [VM_BYTECODE], si
    
    ; Skip to data section (calculate: need to decode all instructions first)
    ; For now, assume bytecode_start is the base
    ; TODO: Properly calculate data offset after parsing instructions
    
    pop di
    pop si
    pop cx
    pop bx
    pop ax
    ret

vm_load_error:
    ; Show error message
    mov si, error_msg
    call print_string
    jmp halt_loop

; Main VM execution loop
vm_execute:
    push ax
    push bx
    push cx
    push dx
    push si
    push di
    push bp
    mov bp, sp

vm_loop:
    ; Check if PC exceeds instruction count
    mov ax, word [VM_PC]
    cmp ax, word [VM_INST_COUNT]
    jge vm_done
    
    ; Get instruction pointer
    mov si, word [VM_BYTECODE]
    call get_instruction_addr  ; SI = address of current instruction
    
    ; Read opcode
    mov al, byte [si]
    inc si  ; Move past opcode
    
    ; Save instruction pointer for operand decoding
    mov word [TEMP_VALUE], si
    
    ; Execute instruction based on opcode
    cmp al, 0x00  ; NOP
    je vm_nop
    cmp al, 0x01  ; LOAD
    je vm_load_instr
    cmp al, 0x02  ; STORE
    je vm_store_instr
    cmp al, 0x03  ; ADD
    je vm_add_instr
    cmp al, 0x04  ; SUB
    je vm_sub_instr
    cmp al, 0x07  ; INC
    je vm_inc_instr
    cmp al, 0x08  ; DEC
    je vm_dec_instr
    cmp al, 0x09  ; CMP
    je vm_cmp_instr
    cmp al, 0x0A  ; JMP
    je vm_jmp_instr
    cmp al, 0x0B  ; JEQ
    je vm_jeq_instr
    cmp al, 0x0C  ; JNE
    je vm_jne_instr
    cmp al, 0x11  ; CALL
    je vm_call_instr
    cmp al, 0x12  ; RET
    je vm_ret_instr
    cmp al, 0x13  ; PUSH
    je vm_push_instr
    cmp al, 0x14  ; POP
    je vm_pop_instr
    cmp al, 0x15  ; INT
    je vm_int_instr
    cmp al, 0x1A  ; HLT
    je vm_hlt_instr
    
    ; Unknown instruction - skip it (shouldn't happen)
    jmp vm_loop_continue

vm_loop_continue:
    ; Increment PC (unless instruction modified it)
    inc word [VM_PC]
    jmp vm_loop

vm_done:
    mov sp, bp
    pop bp
    pop di
    pop si
    pop dx
    pop cx
    pop bx
    pop ax
    ret

; Get instruction address at PC
; Input: VM_PC
; Output: SI = address of instruction
get_instruction_addr:
    push ax
    push bx
    push cx
    push dx
    
    ; This is complex - need to decode all previous instructions to find current one
    ; For simplicity, we'll use a different approach:
    ; Store instruction offsets in a table, or decode on-the-fly
    
    ; For now, use a simple approach: decode from start until we reach PC
    mov si, word [VM_BYTECODE]
    mov cx, word [VM_PC]
    cmp cx, 0
    je get_inst_done
    
get_inst_loop:
    ; Read opcode
    mov al, byte [si]
    inc si
    
    ; Skip operands based on opcode
    call skip_operands_for_opcode
    
    loop get_inst_loop

get_inst_done:
    pop dx
    pop cx
    pop bx
    pop ax
    ret

; Skip operands for an opcode
; Input: AL = opcode, SI = current position
; Output: SI = position after operands
skip_operands_for_opcode:
    push ax
    push cx
    
    ; Determine operand count and types based on opcode
    ; This is a simplified version - real implementation needs full operand parsing
    cmp al, 0x00  ; NOP
    je skip_done
    cmp al, 0x01  ; LOAD - 2 operands
    je skip_2_operands
    cmp al, 0x02  ; STORE - 2 operands
    je skip_2_operands
    cmp al, 0x03  ; ADD - 2-3 operands (usually 2)
    je skip_2_operands
    cmp al, 0x04  ; SUB - 2 operands
    je skip_2_operands
    cmp al, 0x07  ; INC - 1 operand
    je skip_1_operand
    cmp al, 0x08  ; DEC - 1 operand
    je skip_1_operand
    cmp al, 0x09  ; CMP - 2 operands
    je skip_2_operands
    cmp al, 0x0A  ; JMP - 1 operand (label)
    je skip_label_operand
    cmp al, 0x0B  ; JEQ - 1 operand (label)
    je skip_label_operand
    cmp al, 0x0C  ; JNE - 1 operand (label)
    je skip_label_operand
    cmp al, 0x11  ; CALL - 1 operand (label)
    je skip_label_operand
    cmp al, 0x12  ; RET - 0 operands
    je skip_done
    cmp al, 0x13  ; PUSH - 1 operand
    je skip_1_operand
    cmp al, 0x14  ; POP - 1 operand
    je skip_1_operand
    cmp al, 0x15  ; INT - 1 operand (immediate)
    je skip_immediate_operand
    cmp al, 0x1A  ; HLT - 0 operands
    je skip_done
    
    ; Default: try to skip 1 byte (register)
    inc si
    jmp skip_done

skip_1_operand:
    ; Try to decode and skip 1 operand
    call skip_operand
    jmp skip_done

skip_2_operands:
    call skip_operand
    call skip_operand
    jmp skip_done

skip_immediate_operand:
    ; Immediate: 0x80 + 2 bytes
    cmp byte [si], 0x80
    je skip_imm
    ; Might be register (1 byte)
    inc si
    jmp skip_done
skip_imm:
    add si, 3  ; Skip flag + 2 bytes
    jmp skip_done

skip_label_operand:
    ; Label: 0xA0 + 2 bytes
    cmp byte [si], 0xA0
    je skip_lbl
    ; Might be register (1 byte) - shouldn't happen for labels
    inc si
    jmp skip_done
skip_lbl:
    add si, 3  ; Skip flag + 2 bytes
    jmp skip_done

skip_operand:
    push ax
    mov al, byte [si]
    cmp al, 0x80  ; Immediate
    je skip_op_imm
    cmp al, 0x90  ; Memory
    je skip_op_mem
    cmp al, 0xA0  ; Label
    je skip_op_lbl
    ; Register (1 byte)
    inc si
    jmp skip_op_done
skip_op_imm:
    add si, 3  ; flag + 2 bytes
    jmp skip_op_done
skip_op_mem:
    add si, 3  ; flag + reg + offset
    jmp skip_op_done
skip_op_lbl:
    add si, 3  ; flag + 2 bytes
skip_op_done:
    pop ax
    ret

skip_done:
    pop cx
    pop ax
    ret

; Decode operand
; Input: SI = position in bytecode
; Output: AX = value, BL = type (0=reg, 1=imm, 2=label, 3=memory)
;         SI = position after operand
decode_operand:
    push cx
    push dx
    
    mov al, byte [si]
    cmp al, 0x80  ; Immediate
    je decode_imm
    cmp al, 0x90  ; Memory
    je decode_mem
    cmp al, 0xA0  ; Label
    je decode_lbl
    ; Register
    mov bl, 0
    movzx ax, al  ; Register number
    inc si
    jmp decode_done

decode_imm:
    mov bl, 1
    inc si  ; Skip flag
    mov ax, word [si]  ; Read 16-bit value (little-endian)
    add si, 2
    jmp decode_done

decode_mem:
    mov bl, 3
    inc si  ; Skip flag
    mov al, byte [si]  ; Register containing address
    movzx ax, al
    inc si
    inc si  ; Skip offset (for now)
    jmp decode_done

decode_lbl:
    mov bl, 2
    inc si  ; Skip flag
    mov ax, word [si]  ; Label address
    add si, 2
    jmp decode_done

decode_done:
    pop dx
    pop cx
    ret

; Get register value
; Input: AL = register number (0-7)
; Output: AX = register value
get_reg:
    push bx
    push si
    movzx bx, al
    shl bx, 1  ; Multiply by 2 (word size)
    mov si, VM_REGS
    add si, bx
    mov ax, word [si]
    pop si
    pop bx
    ret

; Set register value
; Input: AL = register number (0-7), DX = value
set_reg:
    push bx
    push si
    movzx bx, al
    shl bx, 1
    mov si, VM_REGS
    add si, bx
    mov word [si], dx
    pop si
    pop bx
    ret

; Instruction implementations

vm_nop:
    ; No operation
    jmp vm_loop_continue

vm_load_instr:
    ; LOAD reg, source
    mov si, word [TEMP_VALUE]
    call decode_operand  ; AX = register, BL = type
    push ax  ; Save register number
    
    call decode_operand  ; AX = source value/register, BL = type
    mov dx, ax  ; Value to load
    
    pop ax  ; Restore register number
    
    ; If source was register, get its value
    cmp bl, 0
    jne vm_load_set
    push ax
    mov al, dl
    call get_reg
    mov dx, ax
    pop ax
    
vm_load_set:
    call set_reg
    jmp vm_loop_continue

vm_store_instr:
    ; STORE source, [dest]
    mov si, word [TEMP_VALUE]
    call decode_operand  ; Source register
    push ax
    call get_reg  ; Get source value
    push ax
    
    call decode_operand  ; Destination (memory)
    ; TODO: Handle memory store
    ; For now, just skip
    
    pop ax
    pop ax
    jmp vm_loop_continue

vm_add_instr:
    ; ADD reg1, reg2 (or reg1, imm)
    mov si, word [TEMP_VALUE]
    call decode_operand  ; First operand (destination)
    push ax
    call get_reg
    push ax  ; Save first value
    
    call decode_operand  ; Second operand
    mov dx, ax
    cmp bl, 0  ; Register?
    jne vm_add_imm
    push ax
    mov al, dl
    call get_reg
    mov dx, ax
    pop ax
    
vm_add_imm:
    pop ax  ; First value
    add ax, dx  ; Add
    pop dx  ; Register number
    push ax
    mov al, dl
    pop dx
    call set_reg
    jmp vm_loop_continue

vm_sub_instr:
    ; SUB reg1, reg2
    mov si, word [TEMP_VALUE]
    call decode_operand
    push ax
    call get_reg
    push ax
    
    call decode_operand
    mov dx, ax
    cmp bl, 0
    jne vm_sub_imm
    push ax
    mov al, dl
    call get_reg
    mov dx, ax
    pop ax
    
vm_sub_imm:
    pop ax
    sub ax, dx
    pop dx
    push ax
    mov al, dl
    pop dx
    call set_reg
    jmp vm_loop_continue

vm_inc_instr:
    ; INC reg
    mov si, word [TEMP_VALUE]
    call decode_operand
    push ax
    call get_reg
    inc ax
    pop dx
    push ax
    mov al, dl
    pop dx
    call set_reg
    jmp vm_loop_continue

vm_dec_instr:
    ; DEC reg
    mov si, word [TEMP_VALUE]
    call decode_operand
    push ax
    call get_reg
    dec ax
    pop dx
    push ax
    mov al, dl
    pop dx
    call set_reg
    jmp vm_loop_continue

vm_cmp_instr:
    ; CMP reg1, reg2/imm
    mov si, word [TEMP_VALUE]
    call decode_operand
    push ax
    call get_reg
    push ax
    
    call decode_operand
    mov dx, ax
    cmp bl, 0
    jne vm_cmp_imm
    push ax
    mov al, dl
    call get_reg
    mov dx, ax
    pop ax
    
vm_cmp_imm:
    pop ax
    cmp ax, dx
    ; Set flags
    mov byte [VM_FLAGS], 0  ; equal
    mov byte [VM_FLAGS+1], 0  ; less
    mov byte [VM_FLAGS+2], 0  ; greater
    je vm_cmp_eq
    jl vm_cmp_lt
    mov byte [VM_FLAGS+2], 1  ; greater
    jmp vm_cmp_done
vm_cmp_eq:
    mov byte [VM_FLAGS], 1
    jmp vm_cmp_done
vm_cmp_lt:
    mov byte [VM_FLAGS+1], 1
vm_cmp_done:
    pop ax
    jmp vm_loop_continue

vm_jmp_instr:
    ; JMP label
    mov si, word [TEMP_VALUE]
    call decode_operand
    mov word [VM_PC], ax
    jmp vm_loop

vm_jeq_instr:
    ; JEQ label (if equal)
    cmp byte [VM_FLAGS], 1
    jne vm_loop_continue
    mov si, word [TEMP_VALUE]
    call decode_operand
    mov word [VM_PC], ax
    jmp vm_loop

vm_jne_instr:
    ; JNE label (if not equal)
    cmp byte [VM_FLAGS], 1
    je vm_loop_continue
    mov si, word [TEMP_VALUE]
    call decode_operand
    mov word [VM_PC], ax
    jmp vm_loop

vm_call_instr:
    ; CALL label
    ; Push return address (PC + 1)
    mov ax, word [VM_PC]
    inc ax
    mov si, word [VM_SP]
    dec si
    dec si
    mov word [VM_SP], si
    mov word [si], ax
    
    ; Jump to label
    mov si, word [TEMP_VALUE]
    call decode_operand
    mov word [VM_PC], ax
    jmp vm_loop

vm_ret_instr:
    ; RET
    mov si, word [VM_SP]
    mov ax, word [si]
    mov word [VM_PC], ax
    add si, 2
    mov word [VM_SP], si
    jmp vm_loop

vm_push_instr:
    ; PUSH reg
    mov si, word [TEMP_VALUE]
    call decode_operand
    call get_reg
    mov si, word [VM_SP]
    dec si
    dec si
    mov word [VM_SP], si
    mov word [si], ax
    jmp vm_loop_continue

vm_pop_instr:
    ; POP reg
    mov si, word [VM_SP]
    mov ax, word [si]
    add si, 2
    mov word [VM_SP], si
    
    mov si, word [TEMP_VALUE]
    call decode_operand
    mov dx, ax
    push ax
    mov al, dl
    pop dx
    call set_reg
    jmp vm_loop_continue

vm_int_instr:
    ; INT interrupt_number
    mov si, word [TEMP_VALUE]
    call decode_operand
    ; AX = interrupt number
    int al  ; Call BIOS interrupt
    jmp vm_loop_continue

vm_hlt_instr:
    ; Halt VM
    jmp vm_done

; Utility: Print string
; Input: SI = string address (null-terminated)
print_string:
    push ax
    push bx
    push si
print_loop:
    lodsb
    cmp al, 0
    je print_done
    mov ah, 0x0E
    mov bl, 7
    int 0x10
    jmp print_loop
print_done:
    pop si
    pop bx
    pop ax
    ret

error_msg db 'VM Error!', 0

; Placeholder for bytecode (will be inserted by build system)
bytecode_start:
    db 0x52, 0x4d, 0x53, 0x4d, 0x01, 0x00, 0x39, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x16, 0xb0, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x16, 0xb0, 0x03, 0x00, 0x01, 0x07, 0x80, 0x00, 0x7c, 0x11, 0xa0, 0x16, 0x00, 0x01, 0x00, 0xa0, 0x39, 0x00, 0x11, 0xa0, 0x28, 0x00, 0x00, 0x00, 0x00, 0x0a, 0xa0, 0x08, 0x00, 0x13, 0x01, 0x13, 0x02, 0x01, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x0e, 0x03, 0x00, 0x01, 0x01, 0x01, 0x80, 0x07, 0x00, 0x15, 0x80, 0x10, 0x00, 0x14, 0x02, 0x14, 0x01, 0x12, 0x13, 0x00, 0x13, 0x01, 0x01, 0x00, 0x80, 0x03, 0x00, 0x15, 0x80, 0x10, 0x00, 0x14, 0x01, 0x14, 0x00, 0x12, 0x13, 0x01, 0x01, 0x00, 0x80, 0x00, 0x00, 0x15, 0x80, 0x16, 0x00, 0x14, 0x01, 0x12, 0x13, 0x01, 0x01, 0x00, 0x80, 0x00, 0x01, 0x15, 0x80, 0x16, 0x00, 0x01, 0x00, 0x80, 0x01, 0x00, 0x14, 0x01, 0x12, 0x13, 0x01, 0x13, 0x02, 0x01, 0x01, 0x00, 0x01, 0x02, 0x01, 0x09, 0x02, 0x80, 0x00, 0x00, 0x0b, 0xa0, 0x32, 0x00, 0x01, 0x00, 0x02, 0x11, 0xa0, 0x0c, 0x00, 0x07, 0x01, 0x0a, 0xa0, 0x2b, 0x00, 0x14, 0x02, 0x14, 0x01, 0x12, 0x13, 0x02, 0x15, 0x80, 0x10, 0x00, 0x14, 0x02, 0x12, 0x12, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x52, 0x6f, 0x6d, 0x61, 0x6e, 0x4f, 0x53, 0x21, 0x0d, 0x0a, 0x00, 0x0b, 0x00, 0x05, 0x73, 0x74, 0x61, 0x72, 0x74, 0x00, 0x00, 0x04, 0x68, 0x61, 0x6c, 0x74, 0x08, 0x00, 0x03, 0x6d, 0x73, 0x67, 0x39, 0x00, 0x09, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x70, 0x75, 0x74, 0x63, 0x0c, 0x00, 0x11, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x63, 0x6c, 0x65, 0x61, 0x72, 0x5f, 0x73, 0x63, 0x72, 0x65, 0x65, 0x6e, 0x16, 0x00, 0x0c, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x67, 0x65, 0x74, 0x5f, 0x6b, 0x65, 0x79, 0x1d, 0x00, 0x12, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x6b, 0x65, 0x79, 0x5f, 0x61, 0x76, 0x61, 0x69, 0x6c, 0x61, 0x62, 0x6c, 0x65, 0x22, 0x00, 0x11, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x70, 0x72, 0x69, 0x6e, 0x74, 0x5f, 0x73, 0x74, 0x72, 0x69, 0x6e, 0x67, 0x28, 0x00, 0x0f, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x70, 0x72, 0x69, 0x6e, 0x74, 0x5f, 0x6c, 0x6f, 0x6f, 0x70, 0x2b, 0x00, 0x0f, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x70, 0x72, 0x69, 0x6e, 0x74, 0x5f, 0x64, 0x6f, 0x6e, 0x65, 0x32, 0x00, 0x0f, 0x62, 0x69, 0x6f, 0x73, 0x5f, 0x73, 0x65, 0x74, 0x5f, 0x63, 0x75, 0x72, 0x73, 0x6f, 0x72, 0x35, 0x00
bytecode_end:

; Pad to 510 bytes (will be adjusted by build system)
times 510 - ($ - $$) db 0

; Boot signature
dw 0xAA55
