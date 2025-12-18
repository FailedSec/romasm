/**
 * Shared Navigation Component
 * Categorized sidebar navigation for Romasm project
 */

function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';
    
    // Get current page to highlight active link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pathParts = window.location.pathname.split('/').filter(p => p);
    
    // Determine if we're in docs folder
    const isInDocs = pathParts.includes('docs');
    const isInDocsPages = pathParts.includes('pages');
    
    // Generate path prefix based on location
    let pathPrefix = '';
    if (isInDocsPages) {
        pathPrefix = '../../';  // From docs/pages/ to root
    } else if (isInDocs) {
        pathPrefix = '../';  // From docs/ to root
    }
    
    function isActive(href) {
        return href === currentPage || (currentPage === '' && href === 'index.html');
    }
    
    // Documentation link
    const docsLink = isInDocs ? 'index.html' : 'docs/index.html';
    const docsActive = isInDocs && (currentPage === 'index.html' || pathParts[pathParts.length - 1] === 'docs');
    
    nav.innerHTML = `
        <div class="nav-header">
            <h2>Romasm</h2>
        </div>
        <div class="nav-section">
            <h3 class="nav-section-title">Romasm</h3>
            <ul class="nav-links">
                <li><a href="${pathPrefix}romasm.html" class="${isActive('romasm.html') ? 'active' : ''}">Basic Romasm</a></li>
                <li><a href="${pathPrefix}romasm-extended.html" class="${isActive('romasm-extended.html') ? 'active' : ''}">Extended Features</a></li>
                <li><a href="${pathPrefix}ide.html" class="${isActive('ide.html') ? 'active' : ''}">IDE</a></li>
            </ul>
        </div>
        <div class="nav-section">
            <h3 class="nav-section-title">Tools</h3>
            <ul class="nav-links">
                <li><a href="${pathPrefix}index.html" class="${isActive('index.html') && !isInDocs ? 'active' : ''}">Positional Roman</a></li>
                <li><a href="${pathPrefix}text-to-romasm.html" class="${isActive('text-to-romasm.html') ? 'active' : ''}">Text to Romasm</a></li>
                <li><a href="${pathPrefix}calculator.html" class="${isActive('calculator.html') ? 'active' : ''}">Graphics Calculator</a></li>
                <li><a href="${pathPrefix}romasm-calculator.html" class="${isActive('romasm-calculator.html') ? 'active' : ''}">Romasm Calculator</a></li>
                <li><a href="${docsLink}" class="${docsActive ? 'active' : ''}">Documentation</a></li>
            </ul>
        </div>
        <div class="nav-section">
            <h3 class="nav-section-title">Problem Solving</h3>
            <ul class="nav-links">
                <li><a href="collatz.html" class="${isActive('collatz.html') ? 'active' : ''}">Collatz Conjecture</a></li>
                <li><a href="twin-primes.html" class="${isActive('twin-primes.html') ? 'active' : ''}">Twin Primes</a></li>
                <li><a href="goldbach.html" class="${isActive('goldbach.html') ? 'active' : ''}">Goldbach Conjecture</a></li>
                <li><a href="erdos-straus.html" class="${isActive('erdos-straus.html') ? 'active' : ''}">Erdos-Straus</a></li>
                <li><a href="beal-conjecture.html" class="${isActive('beal-conjecture.html') ? 'active' : ''}">Beal Conjecture</a></li>
                <li><a href="legendre-conjecture.html" class="${isActive('legendre-conjecture.html') ? 'active' : ''}">Legendre's Conjecture</a></li>
                <li><a href="mersenne-primes.html" class="${isActive('mersenne-primes.html') ? 'active' : ''}">Mersenne Primes</a></li>
                <li><a href="brocard-problem.html" class="${isActive('brocard-problem.html') ? 'active' : ''}">Brocard's Problem</a></li>
                <li><a href="perfect-numbers.html" class="${isActive('perfect-numbers.html') ? 'active' : ''}">Perfect Numbers</a></li>
                <li><a href="pascal.html" class="${isActive('pascal.html') ? 'active' : ''}">Pascal's Triangle</a></li>
            </ul>
        </div>
        <div class="nav-section">
            <h3 class="nav-section-title">Distributed Computing</h3>
            <ul class="nav-links">
                <li><a href="contribute.html" class="${isActive('contribute.html') ? 'active' : ''}">Contribute</a></li>
            </ul>
        </div>
    `;
    return nav;
}

// Auto-inject navigation if script is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const existingNav = document.querySelector('.sidebar-nav');
        if (!existingNav) {
            const nav = createNavigation();
            document.body.insertBefore(nav, document.body.firstChild);
            
            // Add mobile toggle button
            if (window.innerWidth <= 1024) {
                const toggle = document.createElement('button');
                toggle.className = 'mobile-nav-toggle';
                toggle.innerHTML = '☰';
                toggle.onclick = () => {
                    nav.classList.toggle('open');
                };
                document.body.insertBefore(toggle, nav);
            }
        }
    });
}

