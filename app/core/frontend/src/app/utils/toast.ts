import { Notification } from '../types/index';

/**
 * Utilitaire pour gérer les notifications toast
 */
class ToastUtils {
  private container: HTMLElement | null = null;
  private toasts: Map<string, HTMLElement> = new Map();
  private defaultDuration: number = 5000; // 5 secondes par défaut
  
  /**
   * Initialise le container de toasts
   */
  init(): void {
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      console.warn('Toast container not found, creating one');
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
      document.body.appendChild(this.container);
    }
  }
  
  /**
   * Affiche une notification de succès
   */
  success(message: string, duration?: number): string {
    return this.show({
      id: this.generateId(),
      type: 'success',
      message,
      duration: duration || this.defaultDuration
    });
  }
  
  /**
   * Affiche une notification d'information
   */
  info(message: string, duration?: number): string {
    return this.show({
      id: this.generateId(),
      type: 'info',
      message,
      duration: duration || this.defaultDuration
    });
  }
  
  /**
   * Affiche une notification d'avertissement
   */
  warning(message: string, duration?: number): string {
    return this.show({
      id: this.generateId(),
      type: 'warning',
      message,
      duration: duration || this.defaultDuration
    });
  }
  
  /**
   * Affiche une notification d'erreur
   */
  error(message: string, duration?: number): string {
    return this.show({
      id: this.generateId(),
      type: 'error',
      message,
      duration: duration || this.defaultDuration * 1.5 // Les erreurs restent plus longtemps
    });
  }
  
  /**
   * Affiche une notification personnalisée
   */
  show(notification: Notification): string {
    if (!this.container) {
      this.init();
    }
    
    // Créer l'élément toast
    const toast = this.createToastElement(notification);
    
    // Ajouter le toast au conteneur
    this.container?.appendChild(toast);
    
    // Ajouter le toast à la Map
    this.toasts.set(notification.id, toast);
    
    // Ajouter une classe pour l'animation d'entrée
    setTimeout(() => {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
    }, 10);
    
    // Configurer la fermeture automatique
    if (notification.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
    
    return notification.id;
  }
  
  /**
   * Ferme une notification par son ID
   */
  remove(id: string): void {
    const toast = this.toasts.get(id);
    
    if (toast) {
      // Animation de sortie
      toast.classList.remove('opacity-100');
      toast.classList.add('opacity-0');
      
      // Suppression après l'animation
      setTimeout(() => {
        toast.remove();
        this.toasts.delete(id);
      }, 300);
    }
  }
  
  /**
   * Crée un élément toast à partir d'une notification
   */
  private createToastElement(notification: Notification): HTMLElement {
    // Créer le conteneur du toast
    const toast = document.createElement('div');
    toast.className = `flex items-center p-4 rounded-lg shadow-lg transform transition-opacity duration-300 ease-in-out opacity-0 ${this.getBackgroundColor(notification.type)}`;
    toast.setAttribute('role', 'alert');
    
    // Créer l'icône
    const icon = document.createElement('div');
    icon.className = 'flex-shrink-0 w-5 h-5 mr-3';
    icon.innerHTML = this.getIconSvg(notification.type);
    
    // Créer le message
    const message = document.createElement('div');
    message.className = 'flex-1 text-sm font-medium';
    message.textContent = notification.message;
    
    // Créer le bouton de fermeture
    const closeButton = document.createElement('button');
    closeButton.className = 'ml-3 text-gray-300 hover:text-white transition';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    
    // Ajouter un gestionnaire d'événements pour fermer le toast
    closeButton.addEventListener('click', () => {
      this.remove(notification.id);
    });
    
    // Assembler le toast
    toast.appendChild(icon);
    toast.appendChild(message);
    toast.appendChild(closeButton);
    
    return toast;
  }
  
  /**
   * Obtient la classe de couleur de fond en fonction du type de notification
   */
  private getBackgroundColor(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return 'bg-green-800 text-green-100';
      case 'info':
        return 'bg-blue-800 text-blue-100';
      case 'warning':
        return 'bg-yellow-800 text-yellow-100';
      case 'error':
        return 'bg-red-800 text-red-100';
      default:
        return 'bg-gray-800 text-gray-100';
    }
  }
  
  /**
   * Obtient l'icône SVG en fonction du type de notification
   */
  private getIconSvg(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return '<svg class="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
      case 'info':
        return '<svg class="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
      case 'warning':
        return '<svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
      case 'error':
        return '<svg class="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
      default:
        return '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>';
    }
  }
  
  /**
   * Génère un ID unique pour une notification
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

// Exporter une instance unique de l'utilitaire
export const toastUtils = new ToastUtils(); 