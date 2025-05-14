import { authService } from '../services/auth';
import { toastUtils } from '../utils/toast';

/**
 * Interface pour définir une route
 */
interface RouteDefinition {
  path: string;
  callback: () => void;
  requiresAuth: boolean;
}

/**
 * Classe Router pour gérer la navigation
 */
class Router {
  private routes: RouteDefinition[] = [];
  private notFoundCallback: (() => void) | null = null;
  
  /**
   * Ajoute une route publique (pas besoin d'authentification)
   */
  public addPublicRoute(path: string, callback: () => void): void {
    this.routes.push({ path, callback, requiresAuth: false });
  }
  
  /**
   * Ajoute une route protégée (nécessite une authentification)
   */
  public addProtectedRoute(path: string, callback: () => void): void {
    this.routes.push({ path, callback, requiresAuth: true });
  }
  
  /**
   * Définit le gestionnaire pour les routes non trouvées
   */
  public setNotFoundHandler(callback: () => void): void {
    this.notFoundCallback = callback;
  }
  
  /**
   * Navigue vers une route spécifique
   */
  public navigateTo(path: string): void {
    window.history.pushState({ path }, '', path);
    this.processRoute(path);
  }
  
  /**
   * Traite la route actuelle
   */
  public processRoute(path: string = window.location.pathname): void {
    // Nettoyer le conteneur principal
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.innerHTML = '';
    }
    
    // Rechercher une route correspondante
    let route = this.findRoute(path);
    
    // Si aucune route n'est trouvée, utiliser le gestionnaire 404
    if (!route) {
      if (this.notFoundCallback) {
        this.notFoundCallback();
      }
      return;
    }
    
    // Vérifier l'authentification pour les routes protégées
    if (route.requiresAuth && !authService.isAuthenticated()) {
      toastUtils.error('Vous devez être connecté pour accéder à cette page');
      this.navigateTo('/login');
      return;
    }
    
    // Exécuter le callback de la route
    route.callback();
  }
  
  /**
   * Trouve une route correspondant au chemin
   */
  private findRoute(path: string): RouteDefinition | null {
    // D'abord, essayer de trouver une correspondance exacte
    let route = this.routes.find(r => r.path === path);
    if (route) return route;
    
    // Ensuite, essayer de trouver une route avec des paramètres dynamiques (/:id)
    for (const r of this.routes) {
      // Convertir la définition de route en expression régulière
      const pattern = r.path.replace(/:\w+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      
      if (regex.test(path)) {
        return r;
      }
    }
    
    return null;
  }
  
  /**
   * Initialise le router
   */
  public init(): void {
    // Gérer les clics sur les liens internes
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin) && !link.getAttribute('target')) {
        e.preventDefault();
        const path = link.href.replace(window.location.origin, '');
        this.navigateTo(path);
      }
    });
    
    // Gérer les événements popstate (bouton retour du navigateur)
    window.addEventListener('popstate', () => {
      this.processRoute();
    });
    
    // Traiter la route initiale
    this.processRoute();
  }
}

// Exporter une instance unique du routeur
export const router = new Router(); 