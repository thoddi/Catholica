import './components/app-bottom-nav.js';
import './components/book-item.js';
import './components/reading-plan-item.js';
import './components/book-shelf.js';
import './components/home-view.js';
import './components/book-cover-view.js';
import './components/reader-view.js';
import './components/chapter-menu.js';
import './components/notes-view.js';
import './components/login-view.js';
import './components/catholica-app.js';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            await navigator.serviceWorker.register('./sw.js');
        } catch {
            // no-op
        }
    });
}
