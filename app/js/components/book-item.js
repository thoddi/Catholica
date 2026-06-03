import { getBook, getBookCoverUrl } from '../services/dataService.js';

class BookItem extends HTMLElement {
    async connectedCallback() {
        this.renderLoading();
        this.classList.add('cursor-pointer');
        this.addEventListener('click', this.handleClick);
        await this.loadBook();
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
    }

    get #bookId() {
        return this.getAttribute('book-id') || '';
    }

    handleClick = () => {
        if (!this.#bookId) {
            return;
        }

        window.location.hash = `#/reader?bookId=${encodeURIComponent(this.#bookId)}&chapter=1`;
    };

    async loadBook() {
        if (!this.#bookId) {
            this.renderBook({ title: 'Ónefnd bók', subtitle: '', image: '' });
            return;
        }

        const [{ book }, image] = await Promise.all([
            getBook(this.#bookId),
            getBookCoverUrl(this.#bookId)
        ]);

        if (!book) {
            this.renderBook({ title: 'Ónefnd bók', subtitle: '', image: '' });
            return;
        }

        this.renderBook({
            title: book.title || 'Ónefnd bók',
            subtitle: book.duration || '',
            image: image || ''
        });
    }

    renderLoading() {
        this.className = 'book-card';
        this.innerHTML = '<div class="bg-light border d-flex justify-content-center align-items-center cover"><div class="text-secondary spinner-border spinner-border-sm" role="status"></div></div>';
    }

    renderBook({ title, subtitle, image }) {
        const coverStyle = image
            ? `background:url('${image}') center / contain no-repeat;`
            : 'background:#f8f9fa;';

        this.className = 'book-card';
        this.innerHTML = `
            <div class="border p-1 cover" style="${coverStyle}"></div>
            <div class="text-uppercase small fw-bold mt-2"><span>${title}</span></div>
            <div class="small text-muted"><span>${subtitle}</span></div>
        `;
    }
}

customElements.define('book-item', BookItem);
