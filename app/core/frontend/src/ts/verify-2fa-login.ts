// This file will be compiled to JS and included in the HTML directly
// Global authService will be available from auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Services globaux
    const authService = (window as any).authService;
    const api = (window as any).api;
    
    // Éléments du DOM
    const verifyForm = document.getElementById('verify-2fa-form') as HTMLFormElement;
    const verificationCodeInput = document.getElementById('verification-code') as HTMLInputElement;
    const verifyButton = document.getElementById('verify-button') as HTMLButtonElement;
    const verifyText = document.getElementById('verify-text') as HTMLSpanElement;
    const loadingSpinner = document.getElementById('loading-spinner') as HTMLElement;
    const errorMessage = document.getElementById('error-message') as HTMLDivElement;
    const errorText = document.getElementById('error-text') as HTMLSpanElement;
    
    if (!verifyForm || !authService || !api) {
        console.error('Services ou éléments requis non disponibles');
        window.location.href = '/login.html';
        return;
    }
    
    // Récupération des données utilisateur en attente
    const pendingUserData = sessionStorage.getItem('pending_2fa_user');
    if (!pendingUserData) {
        console.error('Aucune donnée utilisateur en attente trouvée');
        window.location.href = '/login.html';
        return;
    }
    
    let userData: any;
    try {
        userData = JSON.parse(pendingUserData);
    } catch (error) {
        console.error('Données utilisateur invalides');
        window.location.href = '/login.html';
        return;
    }
    
    // Gestion de la saisie du code
    verificationCodeInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = target.value.replace(/[^0-9]/g, '');
        
        // Activation du bouton si 6 chiffres
        const isValid = target.value.length === 6;
        verifyButton.disabled = !isValid;
        verifyButton.classList.toggle('opacity-50', !isValid);
        verifyButton.classList.toggle('cursor-not-allowed', !isValid);
        
        // Masquer l'erreur lors de la saisie
        if (target.value.length > 0) {
            hideError();
        }
    });
    
    // Soumission du formulaire
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const code = verificationCodeInput.value.trim();
        if (code.length !== 6) {
            showError('Le code doit contenir exactement 6 chiffres');
            return;
        }
        
        setLoadingState(true);
        
        try {
            const response = await api.auth.verify2FA(userData.id, code);
            
            if (response.success && response.data) {
                // Nettoyage et redirection
                sessionStorage.removeItem('pending_2fa_user');
                const rememberMe = userData.rememberMe || false;
                authService.setAuthState(response.data, rememberMe);
                
                const redirectUrl = userData.redirectUrl || '/index.html';
                window.location.href = redirectUrl;
            } else {
                showError(response.message || 'Code de vérification invalide');
                resetInput();
            }
        } catch (error) {
            console.error('Erreur de vérification 2FA:', error);
            showError('Erreur de connexion. Veuillez réessayer.');
            resetInput();
        } finally {
            setLoadingState(false);
        }
    });
    
    // Focus automatique
    verificationCodeInput.focus();
    
    // Fonctions utilitaires
    function showError(message: string) {
        if (errorMessage && errorText) {
            errorText.textContent = message;
            errorMessage.classList.remove('hidden');
        }
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }
    
    function resetInput() {
        verificationCodeInput.value = '';
        verificationCodeInput.focus();
    }
    
    function setLoadingState(loading: boolean) {
        verifyButton.disabled = loading;
        verifyText.textContent = loading ? 'Vérification...' : 'Vérifier';
        loadingSpinner.classList.toggle('hidden', !loading);
        
        if (loading) {
            verifyButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else if (verificationCodeInput.value.length === 6) {
            verifyButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}); 