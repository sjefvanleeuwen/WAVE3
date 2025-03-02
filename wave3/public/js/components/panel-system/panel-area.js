/**
 * PanelArea - An individual panel within the panel container
 */
class PanelArea extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // State
        this._collapsed = false;
    }
    
    static get observedAttributes() {
        return ['title', 'closable', 'collapsible'];
    }
    
    connectedCallback() {
        this._render();
        this._setupEventListeners();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title' && this.shadowRoot) {
            const titleEl = this.shadowRoot.querySelector('.panel-title');
            if (titleEl) titleEl.textContent = newValue || '';
        } else if ((name === 'closable' || name === 'collapsible') && this.shadowRoot) {
            this._render();
        }
    }
    
    /**
     * Render the panel
     */
    _render() {
        const title = this.getAttribute('title') || '';
        const closable = this.hasAttribute('closable') && this.getAttribute('closable') !== 'false';
        const collapsible = this.hasAttribute('collapsible') && this.getAttribute('collapsible') !== 'false';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    box-sizing: border-box;
                    background-color: #ffffff;
                }
                
                .panel-header {
                    display: flex;
                    align-items: center;
                    padding: 6px 8px;
                    background-color: #f5f5f5;
                    border-bottom: 1px solid #e0e0e0;
                    min-height: 32px;
                    user-select: none;
                }
                
                .panel-title {
                    flex-grow: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-weight: 500;
                    font-size: 14px;
                    color: #333;
                }
                
                .panel-controls {
                    display: flex;
                    gap: 4px;
                }
                
                .panel-control {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                    border: none;
                    background-color: transparent;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #555;
                }
                
                .panel-control:hover {
                    background-color: #e0e0e0;
                }
                
                .panel-body {
                    flex-grow: 1;
                    overflow: auto;
                    position: relative;
                }
                
                /* Panel content takes full width/height */
                ::slotted(*) {
                    width: 100%;
                    height: 100%;
                }
                
                /* Collapsed state */
                :host(.collapsed) .panel-body {
                    display: none;
                }
            </style>
            
            ${title || closable || collapsible ? `
                <div class="panel-header" part="header">
                    <div class="panel-title" part="title">${title}</div>
                    <div class="panel-controls">
                        ${collapsible ? `
                            <button class="panel-control collapse-toggle" title="Toggle panel">
                                ${this._collapsed ? '↑' : '↓'}
                            </button>
                        ` : ''}
                        ${closable ? `
                            <button class="panel-control close-panel" title="Close panel">×</button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="panel-body" part="body">
                <slot></slot>
            </div>
        `;
        
        // Apply collapsed state
        if (this._collapsed) {
            this.classList.add('collapsed');
        }
    }
    
    /**
     * Set up event handlers
     */
    _setupEventListeners() {
        // Close button
        const closeBtn = this.shadowRoot.querySelector('.close-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('panel-close', {
                    bubbles: true,
                    composed: true,
                    detail: { panel: this }
                }));
                
                // Find parent container
                const container = this.closest('panel-container');
                if (container) {
                    container.removePanel(this);
                } else {
                    this.remove();
                }
            });
        }
        
        // Collapse toggle
        const collapseBtn = this.shadowRoot.querySelector('.collapse-toggle');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                this.toggleCollapse();
            });
        }
        
        // Double click on header to collapse
        const header = this.shadowRoot.querySelector('.panel-header');
        if (header && this.hasAttribute('collapsible') && this.getAttribute('collapsible') !== 'false') {
            header.addEventListener('dblclick', (e) => {
                // Only collapse if clicking directly on the header (not on buttons)
                if (!e.target.closest('.panel-control')) {
                    this.toggleCollapse();
                }
            });
        }
    }
    
    /**
     * Toggle collapsed state
     */
    toggleCollapse() {
        this._collapsed = !this._collapsed;
        
        if (this._collapsed) {
            this.classList.add('collapsed');
        } else {
            this.classList.remove('collapsed');
        }
        
        // Update collapse button
        const collapseBtn = this.shadowRoot.querySelector('.collapse-toggle');
        if (collapseBtn) {
            collapseBtn.textContent = this._collapsed ? '↑' : '↓';
        }
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('panel-toggle', {
            bubbles: true,
            composed: true,
            detail: { panel: this, collapsed: this._collapsed }
        }));
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
    }
    
    /**
     * Set panel collapsed state
     */
    setCollapsed(collapsed) {
        if (this._collapsed !== collapsed) {
            this.toggleCollapse();
        }
    }
    
    /**
     * Check if panel is collapsed
     */
    isCollapsed() {
        return this._collapsed;
    }
}

// Register the web component
customElements.define('panel-area', PanelArea);
