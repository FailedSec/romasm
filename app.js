/**
 * Application logic for Positional Roman Numeral System web app
 */

let currentSeparator = 'space';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeSeparatorControls();
    initializeComparisonTable();
    initializeExamples();
    
    // Add enter key support for inputs
    document.getElementById('decimal-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convertFromDecimal();
    });
    
    document.getElementById('positional-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convertFromPositional();
    });
    
    document.getElementById('standard-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') convertFromStandard();
    });
});

function initializeSeparatorControls() {
    const radios = document.querySelectorAll('input[name="separator"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentSeparator = e.target.value;
        });
    });
}

function getSeparator() {
    const selected = document.querySelector('input[name="separator"]:checked');
    return selected ? selected.value : 'space';
}

function convertFromDecimal() {
    const input = document.getElementById('decimal-input');
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 0) {
        showError('Please enter a valid non-negative number');
        return;
    }
    
    try {
        const separator = getSeparator();
        const pr = new PositionalRoman(separator);
        const result = compareSystems(value, separator);
        displayResults(result);
    } catch (error) {
        showError(error.message);
    }
}

function convertFromPositional() {
    const input = document.getElementById('positional-input');
    const value = input.value.trim();
    
    if (!value) {
        showError('Please enter a Positional Roman numeral');
        return;
    }
    
    try {
        const separator = getSeparator();
        const pr = new PositionalRoman(separator);
        const decimal = pr.fromPositionalRoman(value);
        const result = compareSystems(decimal, separator);
        displayResults(result);
    } catch (error) {
        showError(error.message);
    }
}

function convertFromStandard() {
    const input = document.getElementById('standard-input');
    const value = input.value.trim();
    
    if (!value) {
        showError('Please enter a standard Roman numeral');
        return;
    }
    
    try {
        const pr = new PositionalRoman(getSeparator());
        const decimal = pr.standardToDecimal(value);
        const result = compareSystems(decimal, getSeparator());
        displayResults(result);
    } catch (error) {
        showError(error.message);
    }
}

function displayResults(result) {
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    
    resultsSection.style.display = 'block';
    resultsGrid.innerHTML = `
        <div class="result-card">
            <h3>Decimal</h3>
            <div class="result-value">${result.decimal.toLocaleString()}</div>
        </div>
        <div class="result-card">
            <h3>Standard Roman</h3>
            <div class="result-value">${result.standardRoman}</div>
        </div>
        <div class="result-card">
            <h3>Positional Roman</h3>
            <div class="result-value">${result.positionalRoman}</div>
        </div>
        <div class="result-card explanation-card">
            <h3>Explanation</h3>
            <div class="result-value explanation-text">${result.explanation}</div>
        </div>
    `;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(message) {
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');
    
    resultsSection.style.display = 'block';
    resultsGrid.innerHTML = `
        <div class="error-card">
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
}

function initializeComparisonTable() {
    const tbody = document.getElementById('comparison-tbody');
    const testNumbers = [10, 50, 101, 999, 2025, 1234, 5678];
    
    testNumbers.forEach(num => {
        const result = compareSystems(num, 'space');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.decimal.toLocaleString()}</td>
            <td>${result.standardRoman}</td>
            <td><code>${result.positionalRoman}</code></td>
            <td class="explanation-cell">${result.explanation}</td>
        `;
        tbody.appendChild(row);
    });
}

function initializeExamples() {
    const examplesGrid = document.getElementById('examples-grid');
    const examples = [
        {
            title: 'Basic Conversion',
            number: 2025,
            description: 'Shows how each position represents a power of 10'
        },
        {
            title: 'Zero Placeholder',
            number: 101,
            description: 'Demonstrates the use of N (nulla) for zero'
        },
        {
            title: 'Large Number',
            number: 9999,
            description: 'Shows scalability compared to standard Roman'
        },
        {
            title: 'All Nines',
            number: 999,
            description: 'Maximum value in each position'
        }
    ];
    
    examples.forEach(example => {
        const result = compareSystems(example.number, 'space');
        const card = document.createElement('div');
        card.className = 'example-card';
        card.innerHTML = `
            <h3>${example.title}</h3>
            <p class="example-description">${example.description}</p>
            <div class="example-values">
                <div class="example-value">
                    <strong>Decimal:</strong> ${result.decimal.toLocaleString()}
                </div>
                <div class="example-value">
                    <strong>Standard:</strong> ${result.standardRoman}
                </div>
                <div class="example-value">
                    <strong>Positional:</strong> <code>${result.positionalRoman}</code>
                </div>
            </div>
            <div class="example-explanation">
                ${result.explanation}
            </div>
        `;
        examplesGrid.appendChild(card);
    });
}

