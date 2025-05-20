import { authApi } from '../services/api';
import { authUtils } from '../utils/auth';
import { router } from '../utils/router';
import { toastUtils } from '../utils/toast';
export function renderLogin() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer)
        return;
    // Create login container
    const loginContainer = document.createElement('div');
    loginContainer.className = 'flex items-center justify-center min-h-screen';
    // Create login card
    const loginCard = document.createElement('div');
    loginCard.className = 'card w-full max-w-md p-8';
    // Create login header
    const loginHeader = document.createElement('div');
    loginHeader.className = 'text-center mb-8';
    const logo = document.createElement('h1');
    logo.className = 'text-3xl font-bold mb-4';
    logo.textContent = 'Transcendence';
    const loginTitle = document.createElement('h2');
    loginTitle.className = 'text-2xl font-semibold';
    loginTitle.textContent = 'Sign In';
    loginHeader.appendChild(logo);
    loginHeader.appendChild(loginTitle);
    // Create tab container for Login/Register
    const tabContainer = document.createElement('div');
    tabContainer.className = 'flex border-b border-gray-700 mb-6';
    const loginTab = document.createElement('button');
    loginTab.className = 'py-2 px-4 font-medium text-blue-500 border-b-2 border-blue-500';
    loginTab.textContent = 'Login';
    const registerTab = document.createElement('button');
    registerTab.className = 'py-2 px-4 font-medium text-gray-400 hover:text-white';
    registerTab.textContent = 'Register';
    tabContainer.appendChild(loginTab);
    tabContainer.appendChild(registerTab);
    // Create form container
    const formContainer = document.createElement('div');
    formContainer.id = 'auth-form-container';
    // Initially render login form
    renderLoginForm(formContainer);
    // Add tab click handlers
    loginTab.addEventListener('click', () => {
        loginTab.className = 'py-2 px-4 font-medium text-blue-500 border-b-2 border-blue-500';
        registerTab.className = 'py-2 px-4 font-medium text-gray-400 hover:text-white';
        renderLoginForm(formContainer);
    });
    registerTab.addEventListener('click', () => {
        registerTab.className = 'py-2 px-4 font-medium text-blue-500 border-b-2 border-blue-500';
        loginTab.className = 'py-2 px-4 font-medium text-gray-400 hover:text-white';
        renderRegisterForm(formContainer);
    });
    // Assemble the login card
    loginCard.appendChild(loginHeader);
    loginCard.appendChild(tabContainer);
    loginCard.appendChild(formContainer);
    // Add OAuth buttons
    const oauthContainer = document.createElement('div');
    oauthContainer.className = 'mt-6 border-t border-gray-700 pt-6';
    const oauthTitle = document.createElement('p');
    oauthTitle.className = 'text-sm text-gray-400 text-center mb-4';
    oauthTitle.textContent = 'Or sign in with';
    const oauthButtons = document.createElement('div');
    oauthButtons.className = 'flex justify-center space-x-4';
    const googleButton = document.createElement('button');
    googleButton.className = 'flex items-center justify-center p-2 rounded-md bg-white text-gray-900 hover:bg-gray-200';
    googleButton.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/></svg>';
    oauthButtons.appendChild(googleButton);
    oauthContainer.appendChild(oauthTitle);
    oauthContainer.appendChild(oauthButtons);
    loginCard.appendChild(oauthContainer);
    // Add OAuth button handlers
    const handleOAuthClick = (provider) => {
        // Normally would redirect to OAuth provider
        toastUtils.info(`${provider} OAuth login is not implemented in this version.`);
    };
    googleButton.addEventListener('click', () => handleOAuthClick('Google'));
    // Finalize the page
    loginContainer.appendChild(loginCard);
    appContainer.appendChild(loginContainer);
}
function renderLoginForm(container) {
    // Clear container
    container.innerHTML = '';
    // Create login form
    const loginForm = document.createElement('form');
    loginForm.className = 'space-y-6';
    // Username field
    const usernameGroup = document.createElement('div');
    const usernameLabel = document.createElement('label');
    usernameLabel.className = 'form-label';
    usernameLabel.htmlFor = 'username';
    usernameLabel.textContent = 'Username';
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'username';
    usernameInput.className = 'form-input';
    usernameInput.placeholder = 'Enter your username';
    usernameInput.required = true;
    usernameGroup.appendChild(usernameLabel);
    usernameGroup.appendChild(usernameInput);
    // Password field
    const passwordGroup = document.createElement('div');
    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'form-label';
    passwordLabel.htmlFor = 'password';
    passwordLabel.textContent = 'Password';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.className = 'form-input';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.required = true;
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    // Remember me checkbox
    const rememberGroup = document.createElement('div');
    rememberGroup.className = 'flex items-center justify-between';
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'flex items-center';
    const rememberCheckbox = document.createElement('input');
    rememberCheckbox.type = 'checkbox';
    rememberCheckbox.id = 'remember';
    rememberCheckbox.className = 'rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500';
    const rememberLabel = document.createElement('label');
    rememberLabel.className = 'ml-2 text-sm text-gray-300';
    rememberLabel.htmlFor = 'remember';
    rememberLabel.textContent = 'Remember me';
    checkboxContainer.appendChild(rememberCheckbox);
    checkboxContainer.appendChild(rememberLabel);
    const forgotLink = document.createElement('a');
    forgotLink.href = '#';
    forgotLink.className = 'text-sm text-blue-500 hover:underline';
    forgotLink.textContent = 'Forgot password?';
    rememberGroup.appendChild(checkboxContainer);
    rememberGroup.appendChild(forgotLink);
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary w-full';
    submitButton.textContent = 'Sign In';
    // Add form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            toastUtils.error('Please enter both username and password');
            return;
        }
        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Signing in...';
        try {
            // Call the login API
            const response = await authApi.login({ username, password });
            if (response.success && response.data) {
                const { token, user } = response.data;
                // Store auth data
                authUtils.setAuth(token, user);
                // Navigate to home
                router.navigateTo('/');
                toastUtils.success(`Welcome back, ${user.username}!`);
            }
            else {
                toastUtils.error(response.error || 'Login failed');
            }
        }
        catch (error) {
            toastUtils.error('An error occurred during login');
            console.error('Login error:', error);
        }
        finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    });
    // Assemble the form
    loginForm.appendChild(usernameGroup);
    loginForm.appendChild(passwordGroup);
    loginForm.appendChild(rememberGroup);
    loginForm.appendChild(submitButton);
    // Add to container
    container.appendChild(loginForm);
}
function renderRegisterForm(container) {
    // Clear container
    container.innerHTML = '';
    // Create register form
    const registerForm = document.createElement('form');
    registerForm.className = 'space-y-6';
    // Username field
    const usernameGroup = document.createElement('div');
    const usernameLabel = document.createElement('label');
    usernameLabel.className = 'form-label';
    usernameLabel.htmlFor = 'username';
    usernameLabel.textContent = 'Username';
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'username';
    usernameInput.className = 'form-input';
    usernameInput.placeholder = 'Choose a username';
    usernameInput.required = true;
    usernameGroup.appendChild(usernameLabel);
    usernameGroup.appendChild(usernameInput);
    // Email field
    const emailGroup = document.createElement('div');
    const emailLabel = document.createElement('label');
    emailLabel.className = 'form-label';
    emailLabel.htmlFor = 'email';
    emailLabel.textContent = 'Email';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'email';
    emailInput.className = 'form-input';
    emailInput.placeholder = 'Enter your email';
    emailInput.required = true;
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    // Password field
    const passwordGroup = document.createElement('div');
    const passwordLabel = document.createElement('label');
    passwordLabel.className = 'form-label';
    passwordLabel.htmlFor = 'password';
    passwordLabel.textContent = 'Password';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'password';
    passwordInput.className = 'form-input';
    passwordInput.placeholder = 'Create a password';
    passwordInput.required = true;
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    // Password confirmation field
    const confirmGroup = document.createElement('div');
    const confirmLabel = document.createElement('label');
    confirmLabel.className = 'form-label';
    confirmLabel.htmlFor = 'confirm-password';
    confirmLabel.textContent = 'Confirm Password';
    const confirmInput = document.createElement('input');
    confirmInput.type = 'password';
    confirmInput.id = 'confirm-password';
    confirmInput.className = 'form-input';
    confirmInput.placeholder = 'Confirm your password';
    confirmInput.required = true;
    confirmGroup.appendChild(confirmLabel);
    confirmGroup.appendChild(confirmInput);
    // Terms checkbox
    const termsGroup = document.createElement('div');
    termsGroup.className = 'flex items-start';
    const termsCheckbox = document.createElement('input');
    termsCheckbox.type = 'checkbox';
    termsCheckbox.id = 'terms';
    termsCheckbox.className = 'mt-1 rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-blue-500';
    termsCheckbox.required = true;
    const termsLabel = document.createElement('label');
    termsLabel.className = 'ml-2 text-sm text-gray-300';
    termsLabel.htmlFor = 'terms';
    termsLabel.innerHTML = 'I agree to the <a href="#" class="text-blue-500 hover:underline">Terms of Service</a> and <a href="#" class="text-blue-500 hover:underline">Privacy Policy</a>';
    termsGroup.appendChild(termsCheckbox);
    termsGroup.appendChild(termsLabel);
    // Submit button
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary w-full';
    submitButton.textContent = 'Create Account';
    // Add form handler
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmInput.value.trim();
        if (!username || !email || !password || !confirmPassword) {
            toastUtils.error('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            toastUtils.error('Passwords do not match');
            return;
        }
        // Show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';
        try {
            // Call the register API
            const response = await authApi.register({ username, email, password });
            if (response.success && response.data) {
                const { token, user } = response.data;
                // Store auth data
                authUtils.setAuth(token, user);
                // Navigate to home
                router.navigateTo('/');
                toastUtils.success('Account created successfully!');
            }
            else {
                toastUtils.error(response.error || 'Registration failed');
            }
        }
        catch (error) {
            toastUtils.error('An error occurred during registration');
            console.error('Registration error:', error);
        }
        finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = 'Create Account';
        }
    });
    // Assemble the form
    registerForm.appendChild(usernameGroup);
    registerForm.appendChild(emailGroup);
    registerForm.appendChild(passwordGroup);
    registerForm.appendChild(confirmGroup);
    registerForm.appendChild(termsGroup);
    registerForm.appendChild(submitButton);
    // Add to container
    container.appendChild(registerForm);
}
//# sourceMappingURL=login.js.map