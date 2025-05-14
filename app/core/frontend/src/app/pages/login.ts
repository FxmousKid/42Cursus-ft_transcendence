import { router } from '../utils/router';
import { authService } from '../services/auth';
import { toastUtils } from '../utils/toast';

/**
 * Rendu de la page de connexion
 */
export function renderLogin(): void {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;
  
  // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
  if (authService.isAuthenticated()) {
    router.navigateTo('/');
    return;
  }
  
  // Créer le conteneur principal
  const loginContainer = document.createElement('div');
  loginContainer.className = 'flex flex-col items-center py-16 px-4';
  
  // Créer le titre
  const title = document.createElement('h1');
  title.className = 'text-3xl font-bold mb-8 text-center';
  title.textContent = 'Connexion';
  
  // Créer le conteneur du formulaire
  const formContainer = document.createElement('div');
  formContainer.className = 'bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md';
  
  // Créer le formulaire de connexion
  const loginForm = document.createElement('form');
  loginForm.className = 'space-y-6';
  
  // Champ username
  const usernameField = createFormField(
    'username',
    'Nom d\'utilisateur',
    'text',
    'Entrez votre nom d\'utilisateur',
    true
  );
  
  // Champ password
  const passwordField = createFormField(
    'password',
    'Mot de passe',
    'password',
    'Entrez votre mot de passe',
    true
  );
  
  // Bouton de connexion
  const submitButton = document.createElement('button');
  submitButton.className = 'w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition';
  submitButton.textContent = 'Se connecter';
  submitButton.type = 'submit';
  
  // Conteneur des liens
  const linksContainer = document.createElement('div');
  linksContainer.className = 'mt-4 flex justify-between items-center';
  
  // Lien de création de compte
  const registerLink = document.createElement('button');
  registerLink.className = 'text-blue-400 hover:text-blue-500 transition text-sm';
  registerLink.textContent = 'Créer un compte';
  registerLink.addEventListener('click', () => {
    showRegisterForm(loginForm, title);
  });
  
  // Lien de récupération de mot de passe
  const forgotPasswordLink = document.createElement('button');
  forgotPasswordLink.className = 'text-gray-400 hover:text-gray-300 transition text-sm';
  forgotPasswordLink.textContent = 'Mot de passe oublié ?';
  forgotPasswordLink.addEventListener('click', () => {
    // Fonctionnalité à implémenter
    toastUtils.info('Fonctionnalité en cours de développement');
  });
  
  // Assembler les liens
  linksContainer.appendChild(registerLink);
  linksContainer.appendChild(forgotPasswordLink);
  
  // Assembler le formulaire
  loginForm.appendChild(usernameField);
  loginForm.appendChild(passwordField);
  loginForm.appendChild(submitButton);
  loginForm.appendChild(linksContainer);
  
  // Ajouter un gestionnaire d'événements pour la soumission du formulaire
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les valeurs des champs
    const usernameInput = loginForm.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = loginForm.querySelector('input[name="password"]') as HTMLInputElement;
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Valider les champs
    if (!username || !password) {
      toastUtils.error('Tous les champs sont obligatoires');
      return;
    }
    
    // Désactiver le bouton pendant la connexion
    submitButton.disabled = true;
    submitButton.textContent = 'Connexion en cours...';
    
    // Tenter la connexion
    try {
      const success = await authService.login(username, password);
      
      if (success) {
        // Rediriger vers la page d'accueil en cas de succès
        router.navigateTo('/');
      } else {
        // Réactiver le bouton en cas d'échec
        submitButton.disabled = false;
        submitButton.textContent = 'Se connecter';
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toastUtils.error('Une erreur est survenue lors de la connexion');
      
      // Réactiver le bouton
      submitButton.disabled = false;
      submitButton.textContent = 'Se connecter';
    }
  });
  
  // Assembler la page
  formContainer.appendChild(loginForm);
  loginContainer.appendChild(title);
  loginContainer.appendChild(formContainer);
  
  // Ajouter au conteneur principal
  appContainer.appendChild(loginContainer);
}

