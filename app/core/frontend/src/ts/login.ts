import { api } from './api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        
        try {
            // Use the API service instead of direct fetch
            const response = await api.auth.login(email, password);
            
            if (response.success && response.data) {
                // Store token and user info in localStorage
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user_id', response.data.id.toString());
                localStorage.setItem('username', response.data.username);
                
                // Redirect to home page
                window.location.href = '/index.html';
            } else {
                // Show error message
                errorText.textContent = response.message || 'Erreur de connexion. Veuillez réessayer.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorText.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            errorMessage.classList.remove('hidden');
        }
    });
}); 