class CatholicaApp extends HTMLElement {
    connectedCallback() {
        this.render();
        window.addEventListener('hashchange', this.handleRouteChange);
    }

    disconnectedCallback() {
        window.removeEventListener('hashchange', this.handleRouteChange);
    }

    handleRouteChange = () => {
        this.render();
    };

    getRoute() {
        const hash = window.location.hash || '#/';
        if (hash.startsWith('#/reader')) return 'reader';
        if (hash.startsWith('#/notes')) return 'notes';
        if (hash.startsWith('#/login')) return 'login';
        return 'home';
    }

    render() {
        const route = this.getRoute();
        const view = {
            home: '<home-view></home-view>',
            reader: '<reader-view></reader-view>',
            notes: '<notes-view></notes-view>',
            login: '<login-view></login-view>'
        }[route];

        this.innerHTML = `${view}<app-bottom-nav route="${route}"></app-bottom-nav>`;
    }
}

customElements.define('catholica-app', CatholicaApp);
