class NotesView extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
        <main class="bg-white" style="padding-bottom:90px;">
            <div class="container" style="background: #965d2e;min-height: 80px;"><input class="rounded-pill form-control-sm" type="search" style="border-radius: 0px;" placeholder="Leita af glósum..."></div>
            <div class="container" style="border: 1px solid #965d2e;">
                <div class="row"><div class="col-8 col-md-12" style="font-family: Lato, sans-serif;"><p class="text-uppercase small fw-semibold" style="margin-top: 10px;margin-bottom: 0px;">Mattías 20:16</p></div><div class="col-3 col-md-6"><p class="small" style="font-family: Lato, sans-serif;margin-top: 10px;margin-bottom: 0px;">02/02/26</p></div></div>
                <div class="row"><div class="col-12 col-md-6"><p class="small" style="font-family: Lato, sans-serif;margin-top: 5px;">“Þannig verða hinir síðustu fyrstir og hinir fyrstu síðastir.”</p></div></div>
            </div>
        </main>`;
    }
}

customElements.define('notes-view', NotesView);
