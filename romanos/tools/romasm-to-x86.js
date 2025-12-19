#!/usr/bin/env node
/**
 * Romasm to x86 Converter
 * 
 * Takes a Romasm source file and converts it to x86 assembly
 * Usage: node romasm-to-x86.js input.romasm output.asm
 */

const fs = require('fs');
const path = require('path');

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
    
    // Load x86 generator
    const generatorPath = path.join(__dirname, '../compiler/romasm-x86-generator.js');
    if (!fs.existsSync(generatorPath)) {
        throw new Error(`x86 generator not found: ${generatorPath}`);
    }
    const RomasmX86Generator = require(generatorPath);
    
    return { RomasmAssembler, RomasmX86Generator };
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node romasm-to-x86.js <input.romasm> <output.asm> [--16bit|--32bit]');
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1];
    const mode16bit = !args.includes('--32bit'); // Default to 16-bit (boot sector)
    
    // Read Romasm source
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file not found: ${inputFile}`);
        process.exit(1);
    }
    
    const source = fs.readFileSync(inputFile, 'utf8');
    
    // Load components
    const { RomasmAssembler, RomasmX86Generator } = loadRomasmComponents();
    
    // Assemble Romasm
    console.log('Assembling Romasm...');
    const assembler = new RomasmAssembler();
    const result = assembler.assemble(source);
    
    if (!result.success) {
        console.error('Assembly errors:');
        result.errors.forEach(err => {
            console.error(`  Line ${err.line}: ${err.message}`);
        });
        process.exit(1);
    }
    
    console.log(`Assembled ${result.instructions.length} instructions`);
    console.log(`Found ${Object.keys(result.labels).length} labels`);
    
    // Generate x86 assembly
    console.log(`Generating x86 ${mode16bit ? '16-bit' : '32-bit'} assembly...`);
    const generator = new RomasmX86Generator();
    const x86Asm = generator.generateAssembly(result.instructions, mode16bit);
    
    // Write output
    fs.writeFileSync(outputFile, x86Asm, 'utf8');
    console.log(`Output written to: ${outputFile}`);
    
    // If boot sector mode, also generate boot sector version
    if (mode16bit) {
        const bootFile = outputFile.replace('.asm', '_boot.asm');
        const bootAsm = generator.generateBootSector(result.instructions);
        fs.writeFileSync(bootFile, bootAsm, 'utf8');
        console.log(`Boot sector version written to: ${bootFile}`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
