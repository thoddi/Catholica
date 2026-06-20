import { getShelfBooks, getShelfReadingPlans } from '../services/dataService.js';

class BookShelf extends HTMLElement {
    connectedCallback() {
        this.render();
        this.loadContent();
    }

    get #id() {
        return this.getAttribute('id') || '';
    }

    async loadContent() {
        const container = this.querySelector('[data-books]');
        if (!container || !this.#id) {
            return;
        }

        const [{ bookIds, error: booksError }, { readingPlans, error: plansError }] = await Promise.all([
            getShelfBooks(this.#id),
            getShelfReadingPlans(this.#id)
        ]);

        const hasBooks = !booksError && Array.isArray(bookIds) && bookIds.length > 0;
        const hasPlans = !plansError && Array.isArray(readingPlans) && readingPlans.length > 0;

        if (!hasBooks && !hasPlans) {
            container.innerHTML = '<div class="small text-muted px-2">Engar bækur fundust.</div>';
            return;
        }

        let html = '';

        if (hasBooks) {
            html += bookIds.map((bookId) => `
                <book-item book-id="${this.escapeAttribute(bookId)}"></book-item>
            `).join('');
        }

        if (hasPlans) {
            html += readingPlans.map((plan) => `
                <reading-plan-item plan-id="${this.escapeAttribute(plan.id)}" plan-title="${this.escapeAttribute(plan.title)}"></reading-plan-item>
            `).join('');
        }

        container.innerHTML = html;
    }

    escapeAttribute(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    render() {
        const title = this.getAttribute('title') || 'Ónefnd hilla';
        const subtitle = this.getAttribute('subtitle') || '';

        this.innerHTML = `
            <section class="mb-4">
                <h6 class="text-uppercase small fw-bold mb-1 px-2 opacity-75">${title}</h6>
                ${subtitle ? `<p class="small text-muted mb-2 px-2">${subtitle}</p>` : ''}
                <div class="d-flex overflow-auto gap-3 pb-3 px-2 hide-scrollbar" data-books>
                    <div class="book-card"><div class="bg-light border d-flex justify-content-center align-items-center cover"><div class="text-secondary spinner-border spinner-border-sm" role="status"></div></div></div>
                </div>
            </section>
        `;
    }
}

customElements.define('book-shelf', BookShelf);
