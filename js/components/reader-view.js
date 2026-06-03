import { getBook, getChapter, getChapters } from '../services/dataService.js';

const MARKED_URL = 'https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js';

class ReaderView extends HTMLElement {
    static markedLoadPromise = null;

    get bookId() {
        return this.routeParams.get('bookId') || '';
    }

    get chapterIndex() {
        const chapter = Number(this.routeParams.get('chapter') || '1');
        return Number.isNaN(chapter) || chapter < 1 ? 1 : chapter;
    }

    async connectedCallback() {
        this.routeParams = this.getRouteParams();

        if (!this.bookId) {
            this.renderState('Veldu bók úr hillu til að hefja lestur.');
            return;
        }

        const { book } = await getBook(this.bookId);
        this.book = book;
        if (!this.book) {
            this.renderState('Bók fannst ekki.');
            return;
        }

        const { chapters } = await getChapters(this.bookId);
        this.chapters = Array.isArray(chapters) ? chapters : [];
        if (this.chapters.length === 0) {
            this.renderState('Engir kaflar fundust fyrir þessa bók.', this.book.title || 'Ónefnd bók');
            return;
        }

        this.renderLoading();
        await this.ensureMarkedLoaded();
        await this.loadContent();
    }

    getRouteParams() {
        const hash = window.location.hash || '';
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        return new URLSearchParams(query);
    }

    async ensureMarkedLoaded() {
        if (window.marked?.parse) {
            return;
        }

        if (!ReaderView.markedLoadPromise) {
            ReaderView.markedLoadPromise = new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${MARKED_URL}"]`);
                if (existing) {
                    existing.addEventListener('load', resolve, { once: true });
                    existing.addEventListener('error', reject, { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = MARKED_URL;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        try {
            await ReaderView.markedLoadPromise;
        } catch {
            // no-op; fallback is plain escaped text
        }
    }

    async loadContent() {
        const { chapter } = await getChapter(this.bookId, this.chapterIndex);
        if (!chapter) {
            this.renderState('Kafli fannst ekki.', this.book.title || 'Ónefnd bók');
            return;
        }

        const chapterTitle = chapter?.title ?? `Kafli ${this.chapterIndex}`;
        const chapterText = chapter?.content ?? '';
        const chapterHtml = this.renderMarkdown(chapterText);

        this.innerHTML = `
        <main class="bg-white pb-5" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <header class="border-bottom px-3 py-3">
                <div class="small text-muted text-uppercase">Lesari</div>
                <h5 class="mb-0 text-uppercase">${this.escapeHtml(this.book.title || 'Ónefnd bók')}</h5>
            </header>
            <section class="container py-4" style="max-width: 720px;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button class="btn btn-sm btn-outline-secondary" data-prev ${this.chapterIndex === 1 ? 'disabled' : ''}>Fyrri</button>
                    <button class="btn btn-sm btn-dark" data-open-chapters>${this.escapeHtml(chapterTitle)}</button>
                    <button class="btn btn-sm btn-outline-secondary" data-next ${this.chapterIndex >= this.chapters.length ? 'disabled' : ''}>Næsti</button>
                </div>
                <article class="lh-lg" data-chapter-content>${chapterHtml}</article>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <button class="btn btn-sm btn-outline-secondary" data-prev ${this.chapterIndex === 1 ? 'disabled' : ''}>Fyrri</button>
                    <button class="btn btn-sm btn-outline-secondary" data-open-chapters>Kaflar</button>
                    <button class="btn btn-sm btn-outline-secondary" data-next ${this.chapterIndex >= this.chapters.length ? 'disabled' : ''}>Næsti</button>
                </div>
            </section>
        </main>
        <chapter-menu></chapter-menu>`;

        const chapterMenu = this.querySelector('chapter-menu');
        if (chapterMenu) {
            chapterMenu.chapters = this.chapters;
            chapterMenu.currentChapter = this.chapterIndex;
            chapterMenu.addEventListener('chapter-select', (event) => {
                const chapterNumber = Number(event.detail?.chapterNumber);
                if (!Number.isNaN(chapterNumber) && chapterNumber !== this.chapterIndex) {
                    this.openChapter(this.bookId, chapterNumber);
                }
            });
        }

        this.querySelectorAll('[data-prev]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openChapter(this.bookId, this.chapterIndex - 1);
            });
        });

        this.querySelectorAll('[data-next]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openChapter(this.bookId, this.chapterIndex + 1);
            });
        });

        this.querySelectorAll('[data-open-chapters]').forEach(btn => {
            btn.addEventListener('click', () => chapterMenu?.open());
        });
    }

    renderMarkdown(content) {
        const text = String(content ?? '');
        if (window.marked?.parse) {
            return window.marked.parse(text);
        }

        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    openChapter(bookId, chapterNumber) {
        window.location.hash = `#/reader?bookId=${encodeURIComponent(bookId)}&chapter=${chapterNumber}`;
    }

    renderLoading() {
        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div class="container py-4" style="max-width: 720px;">
                <div class="text-secondary spinner-border spinner-border-sm" role="status"></div>
                <span class="small ms-2">Sæki bók...</span>
            </div>
        </main>`;
    }

    renderState(message, title = 'Lesari') {
        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div class="container py-4" style="max-width: 720px;">
                <h5 class="text-uppercase">${this.escapeHtml(title)}</h5>
                <p class="text-muted">${this.escapeHtml(message)}</p>
            </div>
        </main>`;
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

customElements.define('reader-view', ReaderView);
