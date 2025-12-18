# Quick Start Guide

## Web App (Browser)

### Option 1: Using Node.js Server (Recommended)

```bash
# Start the server
node server.js

# Open your browser to:
http://localhost:6969
```

### Option 2: Using npm script

```bash
# Install http-server (one-time, if not already installed)
npm install -g http-server

# Start the server
npm start

# Or use the built-in server
node server.js

# Then open http://localhost:6969 in your browser
```

### Option 3: Direct File Open

Simply double-click `index.html` to open it in your browser. Note: Some browsers may have CORS restrictions, so using a local server is recommended.

## Features

- **Convert Decimal → Positional Roman**: Enter any number and see it converted
- **Convert Positional Roman → Decimal**: Enter Positional Roman (e.g., "II N II V") to get the decimal value
- **Convert Standard Roman → Decimal**: Enter standard Roman numerals (e.g., "MMXXV")
- **Compare Systems**: See all three representations side-by-side
- **Examples**: View pre-loaded examples with explanations
- **Separator Styles**: Choose between space, dot (·), or box (▢) separators

## Example Usage

1. Enter `2025` in the Decimal Number field
2. Click "Convert to Positional Roman"
3. See the result: `II N II V`
4. View the explanation showing how each position represents a power of 10

## Try These Examples

- **2025** → `II N II V` (2 thousands, 0 hundreds, 2 tens, 5 ones)
- **999** → `IX IX IX` (all nines)
- **101** → `I N I` (shows zero placeholder)
- **1234** → `I II III IV` (sequential digits)

Enjoy exploring the Positional Roman Numeral System!

