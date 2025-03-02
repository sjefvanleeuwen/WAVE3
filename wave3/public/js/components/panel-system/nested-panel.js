/**
 * NestedPanel - A panel that can contain other panels in a nested structure
 * Extends PanelArea to provide nested panel container functionality
 */
class NestedPanel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        // Create a panel container inside this element
        this._render();
    }
    
    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                
                panel-container {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
            
            <panel-container></panel-container>
        `;
        
        // Initialize panel container
        this._container = this.shadowRoot.querySelector('panel-container');
    }
    
    /**
     * Get the internal panel container
     */
    get panelContainer() {
        return this._container;
    }
    
    /**
     * Add a panel to this nested container
     */
    addPanel(element, region = 'center', options = {}) {
        return this._container.addPanel(element, region, options);
    }
    
    /**
     * Remove a panel from this container
     */
    removePanel(panelOrId) {
        return this._container.removePanel(panelOrId);
    }
    
    /**
     * Get panel by ID from this container
     */
    getPanelById(id) {
        return this._container.getPanelById(id);
    }
    
    /**
     * Move panel within this container
     */
    movePanel(panelOrId, newRegion) {
        return this._container.movePanel(panelOrId, newRegion);
    }
    
    /**
     * Get all panels in a specific region
     */
    getPanels(region = null) {
        return this._container.getPanels(region);
    }
    
    /**
     * Clear panels from this container
     */
    clearPanels(region = null) {
        return this._container.clearPanels(region);
    }
}

// Register the web component
customElements.define('nested-panel', NestedPanel);
