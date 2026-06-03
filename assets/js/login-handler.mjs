import { signIn } from './authenticationService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const messageDiv = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            messageDiv.innerHTML = '<div class="text-info">Logging in...</div>';
            
            try {
                const { user, error } = await signIn(email, password);
                
                if (error) {
                    messageDiv.innerHTML = `<div class="text-danger">${error.message}</div>`;
                } else if (user) {
                    messageDiv.innerHTML = '<div class="text-success">Logged in successfully! Redirecting...</div>';
                    // Optional: Redirect to home or profile after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            } catch (err) {
                messageDiv.innerHTML = `<div class="text-danger">An unexpected error occurred.</div>`;
                console.error(err);
            }
        });
    }
});