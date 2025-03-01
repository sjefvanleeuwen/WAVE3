class WindowComponent extends HTMLElement {
    static topZIndex = 100;
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Store window state
        this._state = {
            position: { x: 0, y: 0 },
            size: { width: 400, height: 300 },
            aspectRatio: null,
            isMaximized: false,
            isDragging: false,
            isResizing: false
        };
        
        // Interaction tracking
        this._dragInfo = { startX: 0, startY: 0 };
        this._resizeInfo = { startX: 0, startY: 0, startWidth: 0, startHeight: 0 };
    }
    
    static get observedAttributes() {
        return ['title', 'width', 'height', 'x', 'y', 'aspect-ratio', 'theme'];
    }
    
    // Lifecycle methods
    connectedCallback() {
        this.initializeWindow();
        this.render();
        this.setupEventListeners();
        this.bringToFront();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        if (this.isConnected) {
            switch (name) {
                case 'title':
                    this.updateTitle(newValue);
                    break;
                case 'theme':
                    this.updateTheme(newValue);
                    break;
                case 'aspect-ratio':
                    if (oldValue === null) {
                        this._state.aspectRatio = parseFloat(newValue) || null;
                        this.adjustSizeForAspectRatio();
                    }
                    break;
            }
        }
    }
    
    // Initialization
    initializeWindow() {
        // Parse attributes
        const width = parseInt(this.getAttribute('width')) || 400;
        const height = parseInt(this.getAttribute('height')) || 300;
        const x = parseInt(this.getAttribute('x')) || 10;
        const y = parseInt(this.getAttribute('y')) || 10;
        const aspectRatioAttr = this.getAttribute('aspect-ratio');
        
        // Set initial state
        this._state.size = { 
            width: Math.max(200, width),
            height: Math.max(150, height)
        };
        this._state.position = { x, y };
        
        if (aspectRatioAttr) {
            this._state.aspectRatio = parseFloat(aspectRatioAttr) || null;
            this.adjustSizeForAspectRatio();
        }
    }
    
    adjustSizeForAspectRatio() {
        if (this._state.aspectRatio) {
            this._state.size.height = this._state.size.width / this._state.aspectRatio;
        }
    }
    
    // Rendering
    render() {
        // Get attributes for rendering
        const title = this.getAttribute('title') || 'Window';
        const theme = this.getAttribute('theme') || 'light';
        
        // Create styles
        const styles = `
            :host {
                display: block;
                position: absolute;
                box-sizing: border-box;
                transform: translate(${this._state.position.x}px, ${this._state.position.y}px);
                width: ${this._state.size.width}px;
                height: ${this._state.size.height}px;
                transition: box-shadow 0.2s, opacity 0.2s;
            }
            
            .window {
                display: grid;
                grid-template-rows: auto 1fr;
                width: 100%;
                height: 100%;
                background: ${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
                border-radius: 4px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                border: 1px solid ${theme === 'dark' ? '#3a3a3a' : '#e0e0e0'};
            }
            
            .window.active {
                box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
            }
            
            .window.dragging {
                opacity: 0.9;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
                cursor: move;
                user-select: none;
            }
            
            .window.resizing {
                opacity: 0.9;
                user-select: none;
            }
            
            .titlebar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 32px;
                padding: 0 0 0 10px;
                background: ${theme === 'dark' ? '#1f1f1f' : '#f0f0f0'};
                color: ${theme === 'dark' ? '#ffffff' : '#333333'};
                border-bottom: 1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'};
                user-select: none;
            }
            
            .window-title {
                font-family: system-ui, 'Segoe UI', sans-serif;
                font-size: 12px;
                font-weight: 400;
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-right: 10px;
                color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
            }
            
            .window-controls {
                display: flex;
                height: 100%;
            }
            
            .window-controls button {
                width: 46px;
                height: 32px;
                border: none;
                background-color: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.15s;
                color: ${theme === 'dark' ? '#ffffff' : '#333333'};
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 10px;
            }
            
            .window-controls button:hover {
                background-color: ${theme === 'dark' ? '#444444' : '#e5e5e5'};
            }
            
            .minimize-btn:hover {
                color: ${theme === 'dark' ? '#ffffff' : '#333333'};
            }
            
            .maximize-btn:hover {
                color: ${theme === 'dark' ? '#ffffff' : '#333333'};
            }
            
            .close-btn:hover {
                background-color: #e81123 !important;
                color: white !important;
            }
            
            .minimize-btn::after {
                content: "—";
                font-size: 12px;
            }
            
            .maximize-btn::after {
                content: "□";
                font-size: 14px;
            }
            
            .close-btn::after {
                content: "×";
                font-size: 16px;
            }
            
            .window-content {
                position: relative;
                min-height: 0;
                overflow: hidden;
                background: ${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
                color: ${theme === 'dark' ? '#e1e1e1' : '#333333'};
            }
            
            ::slotted(*) {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                box-sizing: border-box;
            }
            
            ::slotted(iframe) {
                border: none;
            }
            
            /* Normal content gets padding */
            ::slotted(:not(iframe):not(.no-padding)) {
                padding: 12px;
            }
            
            .resize-handle {
                position: absolute;
                width: 14px;
                height: 14px;
                right: 0;
                bottom: 0;
                cursor: nwse-resize;
                z-index: 10;
            }
            
            .resize-handle::after {
                content: "";
                display: block;
                position: absolute;
                right: 3px;
                bottom: 3px;
                width: 8px;
                height: 8px;
                border-right: 2px solid ${theme === 'dark' ? '#666' : '#ccc'};
                border-bottom: 2px solid ${theme === 'dark' ? '#666' : '#ccc'};
            }
            
            /* Maximized state */
            .window.maximized {
                border-radius: 0;
            }
            
            .window.maximized .resize-handle {
                display: none;
            }
        `;
        
        // Create HTML structure
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="window">
                <div class="titlebar">
                    <div class="window-title">${title}</div>
                    <div class="window-controls">
                        <button class="minimize-btn" title="Minimize"></button>
                        <button class="maximize-btn" title="Maximize"></button>
                        <button class="close-btn" title="Close"></button>
                    </div>
                </div>
                <div class="window-content">
                    <slot></slot>
                </div>
                <div class="resize-handle" title="Resize"></div>
            </div>
        `;
        
        // Apply initial size and position
        this.style.width = `${this._state.size.width}px`;
        this.style.height = `${this._state.size.height}px`;
        this.style.transform = `translate(${this._state.position.x}px, ${this._state.position.y}px)`;
    }
    
    // Event handling
    setupEventListeners() {
        const window = this.shadowRoot.querySelector('.window');
        const titlebar = this.shadowRoot.querySelector('.titlebar');
        const resizeHandle = this.shadowRoot.querySelector('.resize-handle');
        
        // Window control buttons
        const closeBtn = this.shadowRoot.querySelector('.close-btn');
        const minBtn = this.shadowRoot.querySelector('.minimize-btn');
        const maxBtn = this.shadowRoot.querySelector('.maximize-btn');
        
        // Window click - activate
        window.addEventListener('mousedown', () => this.bringToFront());
        
        // Title bar drag
        titlebar.addEventListener('pointerdown', e => {
            if (e.target.closest('.window-controls')) return;
            
            titlebar.setPointerCapture(e.pointerId);
            this.startDrag(e);
            this.bringToFront();
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        titlebar.addEventListener('pointermove', e => {
            if (this._state.isDragging) {
                this.handleDrag(e);
                e.preventDefault();
            }
        });
        
        titlebar.addEventListener('pointerup', e => {
            if (this._state.isDragging) {
                titlebar.releasePointerCapture(e.pointerId);
                this.stopDrag();
                e.preventDefault();
            }
        });
        
        // Window resize
        resizeHandle.addEventListener('pointerdown', e => {
            resizeHandle.setPointerCapture(e.pointerId);
            this.startResize(e);
            this.bringToFront();
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        resizeHandle.addEventListener('pointermove', e => {
            if (this._state.isResizing) {
                this.handleResize(e);
                e.preventDefault();
            }
        });
        
        resizeHandle.addEventListener('pointerup', e => {
            if (this._state.isResizing) {
                resizeHandle.releasePointerCapture(e.pointerId);
                this.stopResize();
                e.preventDefault();
            }
        });
        
        // Window controls
        closeBtn.addEventListener('click', () => this.close());
        minBtn.addEventListener('click', () => this.minimize());
        maxBtn.addEventListener('click', () => this.toggleMaximize());
    }
    
    // Window actions
    close() {
        this.dispatchEvent(new CustomEvent('window-close'));
        this.remove();
    }
    
    minimize() {
        this.style.display = 'none';
        this.dispatchEvent(new CustomEvent('window-minimize'));
    }
    
    maximize() {
        const window = this.shadowRoot.querySelector('.window');
        window.classList.add('maximized');
        
        // Store current size and position for restore
        this.dataset.restoreX = this._state.position.x;
        this.dataset.restoreY = this._state.position.y;
        this.dataset.restoreWidth = this._state.size.width;
        this.dataset.restoreHeight = this._state.size.height;
        
        // Set maximized size and position
        this.style.transform = 'translate(0, 0)';
        this.style.width = '100vw';
        this.style.height = 'calc(100vh - 40px)'; // Account for taskbar
        
        this._state.isMaximized = true;
        
        this.dispatchEvent(new CustomEvent('window-maximize'));
    }
    
    restore() {
        const window = this.shadowRoot.querySelector('.window');
        window.classList.remove('maximized');
        
        // Restore previous size and position
        this._state.position.x = parseInt(this.dataset.restoreX) || 0;
        this._state.position.y = parseInt(this.dataset.restoreY) || 0;
        this._state.size.width = parseInt(this.dataset.restoreWidth) || 400;
        this._state.size.height = parseInt(this.dataset.restoreHeight) || 300;
        
        this.style.transform = `translate(${this._state.position.x}px, ${this._state.position.y}px)`;
        this.style.width = `${this._state.size.width}px`;
        this.style.height = `${this._state.size.height}px`;
        
        this._state.isMaximized = false;
        
        this.dispatchEvent(new CustomEvent('window-restore'));
    }
    
    toggleMaximize() {
        if (this._state.isMaximized) {
            this.restore();
        } else {
            this.maximize();
        }
    }
    
    bringToFront() {
        WindowComponent.topZIndex += 1;
        this.style.zIndex = WindowComponent.topZIndex;
        
        // Add active class for visual indication
        const allWindows = document.querySelectorAll('window-component');
        allWindows.forEach(win => {
            if (win.shadowRoot) {
                const windowEl = win.shadowRoot.querySelector('.window');
                if (windowEl) windowEl.classList.remove('active');
            }
        });
        
        this.shadowRoot.querySelector('.window').classList.add('active');
        
        this.dispatchEvent(new CustomEvent('window-focus'));
    }
    
    // Drag operations
    startDrag(e) {
        this._state.isDragging = true;
        this._dragInfo = {
            startX: e.clientX - this._state.position.x,
            startY: e.clientY - this._state.position.y
        };
        
        this.shadowRoot.querySelector('.window').classList.add('dragging');
    }
    
    handleDrag(e) {
        if (!this._state.isDragging) return;
        
        const newX = e.clientX - this._dragInfo.startX;
        const newY = e.clientY - this._dragInfo.startY;
        
        this._state.position = { x: newX, y: newY };
        this.style.transform = `translate(${newX}px, ${newY}px)`;
    }
    
    stopDrag() {
        this._state.isDragging = false;
        this.shadowRoot.querySelector('.window').classList.remove('dragging');
    }
    
    // Resize operations
    startResize(e) {
        this._state.isResizing = true;
        this._resizeInfo = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: this._state.size.width,
            startHeight: this._state.size.height
        };
        
        this.shadowRoot.querySelector('.window').classList.add('resizing');
    }
    
    handleResize(e) {
        if (!this._state.isResizing) return;
        
        const deltaX = e.clientX - this._resizeInfo.startX;
        const newWidth = Math.max(200, this._resizeInfo.startWidth + deltaX);
        
        let newHeight;
        if (this._state.aspectRatio) {
            newHeight = newWidth / this._state.aspectRatio;
        } else {
            const deltaY = e.clientY - this._resizeInfo.startY;
            newHeight = Math.max(150, this._resizeInfo.startHeight + deltaY);
        }
        
        this._state.size = { width: newWidth, height: newHeight };
        this.style.width = `${newWidth}px`;
        this.style.height = `${newHeight}px`;
    }
    
    stopResize() {
        this._state.isResizing = false;
        this.shadowRoot.querySelector('.window').classList.remove('resizing');
    }
    
    // Helper methods
    updateTitle(title) {
        const titleEl = this.shadowRoot.querySelector('.window-title');
        if (titleEl) titleEl.textContent = title || 'Window';
    }
    
    updateTheme(theme) {
        // Re-render with the new theme
        this.render();
    }
}

customElements.define('window-component', WindowComponent);
