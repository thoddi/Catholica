import { getBook, getChapter, getChapters, getReadingPlan, getReadingPlanChapters, getBookTextsByIds, saveProgress, saveProgressKeepAlive } from '../services/dataService.js';

const MARKED_URL = 'https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js';

class ReaderView extends HTMLElement {
    static markedLoadPromise = null;

    get bookId() {
        return this.routeParams.get('bookId') || '';
    }

    get planId() {
        return this.routeParams.get('planId') || '';
    }

    get chapterIndex() {
        const chapter = Number(this.routeParams.get('chapter') || '1');
        return Number.isNaN(chapter) || chapter < 1 ? 1 : chapter;
    }

    get #isReadingPlan() {
        return !!this.planId;
    }

    async connectedCallback() {
        this.routeParams = this.getRouteParams();

        if (!this.bookId && !this.planId) {
            this.renderState('Veldu bók úr hillu til að hefja lestur.');
            return;
        }

        this.renderLoading();

        if (this.#isReadingPlan) {
            await this.initReadingPlan();
        } else {
            await this.initBook();
        }
    }

    async initBook() {
        const { book } = await getBook(this.bookId);
        this.title = book?.title || 'Ónefnd bók';
        if (!book) {
            this.renderState('Bók fannst ekki.');
            return;
        }

        const { chapters } = await getChapters(this.bookId);
        this.chapters = Array.isArray(chapters) ? chapters : [];
        if (this.chapters.length === 0) {
            this.renderState('Engir kaflar fundust fyrir þessa bók.', this.title);
            return;
        }

        await this.ensureMarkedLoaded();
        await this.loadBookChapter();
    }

    async initReadingPlan() {
        const { plan } = await getReadingPlan(this.planId);
        this.title = plan?.title || 'Ónefnd lestraráætlun';
        if (!plan) {
            this.renderState('Lestraráætlun fannst ekki.');
            return;
        }

        const { chapters } = await getReadingPlanChapters(this.planId);
        this.chapters = Array.isArray(chapters) ? chapters : [];
        if (this.chapters.length === 0) {
            this.renderState('Engir kaflar fundust.', this.title);
            return;
        }

        await this.ensureMarkedLoaded();
        await this.loadPlanChapter();
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

    async loadBookChapter() {
        const { chapter } = await getChapter(this.bookId, this.chapterIndex);
        if (!chapter) {
            this.renderState('Kafli fannst ekki.', this.title);
            return;
        }

        this.#currentChapterId = chapter.id;
        this.#progressBookId = this.bookId;
        this.#scrollY = 0;

        const chapterTitle = chapter?.title ?? `Kafli ${this.chapterIndex}`;
        const chapterHtml = this.renderMarkdown(chapter?.content ?? '');

        this.renderReader(chapterTitle, chapterHtml);
    }

    async loadPlanChapter() {
        const idx = Math.min(this.chapterIndex - 1, this.chapters.length - 1);
        const planChapter = this.chapters[idx];
        if (!planChapter) {
            this.renderState('Kafli fannst ekki.', this.title);
            return;
        }

        const textIds = Array.isArray(planChapter.book_text_id) ? planChapter.book_text_id : [];
        let contentHtml = '';

        if (textIds.length > 0) {
            const { bookTexts } = await getBookTextsByIds(textIds);
            contentHtml = bookTexts.map(t => this.renderMarkdown(t.content ?? '')).join('<hr class="my-4">');
        }

        const chapterTitle = planChapter.title || `Kafli ${this.chapterIndex}`;
        const description = planChapter.description || '';
        const descriptionHtml = description ? `<p class="text-muted mb-3">${this.escapeHtml(description)}</p>` : '';

        this.#currentChapterId = null;
        this.#progressBookId = null;
        this.#scrollY = 0;

        this.renderReader(chapterTitle, descriptionHtml + contentHtml);
    }

    renderReader(chapterTitle, chapterHtml) {
        this.innerHTML = `
        <main class="bg-white pb-5" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <header class="border-bottom px-3 py-3">
                <div class="small text-muted text-uppercase">Lesari</div>
                <h5 class="mb-0 text-uppercase">${this.escapeHtml(this.title)}</h5>
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
                    this.openChapter(chapterNumber);
                }
            });
        }

        this.querySelectorAll('[data-prev]').forEach(btn => {
            btn.addEventListener('click', () => this.openChapter(this.chapterIndex - 1));
        });

        this.querySelectorAll('[data-next]').forEach(btn => {
            btn.addEventListener('click', () => this.openChapter(this.chapterIndex + 1));
        });

        this.querySelectorAll('[data-open-chapters]').forEach(btn => {
            btn.addEventListener('click', () => chapterMenu?.open());
        });

        this.#bindScrollTracking();
    }

    openChapter(chapterNumber) {
        if (this.#isReadingPlan) {
            window.location.hash = `#/reader?planId=${encodeURIComponent(this.planId)}&chapter=${chapterNumber}`;
        } else {
            window.location.hash = `#/reader?bookId=${encodeURIComponent(this.bookId)}&chapter=${chapterNumber}`;
        }
    }

    #currentChapterId = null;
    #progressBookId = null;
    #scrollY = 0;
    #scrollCleanup = null;

    #bindScrollTracking() {
        const onScroll = () => {
            this.#scrollY = Math.round(window.scrollY);
        };

        const beforeUnloadHandler = () => {
            if (this.#currentChapterId && this.#progressBookId) {
                saveProgressKeepAlive(this.#progressBookId, this.#currentChapterId, this.#scrollY);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('beforeunload', beforeUnloadHandler);

        this.#scrollCleanup = () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        };
    }

    disconnectedCallback() {
        if (this.#currentChapterId && this.#progressBookId) {
            saveProgress(this.#progressBookId, this.#currentChapterId, this.#scrollY);
        }
        this.#scrollCleanup?.();
    }

    renderMarkdown(content) {
        const text = String(content ?? '');
        if (window.marked?.parse) {
            return window.marked.parse(text);
        }

        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    renderLoading() {
        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div class="container py-4" style="max-width: 720px;">
                <div class="text-secondary spinner-border spinner-border-sm" role="status"></div>
                <span class="small ms-2">Sæki efni...</span>
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
