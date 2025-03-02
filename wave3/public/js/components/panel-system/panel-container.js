/**
 * PanelContainer - A flexible panel container with docking capabilities
 * Allows creating complex layouts with resizable panels in various positions
 */
class PanelContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Track panels by regions
        this._panels = {
            top: [],
            left: [],
            center: [],
            right: [],
            bottom: []
        };
        
        // Default sizes
        this._sizes = {
            top: '200px',
            left: '200px', 
            right: '200px',
            bottom: '200px'
        };
        
        // Track resize operations
        this._resizing = {
            active: false,
            edge: null,
            startPos: 0,
            startSize: 0
        };
    }
    
    connectedCallback() {
        this._render();
        this._attachEventListeners();
        this._loadConfiguration();
    }
    
    /**
     * Initialize the panel container structure
     */
    _render() {
        // Apply styles
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    position: relative;
                    --panel-background: #f5f5f5;
                    --panel-border: #ddd;
                    --panel-resizer: #eee;
                    --panel-resizer-hover: #ccc;
                    --panel-resizer-active: #aaa;
                }
                
                .panel-container {
                    display: grid;
                    width: 100%;
                    height: 100%;
                    grid-template-areas: 
                        "top    top    top"
                        "left   center right"
                        "bottom bottom bottom";
                    grid-template-rows: auto 1fr auto;
                    grid-template-columns: auto 1fr auto;
                }
                
                .panel-region {
                    overflow: hidden;
                    background-color: var(--panel-background);
                    position: relative;
                }
                
                .panel-top {
                    grid-area: top;
                    border-bottom: 1px solid var(--panel-border);
                }
                
                .panel-left {
                    grid-area: left;
                    border-right: 1px solid var(--panel-border);
                }
                
                .panel-center {
                    grid-area: center;
                    z-index: 0;
                    overflow: auto;
                }
                
                .panel-right {
                    grid-area: right;
                    border-left: 1px solid var(--panel-border);
                }
                
                .panel-bottom {
                    grid-area: bottom;
                    border-top: 1px solid var(--panel-border);
                }
                
                .panel-resizer {
                    position: absolute;
                    background-color: var(--panel-resizer);
                    z-index: 10;
                    transition: background-color 0.2s;
                }
                
                .panel-resizer:hover {
                    background-color: var(--panel-resizer-hover);
                }
                
                .panel-resizer.active {
                    background-color: var(--panel-resizer-active);
                }
                
                .panel-resizer.horizontal {
                    height: 5px;
                    width: 100%;
                    cursor: ns-resize;
                }
                
                .panel-resizer.vertical {
                    width: 5px;
                    height: 100%;
                    cursor: ew-resize;
                }
                
                .panel-resizer.top {
                    bottom: 0;
                    transform: translateY(50%);
                }
                
                .panel-resizer.bottom {
                    top: 0;
                    transform: translateY(-50%);
                }
                
                .panel-resizer.left {
                    right: 0;
                    transform: translateX(50%);
                }
                
                .panel-resizer.right {
                    left: 0;
                    transform: translateX(-50%);
                }
                
                .panel-content {
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                }
                
                .hidden-region {
                    display: none !important;
                }
            </style>
            
            <div class="panel-container">
                <div class="panel-region panel-top" style="height: ${this._sizes.top};">
                    <div class="panel-content panel-slot-top"></div>
                    <div class="panel-resizer horizontal top"></div>
                </div>
                
                <div class="panel-region panel-left" style="width: ${this._sizes.left};">
                    <div class="panel-content panel-slot-left"></div>
                    <div class="panel-resizer vertical left"></div>
                </div>
                
                <div class="panel-region panel-center">
                    <div class="panel-content panel-slot-center"></div>
                </div>
                
                <div class="panel-region panel-right" style="width: ${this._sizes.right};">
                    <div class="panel-resizer vertical right"></div>
                    <div class="panel-content panel-slot-right"></div>
                </div>
                
                <div class="panel-region panel-bottom" style="height: ${this._sizes.bottom};">
                    <div class="panel-resizer horizontal bottom"></div>
                    <div class="panel-content panel-slot-bottom"></div>
                </div>
            </div>
        `;
        
        // Hide empty regions by default
        this._updateRegionVisibility();
    }
    
    _updateRegionVisibility() {
        // Hide empty regions
        ['top', 'left', 'right', 'bottom'].forEach(region => {
            const regionElement = this.shadowRoot.querySelector(`.panel-${region}`);
            if (this._panels[region].length === 0) {
                regionElement.classList.add('hidden-region');
            } else {
                regionElement.classList.remove('hidden-region');
            }
        });
    }
    
    _attachEventListeners() {
        // Set up resize handlers
        const resizers = this.shadowRoot.querySelectorAll('.panel-resizer');
        resizers.forEach(resizer => {
            resizer.addEventListener('mousedown', this._handleResizeStart.bind(this));
        });
        
        // Global mouse handlers for resizing
        document.addEventListener('mousemove', this._handleResizeMove.bind(this));
        document.addEventListener('mouseup', this._handleResizeEnd.bind(this));
        
        // Listen for panel configuration changes
        this.addEventListener('panel-config-changed', this._saveConfiguration.bind(this));
    }
    
    /**
     * Start panel resizing operation
     */
    _handleResizeStart(e) {
        const resizer = e.target;
        
        // Determine which edge is being resized
        let edge = null;
        if (resizer.classList.contains('top')) edge = 'top';
        else if (resizer.classList.contains('bottom')) edge = 'bottom';
        else if (resizer.classList.contains('left')) edge = 'left';
        else if (resizer.classList.contains('right')) edge = 'right';
        
        if (!edge) return;
        
        // Get the panel being resized
        const panel = this.shadowRoot.querySelector(`.panel-${edge}`);
        
        // Set up resizing state
        this._resizing.active = true;
        this._resizing.edge = edge;
        
        // Track position for vertical or horizontal resize
        if (edge === 'top' || edge === 'bottom') {
            this._resizing.startPos = e.clientY;
            this._resizing.startSize = panel.offsetHeight;
        } else {
            this._resizing.startPos = e.clientX;
            this._resizing.startSize = panel.offsetWidth;
        }
        
        // Add active class to resizer
        resizer.classList.add('active');
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }
    
    /**
     * Handle resize movement
     */
    _handleResizeMove(e) {
        if (!this._resizing.active) return;
        
        const { edge, startPos, startSize } = this._resizing;
        const panel = this.shadowRoot.querySelector(`.panel-${edge}`);
        
        let newSize;
        
        // Calculate new size based on edge
        if (edge === 'top') {
            newSize = startSize + (e.clientY - startPos);
        } else if (edge === 'bottom') {
            newSize = startSize - (e.clientY - startPos);
        } else if (edge === 'left') {
            newSize = startSize + (e.clientX - startPos);
        } else if (edge === 'right') {
            newSize = startSize - (e.clientX - startPos);
        }
        
        // Enforce minimum size
        newSize = Math.max(50, newSize);
        
        // Apply new size
        if (edge === 'top' || edge === 'bottom') {
            panel.style.height = `${newSize}px`;
            this._sizes[edge] = `${newSize}px`;
        } else {
            panel.style.width = `${newSize}px`;
            this._sizes[edge] = `${newSize}px`;
        }
        
        // Trigger a resize event for child panels
        this.dispatchEvent(new CustomEvent('panel-resized', { 
            detail: { region: edge, size: newSize } 
        }));
    }
    
    /**
     * End resize operation
     */
    _handleResizeEnd(e) {
        if (!this._resizing.active) return;
        
        // Reset resizing state
        const resizer = this.shadowRoot.querySelector(`.panel-resizer.${this._resizing.edge}`);
        resizer.classList.remove('active');
        
        this._resizing.active = false;
        this._resizing.edge = null;
        
        // Restore text selection
        document.body.style.userSelect = '';
        
        // Save new configuration
        this._saveConfiguration();
    }
    
    /**
     * Save current panel configuration
     */
    _saveConfiguration() {
        const config = {
            sizes: this._sizes,
            regions: {
                top: this._panels.top.map(p => p.id || ''),
                left: this._panels.left.map(p => p.id || ''),
                right: this._panels.right.map(p => p.id || ''),
                bottom: this._panels.bottom.map(p => p.id || ''),
                center: this._panels.center.map(p => p.id || '')
            }
        };
        
        localStorage.setItem('panel_system_config', JSON.stringify(config));
    }
    
    /**
     * Load saved panel configuration
     */
    _loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('panel_system_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                
                // Restore panel sizes
                if (config.sizes) {
                    Object.assign(this._sizes, config.sizes);
                    
                    // Apply sizes to DOM
                    for (const [region, size] of Object.entries(this._sizes)) {
                        const panel = this.shadowRoot.querySelector(`.panel-${region}`);
                        if (panel) {
                            if (region === 'top' || region === 'bottom') {
                                panel.style.height = size;
                            } else {
                                panel.style.width = size;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error loading panel configuration:', e);
        }
    }
    
    /* Panel Management API */
    
    /**
     * Add a panel to a specific region
     * @param {HTMLElement} element - The panel element to add
     * @param {string} region - The region to add the panel to (top, left, center, right, bottom)
     * @param {object} options - Additional options like title, closable, etc.
     */
    addPanel(element, region = 'center', options = {}) {
        if (!['top', 'left', 'center', 'right', 'bottom'].includes(region)) {
            console.error(`Invalid region: ${region}`);
            return;
        }
        
        const panel = document.createElement('panel-area');
        
        // Set panel attributes
        if (options.title) panel.setAttribute('title', options.title);
        if (options.id) panel.setAttribute('id', options.id);
        if (options.closable !== undefined) panel.setAttribute('closable', options.closable);
        if (options.collapsible !== undefined) panel.setAttribute('collapsible', options.collapsible);
        
        // Add the element to the panel
        panel.appendChild(element);
        
        // Add the panel to the designated slot
        const slot = this.shadowRoot.querySelector(`.panel-slot-${region}`);
        slot.appendChild(panel);
        
        // Register the panel
        this._panels[region].push(panel);
        
        // Update visibility of regions
        this._updateRegionVisibility();
        
        return panel;
    }
    
    /**
     * Remove a panel by its ID or reference
     */
    removePanel(panelOrId) {
        const isId = typeof panelOrId === 'string';
        
        for (const [region, panels] of Object.entries(this._panels)) {
            const index = panels.findIndex(p => 
                isId ? p.id === panelOrId : p === panelOrId
            );
            
            if (index !== -1) {
                const panel = panels[index];
                panels.splice(index, 1);
                panel.remove();
                this._updateRegionVisibility();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get a panel by its ID
     */
    getPanelById(id) {
        for (const panels of Object.values(this._panels)) {
            const panel = panels.find(p => p.id === id);
            if (panel) return panel;
        }
        return null;
    }
    
    /**
     * Move a panel to a different region
     */
    movePanel(panelOrId, newRegion) {
        if (!['top', 'left', 'center', 'right', 'bottom'].includes(newRegion)) {
            console.error(`Invalid region: ${newRegion}`);
            return false;
        }
        
        const panel = typeof panelOrId === 'string' 
            ? this.getPanelById(panelOrId) 
            : panelOrId;
            
        if (!panel) return false;
        
        // Remove from current region
        for (const [region, panels] of Object.entries(this._panels)) {
            const index = panels.indexOf(panel);
            if (index !== -1) {
                panels.splice(index, 1);
                
                // Add to new region
                this._panels[newRegion].push(panel);
                
                // Move in DOM
                const newSlot = this.shadowRoot.querySelector(`.panel-slot-${newRegion}`);
                newSlot.appendChild(panel);
                
                this._updateRegionVisibility();
                this._saveConfiguration();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Get all panels in a specific region
     */
    getPanels(region = null) {
        if (!region) {
            // Return all panels
            return Object.entries(this._panels).reduce((all, [region, panels]) => {
                return all.concat(panels.map(p => ({ region, panel: p })));
            }, []);
        }
        
        if (!this._panels[region]) return [];
        return this._panels[region];
    }
    
    /**
     * Clear all panels from a region or all regions
     */
    clearPanels(region = null) {
        if (region) {
            // Clear specific region
            if (!this._panels[region]) return;
            
            const panelSlot = this.shadowRoot.querySelector(`.panel-slot-${region}`);
            panelSlot.innerHTML = '';
            this._panels[region] = [];
        } else {
            // Clear all regions
            for (const region of Object.keys(this._panels)) {
                this.clearPanels(region);
            }
        }
        
        this._updateRegionVisibility();
    }
}

// Register the web component
customElements.define('panel-container', PanelContainer);
