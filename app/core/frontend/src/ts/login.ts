// This file will be compiled to JS and included in the HTML directly
// Global authService will be available from auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Get authService from global scope
    const authService = (window as any).authService;
    
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    const rememberMeCheckbox = document.getElementById('remember-me') as HTMLInputElement;
    
    // Initialize auth service
    if (authService) {
        authService.init();
        
        // Redirect if already logged in
        if (authService.isAuthenticated()) {
            window.location.href = '/index.html';
            return;
        }
    }
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const rememberMe = rememberMeCheckbox.checked;
        
        try {
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg><span>Connexion en cours...</span>`;
            
            // Use the auth service instead of direct API call
            const success = await authService.login(email, password, rememberMe);
            
            if (success) {
                // Redirect to home page on successful login
                window.location.href = '/index.html';
            } else {
                // Show error message
                errorText.textContent = 'Email ou mot de passe incorrect. Veuillez réessayer.';
                errorMessage.classList.remove('hidden');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorText.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            errorMessage.classList.remove('hidden');
            
            // Reset button
            const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            submitButton.disabled = false;
            submitButton.innerHTML = `<span>Se connecter</span>`;
        }
    });
}); 