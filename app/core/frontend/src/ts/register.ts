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
            // API URL from backend with full URL and mode: 'cors'
            // Try multiple URLs to ensure connectivity
            let response;
            try {
                // First try the original URL
                response = await fetch('http://localhost:3000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password }),
                    mode: 'cors', // Explicitly set CORS mode
                    credentials: 'include' // Include cookies in the request
                });
            } catch (e) {
                // If that fails, try the Docker container name
                response = await fetch('http://backend:3000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password }),
                    mode: 'cors',
                    credentials: 'include'
                });
            }
            
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
                errorText.textContent = data.message || 'Erreur d\'inscription. Veuillez réessayer.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            errorText.textContent = 'Erreur de connexion au serveur. Veuillez réessayer plus tard.';
            errorMessage.classList.remove('hidden');
        }
    });
}); 