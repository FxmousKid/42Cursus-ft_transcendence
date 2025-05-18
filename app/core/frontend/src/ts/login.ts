// This file will be compiled to JS and included in the HTML directly
// Global authService will be available from auth.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Login page loaded');
    
    // Get authService from global scope
    const authService = (window as any).authService;
    console.log('AuthService available:', !!authService);
    
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    const rememberMeCheckbox = document.getElementById('remember-me') as HTMLInputElement;
    
    if (!loginForm) {
        console.error('Login form not found');
        return;
    }
    
    // Initialize auth service if available
    if (authService && authService.init) {
        console.log('Initializing auth service');
        authService.init();
        
        // Redirect if already logged in
        if (authService.isAuthenticated && authService.isAuthenticated()) {
            console.log('User already authenticated, redirecting');
            window.location.href = '/index.html';
            return;
        }
    } else {
        console.warn('Auth service not available or missing init method');
    }
    
    // Get redirect URL from query params if present
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect') || '/index.html';
    
    // Show success message if coming from registration
    if (urlParams.has('registered') && urlParams.get('registered') === 'true') {
        // Create success message element
        const successMessage = document.createElement('div');
        successMessage.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded';
        successMessage.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm">Inscription réussie ! Vous pouvez maintenant vous connecter.</p>
                </div>
            </div>
        `;
        
        // Insert registration success message before the form
        const formContainer = loginForm.parentElement;
        if (formContainer) {
            formContainer.insertBefore(successMessage, loginForm);
        }
    }
    
    // Show redirect message if coming from a protected page
    if (urlParams.has('redirect') && urlParams.get('redirect') !== '/index.html') {
        const redirectMessage = document.createElement('div');
        redirectMessage.className = 'bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded';
        redirectMessage.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm">Veuillez vous connecter pour accéder à la page demandée.</p>
                </div>
            </div>
        `;
        
        // Insert redirect message before the form
        const formContainer = loginForm.parentElement;
        if (formContainer) {
            formContainer.insertBefore(redirectMessage, loginForm);
        }
    }
    
    // Display error function
    function showError(message: string) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
        } else {
            alert(message);
        }
    }
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = (document.getElementById('email') as HTMLInputElement)?.value;
        const password = (document.getElementById('password') as HTMLInputElement)?.value;
        
        if (!email || !password) {
            showError('Veuillez remplir tous les champs');
            return;
        }
        
        const rememberMe = rememberMeCheckbox?.checked || false;
        
        try {
            console.log('Attempting login for:', email);
            
            // Show loading state
            const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg><span>Connexion en cours...</span>`;
            
            // Check if auth service is available
            if (!authService || !authService.login) {
                console.error('Auth service login method not available');
                showError('Service d\'authentification non disponible. Veuillez réessayer.');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
                return;
            }
            
            // Use the auth service instead of direct API call
            const success = await authService.login(email, password, rememberMe);
            console.log('Login success:', success);
            
            if (success) {
                // Redirect to original requested page or home page on successful login
                window.location.href = redirectUrl;
            } else {
                // Show error message
                showError('Email ou mot de passe incorrect. Veuillez réessayer.');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Error during login:', error);
            showError('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
            
            // Reset button
            const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = `<span>Se connecter</span>`;
            }
        }
    });
}); 