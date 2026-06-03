import { signIn } from '../services/authenticationService.js';

class LoginView extends HTMLElement {
    connectedCallback() {
        this.render();
        this.bind();
    }

    bind() {
        const form = this.querySelector('#login-form');
        const emailInput = this.querySelector('#login-email');
        const passwordInput = this.querySelector('#login-password');
        const messageDiv = this.querySelector('#login-message');

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageDiv.innerHTML = '<div class="text-info">Logging in...</div>';

            try {
                const { user, error } = await signIn(emailInput.value, passwordInput.value);
                if (error) {
                    messageDiv.innerHTML = `<div class="text-danger">${error.message}</div>`;
                    return;
                }

                if (user) {
                    messageDiv.innerHTML = '<div class="text-success">Logged in successfully! Redirecting...</div>';
                    setTimeout(() => {
                        window.location.hash = '#/';
                    }, 1000);
                }
            } catch {
                messageDiv.innerHTML = '<div class="text-danger">An unexpected error occurred.</div>';
            }
        });
    }

    render() {
        this.innerHTML = `
        <section class="position-relative py-4 py-xl-5" style="padding-bottom:90px;">
            <div class="container">
                <div class="row mb-5"><div class="col-md-8 col-xl-6 text-center mx-auto"><h2>Log in</h2><p>Curae hendrerit donec commodo hendrerit egestas tempus, turpis facilisis nostra nunc. Vestibulum dui eget ultrices.</p></div></div>
                <div class="row d-flex justify-content-center">
                    <div class="col-md-6 col-xl-4">
                        <div class="card mb-5">
                            <div class="card-body d-flex flex-column align-items-center">
                                <div class="bs-icon-xl bs-icon-circle bs-icon-primary my-4 bs-icon-xl bs-icon-circle bs-icon-primary bs-icon"><svg class="bi bi-person" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664z"></path></svg></div>
                                <form class="text-center" method="post" id="login-form">
                                    <div class="mb-3"><input class="form-control" type="email" name="email" placeholder="Email" id="login-email" required=""></div>
                                    <div class="mb-3"><input class="form-control" type="password" name="password" placeholder="Password" id="login-password" required=""></div>
                                    <div class="mb-3"><button class="btn btn-primary d-block w-100" type="submit">Login</button></div>
                                    <div class="mt-3" id="login-message"></div>
                                    <p class="text-muted">Forgot your password?</p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>`;
    }
}

customElements.define('login-view', LoginView);
