import { getBook, getBookCoverUrl, getChapters, getProgress, getReadingPlan, getReadingPlanChapters } from '../services/dataService.js';

class BookCoverView extends HTMLElement {
    get #params() {
        const hash = window.location.hash || '';
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        return new URLSearchParams(query);
    }

    get #bookId() {
        return this.#params.get('bookId') || '';
    }

    get #planId() {
        return this.#params.get('planId') || '';
    }

    async connectedCallback() {
        this.renderLoading();

        if (this.#planId) {
            await this.loadReadingPlan();
        } else if (this.#bookId) {
            await this.loadBook();
        } else {
            this.renderState('Ekkert valið.');
        }
    }

    async loadBook() {
        const [{ book }, coverUrl, { chapters }] = await Promise.all([
            getBook(this.#bookId),
            getBookCoverUrl(this.#bookId),
            getChapters(this.#bookId)
        ]);

        if (!book) {
            this.renderState('Bók fannst ekki.');
            return;
        }

        const totalChapters = Array.isArray(chapters) ? chapters.length : 0;
        const progress = await getProgress(this.#bookId);
        const savedIndex = progress?.bookTextId && Array.isArray(chapters)
            ? chapters.findIndex(c => c.id === progress.bookTextId)
            : -1;
        const startChapter = savedIndex >= 0 ? savedIndex + 1 : 1;
        const progressPercent = totalChapters > 0 ? Math.round(((startChapter - 1) / totalChapters) * 100) : 0;

        this.renderCover({
            title: book.title || 'Ónefnd bók',
            description: book.description || '',
            coverUrl,
            totalItems: totalChapters,
            currentItem: startChapter,
            progressPercent,
            itemLabel: 'kaflar',
            itemSingular: 'Kafli',
            actionHref: `#/reader?bookId=${encodeURIComponent(this.#bookId)}&chapter=${startChapter}`,
            hasProgress: progressPercent > 0
        });
    }

    async loadReadingPlan() {
        const [{ plan }, { chapters }] = await Promise.all([
            getReadingPlan(this.#planId),
            getReadingPlanChapters(this.#planId)
        ]);

        if (!plan) {
            this.renderState('Lestraráætlun fannst ekki.');
            return;
        }

        const totalChapters = Array.isArray(chapters) ? chapters.length : 0;

        this.renderCover({
            title: plan.title || 'Ónefnd lestraráætlun',
            description: plan.metadata?.description || '',
            coverUrl: null,
            totalItems: totalChapters,
            currentItem: 1,
            progressPercent: 0,
            itemLabel: 'kaflar',
            itemSingular: 'Kafli',
            actionHref: `#/reader?planId=${encodeURIComponent(this.#planId)}&chapter=1`,
            hasProgress: false,
            subtitle: 'Lestraráætlun'
        });
    }

    renderCover({ title, description, coverUrl, totalItems, currentItem, progressPercent, itemLabel, itemSingular, actionHref, hasProgress, subtitle }) {
        const coverStyle = coverUrl
            ? `background: url('${coverUrl}') center / cover no-repeat; min-height: 320px;`
            : 'background: linear-gradient(135deg, #6c757d 0%, #343a40 100%); min-height: 320px;';

        const progressLabel = hasProgress
            ? `${itemSingular} ${currentItem} af ${totalItems}`
            : `${totalItems} ${itemLabel}`;

        const buttonLabel = hasProgress ? 'Halda áfram lestri' : 'Hefja lestur';

        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div style="${coverStyle}">
                <div class="d-flex align-items-center px-3 pt-3">
                    <a href="#/" class="btn btn-sm btn-dark bg-opacity-75 me-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/></svg>
                    </a>
                </div>
                ${!coverUrl ? `<div class="d-flex justify-content-center align-items-center" style="min-height:240px;"><h2 class="text-white text-uppercase fw-bold text-center px-4">${this.escapeHtml(title)}</h2></div>` : ''}
            </div>
            <div class="px-4 pt-4 pb-2">
                ${subtitle ? `<div class="small text-uppercase text-muted mb-1">${this.escapeHtml(subtitle)}</div>` : ''}
                <h3 class="text-uppercase fw-bold mb-1">${this.escapeHtml(title)}</h3>
                ${description ? `<p class="text-muted">${this.escapeHtml(description)}</p>` : ''}
            </div>
            ${totalItems > 0 ? `
            <div class="px-4 mb-4">
                <div class="d-flex justify-content-between small text-muted mb-1">
                    <span>Framvinda</span>
                    <span>${this.escapeHtml(progressLabel)}</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" style="width: ${progressPercent}%" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
            ` : ''}
            <div class="px-4">
                <a href="${actionHref}" class="btn btn-dark d-block w-100">${buttonLabel}</a>
            </div>
        </main>`;
    }

    renderLoading() {
        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div class="container py-4">
                <div class="text-secondary spinner-border spinner-border-sm" role="status"></div>
                <span class="small ms-2">Sæki bók...</span>
            </div>
        </main>`;
    }

    renderState(message) {
        this.innerHTML = `
        <main class="bg-white" style="font-family: Lato, sans-serif; min-height: 100vh; padding-bottom: 130px;">
            <div class="container py-4">
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

customElements.define('book-cover-view', BookCoverView);
