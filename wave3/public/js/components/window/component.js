class WindowComponent extends HTMLElement {
    // Static counter to track the highest z-index
    static topZIndex = 100;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        console.log('Window component constructed');
        
        // Core state
        this.position = { x: 0, y: 0 };
        this.size = { width: 400, height: 300 };
        this.aspectRatio = null;
        
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
        
        // Set initial z-index and bring to front when created
        this.bringToFront();
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
                
                // Adjust height to match aspect ratio if needed
                this.size.height = this.size.width / this.aspectRatio;
                console.log(`Adjusted size to ${this.size.width}x${this.size.height}`);
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
                }
                .window-content {
                    flex: 1;
                    overflow: auto;
                    padding: 0;
                    margin: 0;
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
                ::slotted(*) {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
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
        
        // Add click handler to bring window to front
        window.addEventListener('mousedown', (e) => {
            this.bringToFront();
        });
        
        // Set up dragging with pointer capture
        titleBar.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.window-controls')) return;
            
            // Capture the pointer to maintain control even when mouse moves out
            titleBar.setPointerCapture(e.pointerId);
            
            this.startDrag(e);
            this.bringToFront();
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Handle pointer events on the title bar
        titleBar.addEventListener('pointermove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
                e.preventDefault();
            }
        });
        
        titleBar.addEventListener('pointerup', (e) => {
            if (this.isDragging) {
                titleBar.releasePointerCapture(e.pointerId);
                this.isDragging = false;
                
                // Add a small delay to prevent immediate click events after drag
                setTimeout(() => {
                    this.shadowRoot.querySelector('.window').classList.remove('dragging');
                }, 10);
                
                e.preventDefault();
            }
        });
        
        // Set up resizing with pointer capture
        resizeHandle.addEventListener('pointerdown', (e) => {
            // Capture the pointer to maintain control during resize
            resizeHandle.setPointerCapture(e.pointerId);
            this.startResize(e);
            this.bringToFront();
            
            e.preventDefault();
            e.stopPropagation();
        });
        
        // Handle pointer events on resize handle
        resizeHandle.addEventListener('pointermove', (e) => {
            if (this.isResizing) {
                this.handleResize(e);
                e.preventDefault();
            }
        });
        
        resizeHandle.addEventListener('pointerup', (e) => {
            if (this.isResizing) {
                resizeHandle.releasePointerCapture(e.pointerId);
                this.isResizing = false;
                
                // Remove resizing state class
                setTimeout(() => {
                    this.shadowRoot.querySelector('.window').classList.remove('resizing');
                }, 10);
                
                e.preventDefault();
            }
        });
        
        // Window controls
        closeBtn.addEventListener('click', () => this.closeWindow());
        maxBtn.addEventListener('click', () => this.maximizeWindow());
        minBtn.addEventListener('click', () => this.minimizeWindow());
        
        // Global events for drag and resize
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
        
        // Still keep document-level handlers as fallbacks
        document.addEventListener('pointermove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
                e.preventDefault();
            } else if (this.isResizing) {
                this.handleResize(e);
                e.preventDefault();
            }
        });
        
        document.addEventListener('pointerup', (e) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.shadowRoot.querySelector('.window').classList.remove('dragging');
            }
            
            if (this.isResizing) {
                this.isResizing = false;
                this.shadowRoot.querySelector('.window').classList.remove('resizing');
            }
        });
    }
    
    // Method to bring window to front
    bringToFront() {
        WindowComponent.topZIndex += 1;
        this.style.zIndex = WindowComponent.topZIndex;
        console.log(`Window "${this.getAttribute('title')}" brought to front with z-index: ${this.style.zIndex}`);
    }

    startDrag(e) {
        this.isDragging = true;
        this.dragStart = {
            x: e.clientX - this.position.x,
            y: e.clientY - this.position.y
        };
        
        // Add class for styling during drag
        this.shadowRoot.querySelector('.window').classList.add('dragging');
    }
    
    startResize(e) {
        this.isResizing = true;
        this.resizeStart = {
            width: this.size.width,
            height: this.size.height,
            x: e.clientX,
            y: e.clientY
        };
        
        // Add class for visual feedback during resize
        this.shadowRoot.querySelector('.window').classList.add('resizing');
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
        
        // Update the window position based on the pointer movement
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
            // Strictly maintain aspect ratio
            newHeight = newWidth / this.aspectRatio;
            console.log(`Resizing with aspect ratio ${this.aspectRatio}: ${newWidth}x${newHeight}`);
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
        }
    }
    
    minimizeWindow() {
        this.style.display = 'none';
        this.dispatchEvent(new CustomEvent('window-minimize'));
    }
}

customElements.define('window-component', WindowComponent);
console.log('Window component registered');
