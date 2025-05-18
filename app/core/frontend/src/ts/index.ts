// This file will be compiled to JS and included in the HTML directly
// Global services will be available

document.addEventListener('DOMContentLoaded', () => {
    // Get services from global scope
    const authService = (window as any).authService;
    const websocketService = (window as any).websocketService;
    
    // Initialize auth service if available
    if (authService) {
        authService.init();
        
        // Check if user is logged in
        if (!authService.isAuthenticated()) {
            // Redirect to login page if not logged in
            window.location.href = '/login.html';
            return;
        }
    }
    
    // Connect to WebSocket if available
    if (websocketService) {
        websocketService.connect();
    }
    
    // Display username
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && authService) {
        usernameDisplay.textContent = `Bonjour, ${authService.getUsername() || 'Utilisateur'}`;
    }
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Logout functionality
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    
    if (logoutButton && authService) {
        logoutButton.addEventListener('click', async () => {
            try {
                // Show loading state
                logoutButton.innerHTML = `<svg class="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Déconnexion...`;
                
                // Disconnect from WebSocket if available
                if (websocketService) {
                    websocketService.disconnect();
                }
                
                // Use auth service for logout
                await authService.logout();
                
                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error during logout:', error);
                // Still redirect to login even if API call fails
                window.location.href = '/login.html';
            }
        });
    }
    
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutButton?.click();
        });
    }
}); 