/**
 * Service de notification pour gérer les notifications dans l'interface utilisateur
 */

interface NotificationOptions {
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    showClose?: boolean;
    onClose?: () => void;
}

class NotificationService {
    private container: HTMLElement | null = null;
    private defaultOptions: Partial<NotificationOptions> = {
        type: 'info',
        duration: 5000,
        showClose: true
    };
    private soundEnabled: boolean = true;
    private notificationCounter: number = 0;
    private notificationMap: Map<string, HTMLElement> = new Map();

    constructor() {
        this.initialize();
    }

    /**
     * Initialise le service de notification
     */
    private initialize(): void {
        // Créer le conteneur de notifications s'il n'existe pas
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.position = 'fixed';
            this.container.style.top = '20px';
            this.container.style.right = '20px';
            this.container.style.zIndex = '9999';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }

        // Chargement des préférences de son depuis le localStorage
        this.loadSoundPreference();
    }

    /**
     * Charge la préférence de son
     */
    private loadSoundPreference(): void {
        const savedPreference = localStorage.getItem('notification_sound_enabled');
        if (savedPreference !== null) {
            this.soundEnabled = savedPreference === 'true';
        }
    }

    /**
     * Active ou désactive le son des notifications
     */
    public toggleSound(enabled: boolean): void {
        this.soundEnabled = enabled;
        localStorage.setItem('notification_sound_enabled', enabled.toString());
    }

    /**
     * Joue un son de notification
     */
    private playSound(type: string = 'default'): void {
        if (!this.soundEnabled) return;

        try {
            let soundPath = '/sounds/notification.mp3';
            
            // Différents sons selon le type de notification
            if (type === 'error') {
                soundPath = '/sounds/error.mp3';
            } else if (type === 'success') {
                soundPath = '/sounds/success.mp3';
            }

            const audio = new Audio(soundPath);
            audio.volume = 0.5;
            audio.play().catch(e => console.warn('Could not play notification sound:', e));
        } catch (e) {
            console.warn('Could not play notification sound:', e);
        }
    }

    /**
     * Affiche une notification
     */
    public show(options: NotificationOptions): string {
        const mergedOptions = { ...this.defaultOptions, ...options };
        const { title, message, type, duration, showClose } = mergedOptions;

        // Création de l'ID unique pour cette notification
        const notificationId = 'notification-' + (++this.notificationCounter);
        
        // Création de l'élément de notification
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `notification ${type}`;
        
        // Icône selon le type
        let icon = '';
        if (type === 'success') {
            icon = '<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>';
        } else if (type === 'error') {
            icon = '<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';
        } else {
            icon = '<svg class="notification-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>';
        }
        
        // Construction du contenu HTML
        notification.innerHTML = `
            ${icon}
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            ${showClose ? '<button class="notification-close">&times;</button>' : ''}
        `;
        
        // Ajouter au conteneur
        this.container?.appendChild(notification);
        this.notificationMap.set(notificationId, notification);
        
        // Animation d'entrée avec délai pour permettre la transition
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Jouer le son
        this.playSound(type);
        
        // Ajouter gestionnaire de fermeture si nécessaire
        if (showClose) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn?.addEventListener('click', () => {
                this.close(notificationId);
                if (mergedOptions.onClose) {
                    mergedOptions.onClose();
                }
            });
        }
        
        // Auto-fermeture si la durée est spécifiée
        if (duration && duration > 0) {
            setTimeout(() => {
                this.close(notificationId);
                if (mergedOptions.onClose) {
                    mergedOptions.onClose();
                }
            }, duration);
        }
        
        return notificationId;
    }

    /**
     * Ferme une notification spécifique
     */
    public close(notificationId: string): void {
        const notification = this.notificationMap.get(notificationId);
        
        if (notification) {
            notification.classList.remove('show');
            
            // Supprimer après la fin de l'animation
            setTimeout(() => {
                notification.remove();
                this.notificationMap.delete(notificationId);
            }, 300);
        }
    }

    /**
     * Ferme toutes les notifications
     */
    public closeAll(): void {
        this.notificationMap.forEach((notification, id) => {
            this.close(id);
        });
    }

    /**
     * Raccourci pour afficher une notification de succès
     */
    public success(message: string, title?: string, duration?: number): string {
        return this.show({
            title,
            message,
            type: 'success',
            duration
        });
    }

    /**
     * Raccourci pour afficher une notification d'erreur
     */
    public error(message: string, title?: string, duration?: number): string {
        return this.show({
            title,
            message,
            type: 'error',
            duration
        });
    }

    /**
     * Raccourci pour afficher une notification d'information
     */
    public info(message: string, title?: string, duration?: number): string {
        return this.show({
            title,
            message,
            type: 'info',
            duration
        });
    }

    /**
     * Met à jour un badge de notification
     */
    public updateBadge(selector: string, count: number): void {
        const element = document.querySelector(selector);
        if (!element) return;
        
        // Si count > 0, afficher le badge, sinon le masquer
        if (count > 0) {
            let badge = element.querySelector('.friend-badge');
            
            // Créer le badge s'il n'existe pas
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'friend-badge';
                element.classList.add('notification-dot');
                element.appendChild(badge);
            }
            
            // Mettre à jour le compte
            badge.textContent = count > 99 ? '99+' : count.toString();
        } else {
            // Supprimer le badge s'il existe
            const badge = element.querySelector('.friend-badge');
            if (badge) {
                badge.remove();
                element.classList.remove('notification-dot');
            }
        }
    }
}

// Créer une instance unique 
const notificationService = new NotificationService();

// Exposer globalement
(window as any).notificationService = notificationService;

export default notificationService; 