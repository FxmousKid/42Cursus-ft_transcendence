// Toast utils singleton
export class ToastUtils {
    constructor() {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
    }
    static getInstance() {
        if (!ToastUtils.instance) {
            ToastUtils.instance = new ToastUtils();
        }
        return ToastUtils.instance;
    }
    // Initialize toast container
    getContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                // Create container if it doesn't exist
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
                document.body.appendChild(this.container);
            }
        }
        return this.container;
    }
    // Create toast element
    createToastElement(options) {
        const toast = document.createElement('div');
        // Base classes
        toast.className = 'rounded-md px-4 py-3 shadow-lg transform transition-all duration-300 max-w-sm flex items-center';
        // Add color based on type
        switch (options.type) {
            case 'success':
                toast.classList.add('bg-green-600', 'text-white');
                break;
            case 'error':
                toast.classList.add('bg-red-600', 'text-white');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500', 'text-white');
                break;
            case 'info':
            default:
                toast.classList.add('bg-blue-600', 'text-white');
                break;
        }
        // Add icon based on type
        const iconDiv = document.createElement('div');
        iconDiv.className = 'mr-3 flex-shrink-0';
        let iconSvg = '';
        switch (options.type) {
            case 'success':
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                break;
            case 'error':
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
                break;
            case 'warning':
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
                break;
            case 'info':
            default:
                iconSvg = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                break;
        }
        iconDiv.innerHTML = iconSvg;
        toast.appendChild(iconDiv);
        // Add message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'text-sm font-medium';
        messageDiv.textContent = options.message;
        toast.appendChild(messageDiv);
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.className = 'ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-opacity-20 hover:bg-black focus:outline-none';
        closeButton.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        closeButton.addEventListener('click', () => this.removeToast(toast));
        toast.appendChild(closeButton);
        return toast;
    }
    // Remove a toast
    removeToast(toast) {
        toast.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    // Show a toast notification
    show(options) {
        const container = this.getContainer();
        const toast = this.createToastElement(options);
        // Start with opacity 0 and translated
        toast.classList.add('opacity-0', 'translate-x-full');
        container.appendChild(toast);
        // Force reflow
        void toast.offsetWidth;
        // Animate in
        toast.classList.remove('opacity-0', 'translate-x-full');
        // Auto remove after duration
        const duration = options.duration || 5000;
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);
    }
    // Shorthand methods
    success(message, duration) {
        this.show({ type: 'success', message, duration });
    }
    error(message, duration) {
        this.show({ type: 'error', message, duration });
    }
    info(message, duration) {
        this.show({ type: 'info', message, duration });
    }
    warning(message, duration) {
        this.show({ type: 'warning', message, duration });
    }
}
// Export singleton instance
export const toastUtils = ToastUtils.getInstance();
//# sourceMappingURL=toast.js.map