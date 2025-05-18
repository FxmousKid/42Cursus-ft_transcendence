// This file will be compiled to JS and included in the HTML directly
// Global services will be available

document.addEventListener('DOMContentLoaded', () => {
    console.log('Index page loaded');
    
    // Get services from global scope
    const authService = (window as any).authService;
    console.log('AuthService available:', !!authService);
    
    // Initialize auth service if available
    if (authService && authService.init) {
        console.log('Initializing auth service');
        authService.init();
    } else {
        console.warn('Auth service not available or missing init method');
    }
    
    // Update UI based on authentication status
    updateUI();
    
    function updateUI() {
        const isAuthenticated = authService && authService.isAuthenticated && authService.isAuthenticated();
        console.log('User is authenticated:', isAuthenticated);
        
        // Elements that should only appear for authenticated users
        const authElements = document.querySelectorAll('.auth-only');
        
        // Elements that should only appear for non-authenticated users
        const guestElements = document.querySelectorAll('.guest-only');
        
        if (isAuthenticated) {
            // Show auth elements, hide guest elements
            authElements.forEach(el => el.classList.remove('hidden'));
            guestElements.forEach(el => el.classList.add('hidden'));
            
            // Update username if displayed
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay && authService.getUsername) {
                usernameDisplay.textContent = `Bonjour, ${authService.getUsername() || 'Utilisateur'}`;
            }
            
            // Note: Logout functionality is now handled by header-loader.ts
        } else {
            // Hide auth elements, show guest elements
            authElements.forEach(el => el.classList.add('hidden'));
            guestElements.forEach(el => el.classList.remove('hidden'));
        }
    }
}); 