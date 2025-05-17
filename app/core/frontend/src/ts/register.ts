import { api } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
        
        // Password validation
        if (password !== confirmPassword) {
            errorText.textContent = 'Les mots de passe ne correspondent pas.';
            errorMessage.classList.remove('hidden');
            return;
        }
        
        try {
            // Use API service instead of direct fetch
            const response = await api.auth.register(username, email, password);
            
            if (response.success && response.data) {
                // Store token and user info in localStorage
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user_id', response.data.id.toString());
                localStorage.setItem('username', response.data.username);
                
                // Redirect to home page
                window.location.href = '/index.html';
            } else {
                // Show error message
                errorText.textContent = response.message || 'Erreur d\'inscription. Veuillez réessayer.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            errorText.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            errorMessage.classList.remove('hidden');
        }
    });
}); 