import { getBook } from '../Services/dataService.js'

/**
 * Book Loader Script
 * Fetches book data based on data-key attribute and renders the card content.
 */

const mockBookData = {
    'markus': {
        title: 'Markúsar Guðspjall',
        key: 'markus',
        duration: '35 DAGAR',
        image: '8.webp'
    },
    'biblian365': {
        title: 'Biblían 365',
        key: 'biblian365',
        duration: '365 DAGAR',
        image: '10.jpg'
    }
};

async function fetchBookData(key) {
    // This is where you'd implement your actual API call
    // For now, it returns from the mock object
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockBookData[key] || null);
        }, 500); // Simulate network delay
    });
}

function renderBookCard(element, data) {
    if (!data) {
        element.innerHTML = '<div class="text-danger small p-2">Book not found</div>';
        return;
    }

    element.innerHTML = `
        <div class="cover border" style="background: url('${data.image}') center / contain no-repeat;">
        </div>
        <div class="text-uppercase small fw-bold mt-2">
            <span>${data.title}</span>
        </div>
        <div class="small text-muted">
            <span>${data.duration}</span>
        </div>
    `;
}

async function initBookCards() {
    const cards = document.querySelectorAll('.book-card[data-key]');
    
    for (const card of cards) {
        const key = card.getAttribute('data-key');
        if (key) {
            const data = await fetchBookData(key);
            renderBookCard(card, data);
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initBookCards);