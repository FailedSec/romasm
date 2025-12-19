#!/usr/bin/env node
/**
 * RomanOS Build System
 * 
 * Complete build system for RomanOS that:
 * 1. Assembles Romasm source files
 * 2. Links with stdlib (BIOS library, etc.)
 * 3. Generates x86 assembly
 * 4. Assembles with NASM
 * 5. Creates bootable image
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load Romasm components
function loadRomasmComponents() {
    const projectRoot = path.join(__dirname, '../..');
    
    // Load assembler
    const assemblerPath = path.join(projectRoot, 'compiler/romasm-assembler.js');
    if (!fs.existsSync(assemblerPath)) {
        throw new Error(`Assembler not found: ${assemblerPath}`);
    }
    const assemblerModule = require(assemblerPath);
    const RomasmAssembler = assemblerModule.RomasmAssembler || assemblerModule;
    
    // Load linker (optional - we'll do manual linking for now)
    // const linkerPath = path.join(projectRoot, 'linker/romasm-linker.js');
    // if (!fs.existsSync(linkerPath)) {
    //     throw new Error(`Linker not found: ${linkerPath}`);
    // }
    // const linkerModule = require(linkerPath);
    // const RomasmLinker = linkerModule.RomasmLinker || linkerModule;
    
    // Load x86 generator (for native mode)
    const generatorPath = path.join(__dirname, '../compiler/romasm-x86-generator.js');
    if (!fs.existsSync(generatorPath)) {
        throw new Error(`x86 generator not found: ${generatorPath}`);
    }
    const RomasmX86Generator = require(generatorPath);
    
    // Load bytecode generator (for VM mode)
    const bytecodePath = path.join(__dirname, '../compiler/romasm-bytecode-generator.js');
    if (!fs.existsSync(bytecodePath)) {
        throw new Error(`Bytecode generator not found: ${bytecodePath}`);
    }
    const { RomasmBytecodeGenerator } = require(bytecodePath);
    
    // Load optimizer
    const optimizerPath = path.join(__dirname, '../compiler/romasm-optimizer.js');
    if (!fs.existsSync(optimizerPath)) {
        throw new Error(`Optimizer not found: ${optimizerPath}`);
    }
    const { RomasmOptimizer } = require(optimizerPath);
    
    return { RomasmAssembler, RomasmX86Generator, RomasmBytecodeGenerator, RomasmOptimizer };
}

async function buildRomanOS(exampleName = 'hello-world', mode = 'native') {
    log('RomanOS Build System', 'green');
    log('====================', 'green');
    log('');
    
    const projectRoot = path.join(__dirname, '../..');
    const romanosRoot = path.join(__dirname, '..');
    const buildDir = path.join(romanosRoot, 'build');
    const stdlibDir = path.join(romanosRoot, 'stdlib');
    const examplesDir = path.join(romanosRoot, 'examples');
    
    // Create build directory
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }
    
    // Load components
    log('Loading Romasm components...', 'blue');
    const { RomasmAssembler, RomasmX86Generator, RomasmBytecodeGenerator, RomasmOptimizer } = loadRomasmComponents();
    
    log(`Build mode: ${mode === 'vm' ? 'VM (Native Romasm)' : 'Native x86'}`, 'yellow');
    
    // Step 1: Read main source file
    const sourceFile = path.join(examplesDir, `${exampleName}.romasm`);
    if (!fs.existsSync(sourceFile)) {
        throw new Error(`Source file not found: ${sourceFile}`);
    }
    log(`Reading source: ${sourceFile}`, 'blue');
    const source = fs.readFileSync(sourceFile, 'utf8');
    
    // Step 2: Assemble Romasm
    log('Assembling Romasm...', 'blue');
    const assembler = new RomasmAssembler();
    const assembleResult = assembler.assemble(source);
    
    if (!assembleResult.success) {
        log('Assembly errors:', 'red');
        assembleResult.errors.forEach(err => {
            log(`  Line ${err.line}: ${err.message}`, 'red');
            log(`  Code: ${err.code}`, 'red');
        });
        throw new Error('Assembly failed');
    }
    log(`✓ Assembled ${assembleResult.instructions.length} instructions`, 'green');
    log(`✓ Found ${Object.keys(assembleResult.labels).length} labels`, 'green');
    
    // Step 3: Load and link with stdlib
    log('Linking with standard library...', 'blue');
    
    // Store original instruction count before merging BIOS
    const originalInstructionCount = assembleResult.instructions.length;
    const originalDataCount = assembleResult.data.length;
    
    // Load BIOS library (manual linking)
    const biosLibPath = path.join(stdlibDir, 'bios.romasm');
    if (fs.existsSync(biosLibPath)) {
        log('  Loading BIOS library...', 'yellow');
        const biosSource = fs.readFileSync(biosLibPath, 'utf8');
        const biosResult = assembler.assemble(biosSource);
        if (biosResult.success) {
            // Merge BIOS functions
            const instructionOffset = assembleResult.instructions.length;
            
            // Update BIOS CALL/JMP instructions FIRST (before merging instructions)
            // BIOS CALL/JMP instructions need their target addresses offset
            for (const instr of biosResult.instructions) {
                if ((instr.opcode === 'CA' || instr.opcode === 'V' || instr.opcode === 'JE' || instr.opcode === 'JN' || instr.opcode === 'JL' || instr.opcode === 'JG' || instr.opcode === 'JLE' || instr.opcode === 'JGE') && instr.operands.length > 0) {
                    const target = instr.operands[0];
                    // If it's a resolved label address (not labelName), offset it
                    if (target.type === 'label' && typeof target.value === 'number' && target.value < biosResult.instructions.length) {
                        target.value = instructionOffset + target.value;
                    }
                }
            }
            
            assembleResult.instructions.push(...biosResult.instructions);
            
            // Update USER data labels FIRST (before merging BIOS labels)
            // User data labels need to be offset by the new total instruction count
            const newInstructionCount = assembleResult.instructions.length;
            for (const [label, addr] of Object.entries(assembleResult.labels)) {
                // If this label was originally a data label (addr >= original instruction count)
                if (addr >= originalInstructionCount && addr < originalInstructionCount + originalDataCount) {
                    // This is a user data label - update its offset
                    const originalDataIndex = addr - originalInstructionCount;
                    assembleResult.labels[label] = newInstructionCount + originalDataIndex;
                }
            }
            
            // Update BIOS labels with offset
            for (const [label, addr] of Object.entries(biosResult.labels)) {
                // Check if it's a data label or instruction label
                if (addr < biosResult.instructions.length) {
                    // Instruction label
                    assembleResult.labels[label] = instructionOffset + addr;
                } else {
                    // Data label (if any) - BIOS library shouldn't have data labels, but handle it
                    const dataOffset = assembleResult.data.length;
                    assembleResult.labels[label] = newInstructionCount + dataOffset + (addr - biosResult.instructions.length);
                }
            }
            
            // Merge data if any
            if (biosResult.data && biosResult.data.length > 0) {
                const dataOffset = assembleResult.data.length;
                for (const dataItem of biosResult.data) {
                    assembleResult.data.push({
                        address: dataOffset + dataItem.address,
                        value: dataItem.value
                    });
                }
            }
            
            log(`  ✓ Loaded BIOS library (${biosResult.instructions.length} instructions)`, 'green');
        }
    }
    
    // Step 4: Generate output (x86 or bytecode)
    if (mode === 'vm') {
        // VM Mode: Generate bytecode
        log('Generating Romasm bytecode...', 'blue');
        const bytecodeGen = new RomasmBytecodeGenerator();
        const bytecode = bytecodeGen.generate(assembleResult);
        
        const rombinFile = path.join(buildDir, `${exampleName}.rombin`);
        bytecodeGen.save(bytecode, rombinFile);
        log(`✓ Generated bytecode: ${rombinFile} (${bytecode.length} bytes)`, 'green');
        
        // Step 5: Embed bytecode into VM bootloader
        log('Creating VM bootloader image...', 'blue');
        const bootloaderPath = path.join(__dirname, '../vm/romasm-vm-bootloader.asm');
        if (!fs.existsSync(bootloaderPath)) {
            throw new Error(`VM bootloader not found: ${bootloaderPath}`);
        }
        
        let bootloaderAsm = fs.readFileSync(bootloaderPath, 'utf8');
        
        // Replace bytecode placeholder with actual bytecode
        const bytecodeHex = Array.from(bytecode).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ');
        bootloaderAsm = bootloaderAsm.replace(
            /bytecode_start:[\s\S]*?bytecode_end:/,
            `bytecode_start:\n    db ${bytecodeHex}\nbytecode_end:`
        );
        
        const vmAsmFile = path.join(buildDir, `${exampleName}-vm.asm`);
        fs.writeFileSync(vmAsmFile, bootloaderAsm, 'utf8');
        log(`✓ Generated VM bootloader: ${vmAsmFile}`, 'green');
        
        // Step 6: Assemble VM bootloader with NASM
        log('Assembling VM bootloader with NASM...', 'blue');
        const binFile = path.join(buildDir, `${exampleName}.bin`);
        const asmFile = vmAsmFile;  // Use VM bootloader ASM file
        
        // Find NASM executable
        let nasmPath = 'nasm';
        const possiblePaths = [
            'nasm', // In PATH
            path.join('C:', 'Program Files', 'NASM', 'nasm.exe'),
            path.join('C:', 'Program Files (x86)', 'NASM', 'nasm.exe'),
            '/usr/bin/nasm', // WSL
            '/usr/local/bin/nasm' // WSL alternative
        ];
        
        // Try to find NASM
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath) || testPath === 'nasm') {
                // Try to execute it
                try {
                    execSync(`"${testPath}" --version`, { stdio: 'pipe' });
                    nasmPath = testPath;
                    log(`  Found NASM at: ${nasmPath}`, 'yellow');
                    break;
                } catch (e) {
                    // Not this one, try next
                    continue;
                }
            }
        }
        
        try {
            execSync(`"${nasmPath}" -f bin -o "${binFile}" "${asmFile}"`, { stdio: 'inherit' });
            log(`✓ Assembled to: ${binFile}`, 'green');
        } catch (error) {
            log('NASM assembly failed. Make sure NASM is installed.', 'red');
            log('Tried paths:', 'yellow');
            possiblePaths.forEach(p => log(`  - ${p}`, 'yellow'));
            log('You can install NASM with: apt-get install nasm (Linux) or brew install nasm (Mac)', 'yellow');
            log('Or download from: https://www.nasm.us/', 'yellow');
            throw error;
        }
        
        // Step 7: Create bootable image
        log('Creating bootable image...', 'blue');
        const imgFile = path.join(buildDir, `${exampleName}.img`);
        
        // Create 1.44MB floppy image
        const floppySize = 1440 * 1024; // 1.44MB
        const buffer = Buffer.alloc(floppySize, 0);
        
        // Read boot sector
        const bootSector = fs.readFileSync(binFile);
        if (bootSector.length > 512) {
            log('Warning: Boot sector is larger than 512 bytes!', 'yellow');
        }
        
        // Copy boot sector to image
        bootSector.copy(buffer, 0, 0, Math.min(512, bootSector.length));
        
        // Add boot signature (0xAA55 at offset 510)
        buffer[510] = 0x55;
        buffer[511] = 0xAA;
        
        fs.writeFileSync(imgFile, buffer);
        log(`✓ Created bootable image: ${imgFile}`, 'green');
        
    } else {
        // Native Mode: Generate x86 assembly (existing flow)
        log('Generating x86 assembly...', 'blue');
        // Enable smart register allocation
        const generator = new RomasmX86Generator(true);
        log('  Using smart register allocation', 'yellow');
        
        // Debug: log label info
        log(`  Debug: Instruction count: ${assembleResult.instructions.length}`, 'yellow');
        log(`  Debug: Data count: ${assembleResult.data.length}`, 'yellow');
        log(`  Debug: Labels: ${Object.keys(assembleResult.labels).join(', ')}`, 'yellow');
        for (const [labelName, address] of Object.entries(assembleResult.labels)) {
            if (address >= assembleResult.instructions.length) {
                log(`  Debug: ${labelName} -> data address ${address - assembleResult.instructions.length}`, 'yellow');
            } else {
                log(`  Debug: ${labelName} -> instruction address ${address}`, 'yellow');
            }
        }
        
        let x86Asm = generator.generateBootSector(assembleResult.instructions, assembleResult.data, assembleResult.labels);
        
        // Optimize the generated assembly
        log('Optimizing x86 assembly...', 'blue');
        const optimizer = new RomasmOptimizer();
        x86Asm = optimizer.optimize(x86Asm);
        log(`✓ Optimized assembly (peephole, constant folding, dead code elimination)`, 'green');
        
        const asmFile = path.join(buildDir, `${exampleName}.asm`);
        fs.writeFileSync(asmFile, x86Asm, 'utf8');
        log(`✓ Generated x86 assembly: ${asmFile}`, 'green');
        
        // Step 5: Assemble with NASM
        log('Assembling with NASM...', 'blue');
        const binFile = path.join(buildDir, `${exampleName}.bin`);
        
        // Find NASM executable
        let nasmPath = 'nasm';
        const possiblePaths = [
            'nasm', // In PATH
            path.join('C:', 'Program Files', 'NASM', 'nasm.exe'),
            path.join('C:', 'Program Files (x86)', 'NASM', 'nasm.exe'),
            '/usr/bin/nasm', // WSL
            '/usr/local/bin/nasm' // WSL alternative
        ];
        
        // Try to find NASM
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath) || testPath === 'nasm') {
                // Try to execute it
                try {
                    execSync(`"${testPath}" --version`, { stdio: 'pipe' });
                    nasmPath = testPath;
                    log(`  Found NASM at: ${nasmPath}`, 'yellow');
                    break;
                } catch (e) {
                    // Not this one, try next
                    continue;
                }
            }
        }
        
        try {
            execSync(`"${nasmPath}" -f bin -o "${binFile}" "${asmFile}"`, { stdio: 'inherit' });
            log(`✓ Assembled to: ${binFile}`, 'green');
        } catch (error) {
            log('NASM assembly failed. Make sure NASM is installed.', 'red');
            log('Tried paths:', 'yellow');
            possiblePaths.forEach(p => log(`  - ${p}`, 'yellow'));
            log('You can install NASM with: apt-get install nasm (Linux) or brew install nasm (Mac)', 'yellow');
            log('Or download from: https://www.nasm.us/', 'yellow');
            throw error;
        }
        
        // Step 6: Create bootable image
        log('Creating bootable image...', 'blue');
        const imgFile = path.join(buildDir, `${exampleName}.img`);
        
        // Create 1.44MB floppy image
        const floppySize = 1440 * 1024; // 1.44MB
        const buffer = Buffer.alloc(floppySize, 0);
        
        // Read boot sector
        const bootSector = fs.readFileSync(binFile);
        if (bootSector.length > 512) {
            log('Warning: Boot sector is larger than 512 bytes!', 'yellow');
        }
        
        // Copy boot sector to image
        bootSector.copy(buffer, 0, 0, Math.min(512, bootSector.length));
        
        // Add boot signature (0xAA55 at offset 510)
        buffer[510] = 0x55;
        buffer[511] = 0xAA;
        
        fs.writeFileSync(imgFile, buffer);
        log(`✓ Created bootable image: ${imgFile}`, 'green');
    }
    
    log('', 'reset');
    log('Build complete!', 'green');
    const imgFile = path.join(buildDir, `${exampleName}.img`);
    log(`Output: ${imgFile}`, 'green');
    log('', 'reset');
    log('Run with:', 'yellow');
    log(`  ./tools/run.sh ${exampleName}`, 'yellow');
    log('  or', 'yellow');
    log(`  qemu-system-x86_64 -drive file=${imgFile},format=raw,if=floppy`, 'yellow');
}

// Main
const exampleName = process.argv[2] || 'hello-world';
const mode = process.argv[3] === '--vm' ? 'vm' : 'native';
buildRomanOS(exampleName, mode).catch(error => {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
});

