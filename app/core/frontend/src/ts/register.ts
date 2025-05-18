// This file will be compiled to JS and included in the HTML directly
// Global authService will be available from auth.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Register page loaded');
    
    // Get authService from global scope
    const authService = (window as any).authService;
    console.log('AuthService available:', !!authService);
    
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    
    if (!registerForm) {
        console.error('Register form not found');
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
    
    // Display error function
    function showError(message: string) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
        } else {
            alert(message);
        }
    }
    
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Clear previous error
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
        
        // Get form values
        const username = (document.getElementById('username') as HTMLInputElement)?.value;
        const email = (document.getElementById('email') as HTMLInputElement)?.value;
        const password = (document.getElementById('password') as HTMLInputElement)?.value;
        const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value;
        
        // Field validation
        if (!username || !email || !password || !confirmPassword) {
            showError('Veuillez remplir tous les champs');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (password.length < 8) {
            showError('Le mot de passe doit comporter au moins 8 caractères');
            return;
        }
        
        try {
            console.log('Attempting registration for:', email);
            
            // Show loading state
            const submitButton = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg><span>Inscription en cours...</span>`;
            
            // Check if auth service is available
            if (!authService || !authService.register) {
                console.error('Auth service register method not available');
                showError('Service d\'authentification non disponible. Veuillez réessayer.');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
                return;
            }
            
            // Use the auth service instead of direct API call
            const success = await authService.register(username, email, password);
            console.log('Registration success:', success);
            
            if (success) {
                // Redirect to login page with success message
                window.location.href = '/login.html?registered=true';
            } else {
                // Show generic error message
                showError('Erreur lors de l\'inscription. Veuillez réessayer.');
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }
        } catch (error: any) {
            console.error('Error during registration:', error);
            
            // Determine error message based on error response
            let errorMsg = 'Erreur lors de l\'inscription. Veuillez réessayer.';
            
            if (error.message) {
                if (error.message.includes('email already exists')) {
                    errorMsg = 'Cet email est déjà utilisé.';
                } else if (error.message.includes('username already exists')) {
                    errorMsg = 'Ce nom d\'utilisateur est déjà pris.';
                }
            } 
            
            showError(errorMsg);
            
            // Reset button
            const submitButton = registerForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = `<span>S'inscrire</span>`;
            }
        }
    });
}); 