/**
 * Google Auth Handler
 * Handles the Google OAuth callback and token processing
 */

(function() {
    'use strict';

    console.log('Google Auth Handler: Script loaded');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleGoogleAuth);
    } else {
        handleGoogleAuth();
    }

    function handleGoogleAuth() {
        console.log('Google Auth Handler: Processing authentication');

        try {
            // Get URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const error = urlParams.get('error');
            const reason = urlParams.get('reason');

            // Check for errors first
            if (error) {
                console.error('Google Auth Handler: Authentication error:', error, 'Reason:', reason);
                handleAuthError(error, reason || 'unknown');
                return;
            }

            // Check if we have a token
            if (!token) {
                console.error('Google Auth Handler: No token found in URL');
                handleAuthError('no_token', 'Token missing from callback URL');
                return;
            }

            console.log('Google Auth Handler: Token received, processing...');

            // Process the token
            processGoogleAuthToken(token);

        } catch (error) {
            console.error('Google Auth Handler: Unexpected error:', error);
            handleAuthError('unexpected_error', (error as Error).message);
        }
    }

    function processGoogleAuthToken(token: string) {
        try {
            // Check if authService is available
            if (!(window as any).authService) {
                console.error('Google Auth Handler: AuthService not available');
                handleAuthError('auth_service_unavailable', 'Authentication service not loaded');
                return;
            }

            // Check if API is available
            if (!(window as any).api) {
                console.error('Google Auth Handler: API not available');
                handleAuthError('api_unavailable', 'API service not loaded');
                return;
            }

            console.log('Google Auth Handler: Validating token with backend...');

            // Validate the token with the backend to get user info
            validateTokenAndSetAuth(token);

        } catch (error) {
            console.error('Google Auth Handler: Error processing token:', error);
            handleAuthError('token_processing_error', (error as Error).message);
        }
    }

    async function validateTokenAndSetAuth(token: string) {
        try {
            // Debug: Check what's available on window
            console.log('Google Auth Handler: Checking window object...');
            console.log('Google Auth Handler: window.api available:', !!(window as any).api);
            console.log('Google Auth Handler: window.authService available:', !!(window as any).authService);
            console.log('Google Auth Handler: Available window properties:', Object.keys(window).filter(key => key.includes('api') || key.includes('auth')));
            
            // Use the configured API to get user profile
            const api = (window as any).api;
            
            if (!api) {
                throw new Error('API service not available on window object');
            }
            
            if (!api.user || !api.user.getProfile) {
                throw new Error('API user service or getProfile method not available');
            }
            
            // Debug: Check current token state
            console.log('Google Auth Handler: Current localStorage auth_token:', localStorage.getItem('auth_token'));
            console.log('Google Auth Handler: Token to be set:', token);
            
            // Store the original token and authService state
            const originalToken = localStorage.getItem('auth_token');
            const authService = (window as any).authService;
            const originalGetToken = authService ? authService.getToken : null;
            
            // Temporarily override authService.getToken to return our new token
            if (authService) {
                authService.getToken = () => token;
                console.log('Google Auth Handler: Temporarily overrode authService.getToken');
            }
            
            // Set the token in localStorage as backup
            localStorage.setItem('auth_token', token);
            
            console.log('Google Auth Handler: Token set in localStorage, making API call...');
            
            try {
                const userData = await api.user.getProfile();
                
                console.log('Google Auth Handler: API call completed, response:', userData);
                
                if (!userData.success || !userData.data) {
                    throw new Error('Invalid user data received from server: ' + JSON.stringify(userData));
                }

                console.log('Google Auth Handler: Token validated, setting auth state...');

                // Set the authentication state using the auth service
                const authData = {
                    id: userData.data.id,
                    username: userData.data.username,
                    token: token
                };

                // Use the auth service to set the authentication state
                // This will handle storing the token and user info properly
                (window as any).authService.setGoogleAuthState(authData, true); // Remember me = true for Google auth

                console.log('Google Auth Handler: Authentication successful, redirecting...');
                
                // Debug: Check auth state after setting it
                console.log('Google Auth Handler: Auth state after setGoogleAuthState:');
                console.log('  - isAuthenticated:', (window as any).authService.isAuthenticated());
                console.log('  - getToken:', (window as any).authService.getToken());
                console.log('  - getUserId:', (window as any).authService.getUserId());
                console.log('  - getUsername:', (window as any).authService.getUsername());
                console.log('  - localStorage auth_token:', localStorage.getItem('auth_token'));
                console.log('  - localStorage user_id:', localStorage.getItem('user_id'));
                console.log('  - localStorage username:', localStorage.getItem('username'));

                // Redirect to the main application
                redirectToApp();
                
            } finally {
                // Restore original authService.getToken method
                if (authService && originalGetToken) {
                    authService.getToken = originalGetToken;
                    console.log('Google Auth Handler: Restored original authService.getToken');
                }
                
                // DON'T restore the original token - setGoogleAuthState has already set the correct token
                // The auth service has properly stored the new token, so we don't want to overwrite it
                console.log('Google Auth Handler: Keeping new token set by authService');
            }

        } catch (error) {
            console.error('Google Auth Handler: Token validation error:', error);
            
            // Only restore original token if there was an error
            const originalToken = localStorage.getItem('auth_token');
            if (originalToken) {
                localStorage.setItem('auth_token', originalToken);
                console.log('Google Auth Handler: Restored original token due to error');
            } else {
                localStorage.removeItem('auth_token');
                console.log('Google Auth Handler: Removed temporary token due to error');
            }
            
            handleAuthError('token_validation_failed', (error as Error).message);
        }
    }

    function redirectToApp() {
        // Clear the URL parameters to avoid reprocessing
        const cleanUrl = window.location.origin + window.location.pathname;
        
        // Show success message briefly before redirect
        updatePageContent('Authentification réussie !', 'Redirection vers l\'application...', 'success');

        // Redirect to the main app after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
    }

    function handleAuthError(errorType: string, errorMessage: string) {
        console.error('Google Auth Handler: Handling auth error:', errorType, errorMessage);

        // Update the page to show error
        updatePageContent(
            'Erreur d\'authentification',
            `Une erreur s'est produite lors de l'authentification Google: ${errorMessage || errorType}`,
            'error'
        );

        // Redirect to login page after showing error
        setTimeout(() => {
            window.location.href = '/login.html?error=google_auth_failed&reason=' + encodeURIComponent(errorType);
        }, 3000);
    }

    function updatePageContent(title: string, message: string, type: string = 'info') {
        // Update the page content to show status
        const titleElement = document.querySelector('h1');
        const messageElement = document.querySelector('p');
        const spinnerElement = document.querySelector('.loading-spinner');

        if (titleElement) {
            titleElement.textContent = title;
        }

        if (messageElement) {
            messageElement.textContent = message;
        }

        // Handle spinner and styling based on type
        if (spinnerElement) {
            if (type === 'error') {
                (spinnerElement as HTMLElement).style.display = 'none';
                if (titleElement) {
                    titleElement.className = titleElement.className + ' text-red-400';
                }
            } else if (type === 'success') {
                (spinnerElement as HTMLElement).style.borderTopColor = '#10b981'; // green
                if (titleElement) {
                    titleElement.className = titleElement.className + ' text-green-400';
                }
            }
        }
    }

})(); 