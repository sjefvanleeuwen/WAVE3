/**
 * Explorer Toolbar Component
 * Provides navigation controls and breadcrumb path display
 */

class ExplorerToolbar {
    /**
     * Create a new toolbar component
     * @param {object} options - Configuration options
     * @param {Function} options.onNavigate - Callback for navigation events
     */
    constructor(options = {}) {
        this.element = null;
        this.pathBreadcrumb = null;
        this.backBtn = null;
        this.forwardBtn = null;
        this.upBtn = null;
        this.refreshBtn = null;
        this.onNavigate = options.onNavigate || (() => {});
    }
    
    /**
     * Create the toolbar element
     * @returns {HTMLElement} The toolbar element
     */
    create() {
        const toolbar = document.createElement('div');
        toolbar.className = 'explorer-toolbar';
        toolbar.innerHTML = `
            <button id="back-btn" title="Go back">← Back</button>
            <button id="forward-btn" title="Go forward">→ Forward</button>
            <button id="up-btn" title="Go up one level">↑ Up</button>
            <button id="refresh-btn" title="Refresh">⟳ Refresh</button>
            <div class="path-bar">
                <div class="breadcrumb" id="path-breadcrumb"></div>
            </div>
        `;
        
        // Store references to elements
        this.element = toolbar;
        this.backBtn = toolbar.querySelector('#back-btn');
        this.forwardBtn = toolbar.querySelector('#forward-btn');
        this.upBtn = toolbar.querySelector('#up-btn');
        this.refreshBtn = toolbar.querySelector('#refresh-btn');
        this.pathBreadcrumb = toolbar.querySelector('#path-breadcrumb');
        
        // Set up event listeners
        this.backBtn.addEventListener('click', () => this.onNavigate('back'));
        this.forwardBtn.addEventListener('click', () => this.onNavigate('forward'));
        this.upBtn.addEventListener('click', () => this.onNavigate('up'));
        this.refreshBtn.addEventListener('click', () => this.onNavigate('refresh'));
        
        return toolbar;
    }
    
    /**
     * Update the navigation button states
     * @param {object} state - Navigation state
     * @param {boolean} state.canGoBack - Whether the back button should be enabled
     * @param {boolean} state.canGoForward - Whether the forward button should be enabled
     * @param {boolean} state.canGoUp - Whether the up button should be enabled
     */
    updateButtonStates({ canGoBack = false, canGoForward = false, canGoUp = false }) {
        this.backBtn.disabled = !canGoBack;
        this.forwardBtn.disabled = !canGoForward;
        this.upBtn.disabled = !canGoUp;
    }
    
    /**
     * Update the breadcrumb navigation with the current path
     * @param {string} path - The current path
     */
    updateBreadcrumb(path) {
        // Split the path into segments
        const segments = path.split('/').filter(segment => segment);
        
        // Create breadcrumb HTML
        let html = `<span class="breadcrumb-item" data-path="/">Root</span>`;
        
        // Build path progressively for each segment
        let currentPath = '/';
        segments.forEach((segment, index) => {
            html += `<span class="breadcrumb-separator">/</span>`;
            currentPath += segment + '/';
            html += `<span class="breadcrumb-item" data-path="${currentPath}">${segment}</span>`;
        });
        
        this.pathBreadcrumb.innerHTML = html;
        
        // Add click event listeners for navigation
        this.pathBreadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                this.onNavigate('path', item.dataset.path);
            });
        });
    }
}

export default ExplorerToolbar;
