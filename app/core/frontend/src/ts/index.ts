import { api } from './api';
import { websocketService } from './websocket';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('username');
    
    if (!token) {
        // Redirect to login page if not logged in
        window.location.href = '/login.html';
        return;
    }
    
    // Connect to WebSocket
    websocketService.connect();
    
    // Display username
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = `Bonjour, ${username}`;
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
    
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                // Use API service for logout
                await api.auth.logout();
                
                // Disconnect from WebSocket
                websocketService.disconnect();
                
                // Clear local storage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('username');
                
                // Redirect to login page
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error during logout:', error);
                // Still redirect to login even if API call fails
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                localStorage.removeItem('username');
                window.location.href = '/login.html';
            }
        });
    }
}); 