/**
 * Affiche le formulaire d'inscription à la place du formulaire de connexion
 */
function showRegisterForm(loginForm: HTMLFormElement, title: HTMLHeadingElement): void {
  // Mettre à jour le titre
  title.textContent = 'Inscription';
  
  // Vider le formulaire
  loginForm.innerHTML = '';
  
  // Champ username
  const usernameField = createFormField(
    'username',
    'Nom d\'utilisateur',
    'text',
    'Choisissez un nom d\'utilisateur',
    true
  );
  
  // Champ email
  const emailField = createFormField(
    'email',
    'Adresse e-mail',
    'email',
    'Entrez votre adresse e-mail',
    true
  );
  
  // Champ password
  const passwordField = createFormField(
    'password',
    'Mot de passe',
    'password',
    'Choisissez un mot de passe',
    true
  );
  
  // Champ confirmation password
  const confirmPasswordField = createFormField(
    'confirmPassword',
    'Confirmer le mot de passe',
    'password',
    'Confirmez votre mot de passe',
    true
  );
  
  // Bouton d'inscription
  const registerButton = document.createElement('button');
  registerButton.className = 'w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition';
  registerButton.textContent = 'S\'inscrire';
  registerButton.type = 'submit';
  
  // Lien pour revenir à la connexion
  const backToLoginLink = document.createElement('button');
  backToLoginLink.className = 'mt-4 text-blue-400 hover:text-blue-500 transition text-sm w-full text-center';
  backToLoginLink.textContent = 'Déjà un compte ? Se connecter';
  backToLoginLink.addEventListener('click', () => {
    // Remettre la page de connexion
    renderLogin();
  });
  
  // Assembler le formulaire
  loginForm.appendChild(usernameField);
  loginForm.appendChild(emailField);
  loginForm.appendChild(passwordField);
  loginForm.appendChild(confirmPasswordField);
  loginForm.appendChild(registerButton);
  loginForm.appendChild(backToLoginLink);
  
  // Ajouter un gestionnaire d'événements pour la soumission du formulaire
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Récupérer les valeurs des champs
    const usernameInput = loginForm.querySelector('input[name="username"]') as HTMLInputElement;
    const emailInput = loginForm.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = loginForm.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPasswordInput = loginForm.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
    
    if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) return;
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Valider les champs
    if (!username || !email || !password || !confirmPassword) {
      toastUtils.error('Tous les champs sont obligatoires');
      return;
    }
    
    // Valider le format de l'e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toastUtils.error('Adresse e-mail invalide');
      return;
    }
    
    // Valider la correspondance des mots de passe
    if (password !== confirmPassword) {
      toastUtils.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    // Désactiver le bouton pendant l'inscription
    registerButton.disabled = true;
    registerButton.textContent = 'Inscription en cours...';
    
    // Tenter l'inscription
    try {
      const success = await authService.register(username, email, password);
      
      if (success) {
        // Rediriger vers la page d'accueil en cas de succès
        router.navigateTo('/');
      } else {
        // Réactiver le bouton en cas d'échec
        registerButton.disabled = false;
        registerButton.textContent = 'S\'inscrire';
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      toastUtils.error('Une erreur est survenue lors de l\'inscription');
      
      // Réactiver le bouton
      registerButton.disabled = false;
      registerButton.textContent = 'S\'inscrire';
    }
  });
}

/**
 * Crée un champ de formulaire
 */
function createFormField(
  name: string,
  labelText: string,
  type: string,
  placeholder: string,
  required: boolean = false
): HTMLDivElement {
  const fieldContainer = document.createElement('div');
  
  // Créer le label
  const label = document.createElement('label');
  label.className = 'block text-gray-300 mb-2 font-medium';
  label.htmlFor = name;
  label.textContent = labelText;
  
  // Créer l'input
  const input = document.createElement('input');
  input.className = 'w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  input.type = type;
  input.name = name;
  input.id = name;
  input.placeholder = placeholder;
  input.required = required;
  
  // Assembler le champ
  fieldContainer.appendChild(label);
  fieldContainer.appendChild(input);
  
  return fieldContainer;
} 