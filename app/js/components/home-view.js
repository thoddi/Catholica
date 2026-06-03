import { getShelfs } from '../services/dataService.js';

class HomeView extends HTMLElement {
    connectedCallback() {
        this.render();
        this.loadShelfs();
    }

    async loadShelfs() {
        const shelfContainer = this.querySelector('[data-shelf-list]');
        if (!shelfContainer) return;

        const { shelfs, error } = await getShelfs();

        if (error || !Array.isArray(shelfs) || shelfs.length === 0) {
            shelfContainer.innerHTML = '<div class="small text-muted px-2">Engar hillur fundust.</div>';
            return;
        }

        shelfContainer.innerHTML = shelfs.map((shelf) =>
            `<book-shelf id="${this.escapeAttribute(shelf.id)}"
                         title="${this.escapeAttribute(shelf.name)}"
                         subtitle="${this.escapeAttribute(shelf.description)}">
            </book-shelf>`
        ).join('');
    }

    escapeAttribute(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    render() {
        this.innerHTML = `
        <header class="text-center text-white p-4 app-header" style="height: 344px;background: linear-gradient(black, rgba(0,0,0,0.3) 0%), url('../assets/img/Cover_crop.jpg') center / contain, var(--bs-info);opacity: 1;backdrop-filter: opacity(1);-webkit-backdrop-filter: opacity(1);filter: brightness(100%);">
            <div class="d-flex justify-content-between align-items-center mb-4 px-2"><svg class="bi bi-heart fs-5 text-white" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15"></path></svg><div class="small fw-bold"><span class="me-3 opacity-75" style="font-size:9px;">RITNINGARLESTUR</span><span class="opacity-75" style="font-size:9px;">LESTURINN MINN</span></div><svg class="bi bi-search fs-5 text-white" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"></path></svg></div>
            <div class="py-5 catholica-logo"><h1 style="font-size:3em;margin-bottom:-19px;">Catholica</h1><p class="text-uppercase small fw-bold mb-0" style="font-family:Lato, sans-serif;color:rgb(255, 255, 255);opacity:1;">kaþólsk fræðsla</p></div>
        </header>
        <main class="mb-5 pb-5 py-4 container-fluid">
            <section class="mb-4" data-shelf-list>
                <h3 class="text-uppercase small fw-bold mb-3 px-2 opacity-75">Hillur</h3>
                <div class="px-2 small text-muted">Sæki hillur...</div>
            </section>
        </main>`;
    }
}

customElements.define('home-view', HomeView);
