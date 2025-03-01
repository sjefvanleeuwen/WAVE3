class DesktopIconComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._isDragging = false;
        this._offset = { x: 0, y: 0 };
        this._iconSize = 64;
        // Remove _originalPos from constructor - we'll get it from attributes directly
    }

    static get observedAttributes() {
        return ['icon', 'label', 'position-x', 'position-y', 'size'];
    }

    // Icon image path
    get icon() {
        return this.getAttribute('icon') || '';
    }

    set icon(value) {
        if (value) {
            this.setAttribute('icon', value);
        } else {
            this.removeAttribute('icon');
        }
    }

    // Icon label text
    get label() {
        return this.getAttribute('label') || 'Untitled';
    }

    set label(value) {
        if (value) {
            this.setAttribute('label', value);
        } else {
            this.setAttribute('label', 'Untitled');
        }
    }

    // Position X
    get positionX() {
        return parseInt(this.getAttribute('position-x')) || 20; // Default to 20px from left
    }

    set positionX(value) {
        this.setAttribute('position-x', value);
    }

    // Position Y
    get positionY() {
        return parseInt(this.getAttribute('position-y')) || 20; // Default to 20px from top
    }

    set positionY(value) {
        this.setAttribute('position-y', value);
    }

    // Icon size (optional)
    get size() {
        return parseInt(this.getAttribute('size')) || this._iconSize;
    }
    
    set size(value) {
        if (value) {
            this.setAttribute('size', value);
            this._iconSize = parseInt(value);
        } else {
            this.removeAttribute('size');
            this._iconSize = 64; // Default to 64px
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.shadowRoot) {
            if (name === 'icon') {
                const iconImg = this.shadowRoot.querySelector('.icon-image');
                if (iconImg) {
                    iconImg.src = newValue || '';
                }
            } else if (name === 'label') {
                const labelEl = this.shadowRoot.querySelector('.icon-label');
                if (labelEl) {
                    labelEl.textContent = newValue || 'Untitled';
                }
            } else if (name === 'position-x' || name === 'position-y') {
                this.updatePosition();
                console.log(`Position updated: x=${this.positionX}, y=${this.positionY}`);
            } else if (name === 'size') {
                this.updateIconSize();
            }
        }
    }

    connectedCallback() {
        this.render();
        
        this.updatePosition();
        this.addEventListeners();
        
        console.log(`Icon connected: ${this.label} at x=${this.positionX}, y=${this.positionY}`);
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        const cssPath = 'js/components/desktop-icon/component.css';
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="${cssPath}">
            <div class="desktop-icon">
                <div class="icon-wrapper" style="width: ${this.size}px; height: ${this.size}px;">
                    <img class="icon-image" src="${this.icon}" alt="${this.label}" 
                         style="width: ${this.size}px; height: ${this.size}px;">
                </div>
                <div class="icon-label">${this.label}</div>
            </div>
        `;
    }

    // Make updatePosition public and accept optional position parameter
    updatePosition(position = null) {
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        if (iconElement) {
            // Get the current position from attributes
            const x = position ? position.x : this.positionX;
            const y = position ? position.y : this.positionY;
            
            // Update DOM position directly with pixel values
            iconElement.style.left = `${x}px`;
            iconElement.style.top = `${y}px`;
            
            console.log(`Position updated visually: x=${x}, y=${y}`);
        }
    }

    updateIconSize() {
        const iconWrapper = this.shadowRoot.querySelector('.icon-wrapper');
        const iconImage = this.shadowRoot.querySelector('.icon-image');
        
        if (iconWrapper && iconImage) {
            iconWrapper.style.width = `${this.size}px`;
            iconWrapper.style.height = `${this.size}px`;
            iconImage.style.width = `${this.size}px`;
            iconImage.style.height = `${this.size}px`;
        }
    }

    addEventListeners() {
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        
        // Double click to open
        iconElement.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        // Click to select
        iconElement.addEventListener('click', this.handleClick.bind(this));
        
        // Drag functionality
        iconElement.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        
        // Context menu
        iconElement.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    }

    removeEventListeners() {
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        if (iconElement) {
            iconElement.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
            iconElement.removeEventListener('click', this.handleClick.bind(this));
            iconElement.removeEventListener('mousedown', this.handleDragStart.bind(this));
            iconElement.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
        }
        document.removeEventListener('mousemove', this.handleDragMove.bind(this));
        document.removeEventListener('mouseup', this.handleDragEnd.bind(this));
    }

    handleClick(event) {
        event.stopPropagation();
        
        // Remove selected class from all other icons
        document.querySelectorAll('desktop-icon').forEach(icon => {
            icon.shadowRoot.querySelector('.desktop-icon').classList.remove('selected');
        });
        
        // Add selected class to this icon
        this.shadowRoot.querySelector('.desktop-icon').classList.add('selected');
        
        this.dispatchEvent(new CustomEvent('icon-click', {
            detail: { 
                label: this.label,
                icon: this.icon
            },
            bubbles: true,
            composed: true
        }));
    }

    handleDoubleClick(event) {
        event.stopPropagation();
        
        this.dispatchEvent(new CustomEvent('icon-open', {
            detail: { 
                label: this.label,
                icon: this.icon
            },
            bubbles: true,
            composed: true
        }));
    }

    handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        
        this.dispatchEvent(new CustomEvent('icon-context-menu', {
            detail: { 
                x: event.clientX,
                y: event.clientY,
                label: this.label,
                icon: this.icon
            },
            bubbles: true,
            composed: true
        }));
    }

    handleDragStart(event) {
        // Only allow left mouse button for dragging
        if (event.button !== 0) return;
        
        event.stopPropagation();
        
        this._isDragging = true;
        this.shadowRoot.querySelector('.desktop-icon').classList.add('dragging');
        
        // Get current computed position from the DOM element
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        const computedStyle = window.getComputedStyle(iconElement);
        const currentLeft = parseInt(computedStyle.left) || this.positionX;
        const currentTop = parseInt(computedStyle.top) || this.positionY;
        
        console.log(`Starting drag from actual position: x=${currentLeft}, y=${currentTop}`);
        
        // Calculate offset based on current mouse position and actual element position
        this._offset = {
            x: event.clientX - currentLeft,
            y: event.clientY - currentTop
        };
        
        // Prevent default drag behavior
        event.preventDefault();
    }

    handleDragMove(event) {
        if (!this._isDragging) return;
        
        // Calculate new position based on mouse movement
        const newX = event.clientX - this._offset.x;
        const newY = event.clientY - this._offset.y;
        
        // Validate positions
        const validX = Math.max(0, Math.min(window.innerWidth - 100, newX));
        const validY = Math.max(0, Math.min(window.innerHeight - 100, newY));
        
        // Update visually - set explicit pixel values
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        iconElement.style.left = `${validX}px`;
        iconElement.style.top = `${validY}px`;
        
        // Prevent selection during drag
        event.preventDefault();
    }

    handleDragEnd(event) {
        if (!this._isDragging) return;
        
        this._isDragging = false;
        this.shadowRoot.querySelector('.desktop-icon').classList.remove('dragging');
        
        // Get final position from the computed style after dragging
        const iconElement = this.shadowRoot.querySelector('.desktop-icon');
        const computedStyle = window.getComputedStyle(iconElement);
        const finalX = parseInt(computedStyle.left);
        const finalY = parseInt(computedStyle.top);
        
        console.log(`Drag ended with computed position: x=${finalX}, y=${finalY}`);
        
        if (!isNaN(finalX) && !isNaN(finalY)) {
            // Update the attributes to persist the position
            this.setAttribute('position-x', finalX);
            this.setAttribute('position-y', finalY);
            
            // Dispatch event to save position
            this.dispatchEvent(new CustomEvent('icon-moved', {
                detail: { 
                    x: finalX,
                    y: finalY,
                    label: this.label,
                    icon: this.icon
                },
                bubbles: true,
                composed: true
            }));
        } else {
            console.error('Could not determine final position! Using fallback:', this.positionX, this.positionY);
        }
    }
}

// Make updatePosition accessible from outside
window.updateDesktopIcon = (label, x, y) => {
    const icon = Array.from(document.querySelectorAll('desktop-icon'))
        .find(icon => icon.getAttribute('label') === label);
    
    if (icon) {
        icon.setAttribute('position-x', x);
        icon.setAttribute('position-y', y);
    }
};

customElements.define('desktop-icon', DesktopIconComponent);
