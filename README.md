# Positional Roman Numeral System

A positional numeral system using Roman numeral symbols (I, V, X, etc.) where each position represents a power of 10, similar to modern decimal notation.

## Concept

This project implements a **Positional Roman** numeral system that combines the aesthetic of Roman numerals with the efficiency of positional (place-value) notation. Unlike standard Roman numerals which are additive/subtractive, this system uses Roman symbols as "digits" in a base-10 positional system.

### Why This Matters

Standard Roman numerals have limitations:
- They're **additive/subtractive**: Each symbol has a fixed value regardless of position
- They struggle with large numbers: Eventually run out of symbols (requiring bars or brackets)
- Complex arithmetic is cumbersome

Positional Roman numerals solve these issues:
- **Positional**: Each position represents a power of 10 (like modern decimal)
- **Scalable**: Can represent any number using just 10 digit symbols (0-9)
- **Efficient**: Enables easier arithmetic operations

## Digit Set

The system uses these symbols for digits 0-9:

| Value | Symbol | Name |
|-------|--------|------|
| 0 | N | nulla (zero) |
| 1 | I | unus |
| 2 | II | duo |
| 3 | III | tres |
| 4 | IV | quattuor |
| 5 | V | quinque |
| 6 | VI | sex |
| 7 | VII | septem |
| 8 | VIII | octo |
| 9 | IX | novem |

## Examples

### Basic Conversion

```python
from positional_roman import PositionalRoman

pr = PositionalRoman(separator='space')

# Convert decimal to Positional Roman
pr.to_positional_roman(2025)  # Returns: "II N II V"

# Convert Positional Roman to decimal
pr.from_positional_roman("II N II V")  # Returns: 2025
```

### Understanding the Representation

The number **2025** in Positional Roman is `II N II V`:
- `II` in the **thousands** place (2 × 1000 = 2000)
- `N` in the **hundreds** place (0 × 100 = 0)
- `II` in the **tens** place (2 × 10 = 20)
- `V` in the **ones** place (5 × 1 = 5)

**Total: 2000 + 0 + 20 + 5 = 2025**

### Comparison Table

| Decimal | Standard Roman | Positional Roman |
|---------|----------------|------------------|
| 10 | X | I N |
| 50 | L | V N |
| 101 | CI | I N I |
| 999 | CMXCIX | IX IX IX |
| 2025 | MMXXV | II N II V |
| 1234 | MCCXXXIV | I II III IV |

## Separators

Because Roman digits vary in width (e.g., `III` vs `V`), separators are needed to distinguish columns:

- **Space**: `II N II V` (default)
- **Dot**: `II·N·II·V`
- **Box**: `II▢N▢II▢V`

Without separators, `III` could mean:
- The digit 3 (III = 3)
- Three digits: 1, 1, 1 (111)

With separators, `I·I·I` clearly means 111.

## Installation

### Web App (Recommended)

The web app runs entirely in your browser - no build step required!

**Option 1: Simple HTTP Server (Node.js)**
```bash
# Using the built-in server
node server.js

# Or using http-server (if installed)
npm start

# Then open http://localhost:6969 in your browser
```

**Option 2: Open Directly**
Simply open `index.html` in your browser. Some browsers may have CORS restrictions, so using a local server is recommended.

### Available Pages

- **`index.html`** - Positional Roman Numeral System converter
- **`romasm.html`** - Romasm (Roman Assembly Language) with register operations
- **`romasm-extended.html`** - Extended features (fractions, negatives, ISA)
- **`ide.html`** - **Romasm IDE** - Online code editor to write, compile, and run Romasm programs!

### Python Version

No dependencies required! Just Python 3.6+.

```bash
# Clone or download the repository
cd romasm

# Run examples
python positional_roman.py
```

## Usage

### Web App

1. Start the server: `node server.js` or `npm start`
2. Open `http://localhost:6969` in your browser
3. Use the interactive converter to:
   - Convert decimal numbers to Positional Roman
   - Convert Positional Roman back to decimal
   - Convert standard Roman numerals
   - Compare all three systems side-by-side
   - View examples and explanations

The web app includes:
- Interactive conversion interface
- Real-time results with explanations
- Comparison table showing multiple examples
- Detailed examples with breakdowns
- Information about the digit set and system

### Python API

```python
from positional_roman import PositionalRoman, compare_systems

# Create converter
pr = PositionalRoman(separator='space')  # or 'dot' or 'box'

# Convert decimal to Positional Roman
positional = pr.to_positional_roman(2025)
print(positional)  # "II N II V"

# Convert Positional Roman to decimal
decimal = pr.from_positional_roman("II N II V")
print(decimal)  # 2025

# Convert to standard Roman (for comparison)
standard = pr.to_standard_roman(2025)
print(standard)  # "MMXXV"

# Compare all systems
result = compare_systems(2025)
print(result)
# {
#     'decimal': 2025,
#     'standard_roman': 'MMXXV',
#     'positional_roman': 'II N II V',
#     'explanation': 'II in the thousands place (2 × 1000 = 2000) | ...'
# }
```

### Command Line Interface

```bash
# Convert decimal to Positional Roman
python cli.py 2025

# Convert with dot separator
python cli.py 2025 --separator dot

# Compare all systems
python cli.py 2025 --compare

# Show detailed explanation
python cli.py 2025 --explain

# Convert from Positional Roman to decimal
python cli.py --from-positional "II N II V"

# Convert from standard Roman to decimal
python cli.py --from-standard MMXXV
```

## Technical Details

### System Comparison

| System | Logic | Efficiency | Analogy |
|--------|-------|------------|---------|
| Tally Marks | Unary (1 mark = 1) | Very Low | Raw electrical signals |
| Standard Roman | Additive/Subtractive | Low | Assembly / Machine Code |
| Positional Roman | Positional (Base-10) | High | High-Level Languages |
| Modern Decimal | Positional (Base-10) | High | High-Level Languages |

### Key Differences

**Standard Roman (Additive):**
- `XXX` = 30 (X + X + X, each X always equals 10)
- Position doesn't matter
- To write larger numbers, keep adding symbols

**Positional Roman (Place-Value):**
- `III N` = 30 (III in tens place = 3 × 10, N in ones place = 0 × 1)
- Position determines value
- To write larger numbers, add more columns

## Inspiration

This project was inspired by the analogy between:
- **Roman Numerals** ↔ **Assembly Language** (low-level, literal, cumbersome)
- **Positional Systems** ↔ **High-Level Languages** (abstract, efficient, scalable)

Just as programmers moved from Assembly to high-level languages to build complex software, humanity moved from additive numeral systems to positional notation to build complex civilizations.

## License

This project is open source and available for educational and experimental purposes.

## Contributing

Feel free to experiment, improve, and extend this system! Some ideas:
- Support for negative numbers
- Arithmetic operations (addition, subtraction, multiplication, division)
- Different bases (base-2, base-16, etc.)
- Visual rendering with proper typography
- ✅ Web interface (implemented!)
- ✅ Romasm - Roman Assembly Language (implemented! See `ROMASM_README.md`)
- ✅ Romasm Compiler & IDE (implemented! See `compiler/` and `ide.html`)

