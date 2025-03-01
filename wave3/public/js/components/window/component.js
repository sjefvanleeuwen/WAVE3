class WindowComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        console.log('Window component constructed');
        
        // Core state
        this.position = { x: 0, y: 0 };
        this.size = { width: 400, height: 300 };
        this.aspectRatio = null;
        this.titleBarHeight = 32; // Define title bar height
        
        // Interaction state
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeStart = { width: 0, height: 0, x: 0, y: 0 };
    }

    static get observedAttributes() {
        return ['title', 'width', 'height', 'x', 'y', 'aspect-ratio'];
    }

    connectedCallback() {
        console.log('Window component connected');
        this.initializeProperties();
        this.render();
        this.applyInitialPositionAndSize();
        this.attachEventListeners();
    }

    initializeProperties() {
        // Parse size attributes
        let width = this.hasAttribute('width') ? parseInt(this.getAttribute('width')) : 400;
        let height = this.hasAttribute('height') ? parseInt(this.getAttribute('height')) : 300;
        
        // Ensure minimum dimensions
        width = Math.max(200, width);
        height = Math.max(150, height);
        
        this.size = { width, height };
        
        // Parse position attributes
        this.position = {
            x: this.hasAttribute('x') ? parseInt(this.getAttribute('x')) : 10,
            y: this.hasAttribute('y') ? parseInt(this.getAttribute('y')) : 10
        };
        
        // Parse aspect ratio
        if (this.hasAttribute('aspect-ratio')) {
            const ratio = parseFloat(this.getAttribute('aspect-ratio'));
            if (!isNaN(ratio) && ratio > 0) {
                this.aspectRatio = ratio;
                console.log(`Window initialized with aspect ratio: ${this.aspectRatio}`);
            }
        }
    }

    render() {
        const title = this.getAttribute('title') || 'Untitled Window';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: absolute;
                }
                .window {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.2);
                    overflow: hidden;
                }
                .title-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 4px 8px;
                    background: #2b2b2b;
                    color: white;
                    cursor: move;
                    user-select: none;
                    height: ${this.titleBarHeight - 8}px; /* Account for padding */
                    min-height: ${this.titleBarHeight - 8}px;
                    box-sizing: border-box;
                }
                .window-content {
                    flex: 1;
                    overflow: auto;
                    padding: 8px;
                }
                .resize-handle {
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    bottom: 0;
                    right: 0;
                    cursor: se-resize;
                }
                .window-controls {
                    display: flex;
                    gap: 4px;
                }
                .window-controls button {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: transparent;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .window-controls button:hover {
                    background: rgba(255,255,255,0.1);
                }
                .window-controls .close:hover {
                    background: #ff4444;
                }
                .window.maximized {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: calc(100vh - 40px);
                    border-radius: 0;
                }
                .window.maximized .resize-handle {
                    display: none;
                }
            </style>
            <div class="window">
                <div class="title-bar">
                    <div class="window-title">${title}</div>
                    <div class="window-controls">
                        <button class="minimize">_</button>
                        <button class="maximize">□</button>
                        <button class="close">×</button>
                    </div>
                </div>
                <div class="window-content">
                    <slot></slot>
                </div>
                <div class="resize-handle"></div>
            </div>
        `;
    }

    applyInitialPositionAndSize() {
        this.style.width = `${this.size.width}px`;
        this.style.height = `${this.size.height}px`;
        this.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        console.log(`Initial position: ${this.position.x},${this.position.y} and size: ${this.size.width}x${this.size.height}`);
    }

    attachEventListeners() {
        // Get elements
        const window = this.shadowRoot.querySelector('.window');
        const titleBar = this.shadowRoot.querySelector('.title-bar');
        const resizeHandle = this.shadowRoot.querySelector('.resize-handle');
        const closeBtn = this.shadowRoot.querySelector('.close');
        const maxBtn = this.shadowRoot.querySelector('.maximize');
        const minBtn = this.shadowRoot.querySelector('.minimize');
        
        // Set up dragging
        titleBar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.startDrag(e);
        });
        
        // Set up resizing
        resizeHandle.addEventListener('mousedown', (e) => {
            this.startResize(e);
        });
        
        // Window controls
        closeBtn.addEventListener('click', () => this.closeWindow());
        maxBtn.addEventListener('click', () => this.maximizeWindow());
        minBtn.addEventListener('click', () => this.minimizeWindow());
        
        // Global events for drag and resize
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - this.position.x,
            y: e.clientY - this.position.y
        };
        this.style.zIndex = 1000;
        e.preventDefault();
    }
    
    startResize(e) {
        this.isResizing = true;
        this.resizeStart = {
            width: this.size.width,
            height: this.size.height,
            x: e.clientX,
            y: e.clientY
        };
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            this.handleDrag(e);
        } else if (this.isResizing) {
            this.handleResize(e);
        }
    }
    
    handleDrag(e) {
        if (!this.isDragging) return;
        
        const newX = e.clientX - this.dragStart.x;
        const newY = e.clientY - this.dragStart.y;
        
        this.position = { x: newX, y: newY };
        this.style.transform = `translate(${newX}px, ${newY}px)`;
    }
    
    handleResize(e) {
        if (!this.isResizing) return;
        
        const deltaX = e.clientX - this.resizeStart.x;
        let newWidth = Math.max(200, this.resizeStart.width + deltaX);
        let newHeight;
        
        if (this.aspectRatio) {
            // Calculate content height based on aspect ratio
            const contentHeight = newWidth / this.aspectRatio;
            // Add title bar height to get total window height
            newHeight = contentHeight + this.titleBarHeight;
            console.log(`Resizing with content aspect ratio ${this.aspectRatio}: content ${newWidth}x${contentHeight}, window ${newWidth}x${newHeight}`);
        } else {
            const deltaY = e.clientY - this.resizeStart.y;
            newHeight = Math.max(150, this.resizeStart.height + deltaY);
        }
        
        this.size = { width: newWidth, height: newHeight };
        this.style.width = `${newWidth}px`;
        this.style.height = `${newHeight}px`;
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
    }
    
    closeWindow() {
        this.dispatchEvent(new CustomEvent('window-close'));
        this.remove();
    }
    
    maximizeWindow() {
        const window = this.shadowRoot.querySelector('.window');
        
        if (window.classList.contains('maximized')) {
            window.classList.remove('maximized');
            this.style.width = `${this.size.width}px`;
            this.style.height = `${this.size.height}px`;
            this.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
        } else {
            window.classList.add('maximized');
            this.setAttribute('data-restore-x', this.position.x);
            this.setAttribute('data-restore-y', this.position.y);
            this.setAttribute('data-restore-width', this.size.width);
            this.setAttribute('data-restore-height', this.size.height);
            
            // Make sure content area fills available space
            const contentArea = this.shadowRoot.querySelector('.window-content');
            contentArea.style.height = `calc(100vh - ${this.titleBarHeight}px - 40px)`;
        }
    }
    
    minimizeWindow() {
        this.style.display = 'none';
        this.dispatchEvent(new CustomEvent('window-minimize'));
    }
}

customElements.define('window-component', WindowComponent);
console.log('Window component registered');
