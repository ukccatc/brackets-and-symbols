// Theme Management
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const lightIcon = document.querySelector('.theme-icon-light');
const darkIcon = document.querySelector('.theme-icon-dark');

// Initialize theme from localStorage or system preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setDarkTheme();
    } else {
        setLightTheme();
    }
}

function setDarkTheme() {
    htmlElement.classList.add('dark');
    lightIcon.classList.add('hidden');
    darkIcon.classList.remove('hidden');
    localStorage.setItem('theme', 'dark');
}

function setLightTheme() {
    htmlElement.classList.remove('dark');
    lightIcon.classList.remove('hidden');
    darkIcon.classList.add('hidden');
    localStorage.setItem('theme', 'light');
}

function toggleTheme() {
    if (htmlElement.classList.contains('dark')) {
        setLightTheme();
    } else {
        setDarkTheme();
    }
}

themeToggle.addEventListener('click', toggleTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            setDarkTheme();
        } else {
            setLightTheme();
        }
    }
});

// Copy to Clipboard functionality
function copyToClipboard(text) {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showCopyFeedback('Copied!');
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopyToClipboard(text);
            });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textArea);
    
    try {
        textArea.select();
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyFeedback('Copied!');
        } else {
            showCopyFeedback('Failed to copy');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showCopyFeedback('Copy not supported');
    } finally {
        document.body.removeChild(textArea);
    }
}

function showCopyFeedback(message) {
    // Create or reuse feedback element
    let feedback = document.getElementById('copy-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'copy-feedback';
        feedback.className = 'copy-feedback';
        document.body.appendChild(feedback);
    }
    
    feedback.textContent = message;
    feedback.classList.add('show');
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

// Add click listeners to all copy buttons
document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToCopy = button.getAttribute('data-copy');
        copyToClipboard(textToCopy);
        
        // Visual feedback on button
        const originalContent = button.innerHTML;
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        button.classList.add('copy-success');
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.classList.remove('copy-success');
        }, 1500);
    });
});

// Search and Filter functionality
const searchInput = document.getElementById('search-input');
const searchResultsCount = document.getElementById('search-results-count');
const symbolCards = document.querySelectorAll('.symbol-card');
const sectionContents = document.querySelectorAll('.section-content');

function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .trim();
}

function highlightText(element, searchTerm) {
    if (!searchTerm) return;
    
    const textNodes = getTextNodes(element);
    const normalizedSearch = normalizeText(searchTerm);
    
    textNodes.forEach(node => {
        const text = node.textContent;
        const normalizedText = normalizeText(text);
        const index = normalizedText.indexOf(normalizedSearch);
        
        if (index !== -1) {
            const beforeMatch = text.substring(0, index);
            const match = text.substring(index, index + searchTerm.length);
            const afterMatch = text.substring(index + searchTerm.length);
            
            const wrapper = document.createElement('span');
            wrapper.innerHTML = `${escapeHtml(beforeMatch)}<mark class="search-highlight">${escapeHtml(match)}</mark>${escapeHtml(afterMatch)}`;
            
            node.parentNode.replaceChild(wrapper, node);
        }
    });
}

function removeHighlights() {
    document.querySelectorAll('.search-highlight').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceWith(parent.textContent);
    });
    
    // Normalize text nodes
    document.querySelectorAll('.symbol-card, .section-content > div').forEach(el => {
        el.normalize();
    });
}

function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip script, style, and already highlighted text
                if (node.parentElement.tagName === 'SCRIPT' || 
                    node.parentElement.tagName === 'STYLE' ||
                    node.parentElement.classList.contains('copy-btn') ||
                    node.parentElement.tagName === 'MARK') {
                    return NodeFilter.FILTER_REJECT;
                }
                // Only accept non-empty text nodes
                if (node.textContent.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        }
    );
    
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    return textNodes;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function performSearch(searchTerm) {
    removeHighlights();
    
    if (!searchTerm) {
        // Show all cards and sections
        symbolCards.forEach(card => {
            card.style.display = '';
        });
        sectionContents.forEach(section => {
            section.style.display = '';
        });
        searchResultsCount.textContent = '';
        return;
    }
    
    const normalizedSearch = normalizeText(searchTerm);
    let visibleCount = 0;
    
    // Search in symbol cards
    symbolCards.forEach(card => {
        const terms = card.getAttribute('data-terms') || '';
        const cardText = card.textContent;
        const allText = `${terms} ${cardText}`;
        
        if (normalizeText(allText).includes(normalizedSearch)) {
            card.style.display = '';
            highlightText(card, searchTerm);
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Search in other section content (phrases, notes)
    document.querySelectorAll('.section-content > div:not(.grid)').forEach(item => {
        if (!item.classList.contains('grid')) {
            const terms = item.getAttribute('data-terms') || '';
            const itemText = item.textContent;
            const allText = `${terms} ${itemText}`;
            
            if (normalizeText(allText).includes(normalizedSearch)) {
                item.style.display = '';
                highlightText(item, searchTerm);
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        }
    });
    
    // Hide empty sections
    sectionContents.forEach(section => {
        const visibleItems = section.querySelectorAll('.symbol-card:not([style*="display: none"]), .section-content > div:not(.grid):not([style*="display: none"])');
        if (visibleItems.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });
    
    // Update results count
    if (visibleCount === 0) {
        searchResultsCount.textContent = 'No results found. Try a different search term.';
        searchResultsCount.classList.add('text-red-500');
    } else {
        searchResultsCount.textContent = `Found ${visibleCount} result${visibleCount !== 1 ? 's' : ''}`;
        searchResultsCount.classList.remove('text-red-500');
    }
}

// Debounce search input
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch(e.target.value);
    }, 300);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            const headerOffset = 100;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Set build date in footer
function setBuildDate() {
    const buildDateElement = document.getElementById('build-date');
    if (buildDateElement) {
        const currentYear = new Date().getFullYear();
        buildDateElement.textContent = currentYear;
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setBuildDate();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        performSearch('');
        searchInput.blur();
    }
});

