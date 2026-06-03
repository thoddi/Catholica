class ChapterMenu extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    set chapters(value) {
        this._chapters = Array.isArray(value) ? value : [];
        this.renderList();
    }

    set currentChapter(value) {
        this._currentChapter = Number(value) || 1;
        this.renderList();
    }

    open() {
        this.querySelector('[data-overlay]')?.classList.remove('d-none');
        this.querySelector('[data-sheet]')?.classList.add('show');
    }

    close() {
        this.querySelector('[data-sheet]')?.classList.remove('show');
        this.querySelector('[data-overlay]')?.classList.add('d-none');
    }

    render() {
        this.innerHTML = `
        <style>
            chapter-menu [data-sheet] {
                position: fixed;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1055;
                background: #fff;
                border-top-left-radius: 16px;
                border-top-right-radius: 16px;
                box-shadow: 0 -6px 24px rgba(0,0,0,0.15);
                transform: translateY(100%);
                transition: transform 180ms ease-out;
                max-height: 65vh;
                display: flex;
                flex-direction: column;
            }

            chapter-menu [data-sheet].show {
                transform: translateY(0);
            }
        </style>
        <div class="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-none" style="z-index:1050;" data-overlay></div>
        <section data-sheet>
            <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                <div class="text-uppercase small fw-bold">Kaflar</div>
                <button class="btn btn-sm btn-outline-secondary" data-close>Loka</button>
            </div>
            <div class="overflow-auto p-2" data-list></div>
        </section>`;

        this.querySelector('[data-overlay]')?.addEventListener('click', () => this.close());
        this.querySelector('[data-close]')?.addEventListener('click', () => this.close());
        this.renderList();
    }

    renderList() {
        const list = this.querySelector('[data-list]');
        if (!list) {
            return;
        }

        const chapters = Array.isArray(this._chapters) ? this._chapters : [];
        const current = Number(this._currentChapter) || 1;

        if (chapters.length === 0) {
            list.innerHTML = '<div class="small text-muted p-2">Engir kaflar fundust.</div>';
            return;
        }

        list.innerHTML = chapters.map((chapter, index) => {
            const chapterNumber = index + 1;
            const title = chapter?.title || `Kafli ${chapterNumber}`;
            const isActive = chapterNumber === current;
            return `
                <button type="button" class="btn w-100 text-start mb-2 ${isActive ? 'btn-secondary' : 'btn-light border'}" data-chapter="${chapterNumber}" ${isActive ? 'disabled' : ''}>
                    <span class="small text-uppercase opacity-75 me-2">${chapterNumber}</span>
                    <span>${this.escapeHtml(title)}</span>
                    ${isActive ? '<span class="badge text-bg-dark ms-2">Núverandi</span>' : ''}
                </button>
            `;
        }).join('');

        this.querySelectorAll('[data-chapter]').forEach((button) => {
            button.addEventListener('click', () => {
                const chapterNumber = Number(button.getAttribute('data-chapter'));
                if (!Number.isNaN(chapterNumber)) {
                    this.dispatchEvent(new CustomEvent('chapter-select', {
                        detail: { chapterNumber },
                        bubbles: true,
                        composed: true
                    }));
                    this.close();
                }
            });
        });
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

customElements.define('chapter-menu', ChapterMenu);
