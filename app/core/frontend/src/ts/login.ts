document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;
        
        try {
            // API URL from backend with full URL and mode: 'cors'
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                mode: 'cors', // Explicitly set CORS mode
                credentials: 'include' // Include cookies in the request
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store token in localStorage
                localStorage.setItem('auth_token', data.data.token);
                localStorage.setItem('user_id', data.data.id.toString());
                localStorage.setItem('username', data.data.username);
                
                // Redirect to home page
                window.location.href = '/index.html';
            } else {
                // Show error message
                errorText.textContent = data.message || 'Erreur de connexion. Veuillez réessayer.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error during login:', error);
            errorText.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            errorMessage.classList.remove('hidden');
        }
    });
}); 