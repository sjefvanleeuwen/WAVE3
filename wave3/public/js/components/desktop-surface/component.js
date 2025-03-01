class DesktopSurfaceComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['background-image'];
    }

    get backgroundImage() {
        return this.getAttribute('background-image') || '';
    }

    set backgroundImage(value) {
        if (value) {
            this.setAttribute('background-image', value);
        } else {
            this.removeAttribute('background-image');
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'background-image' && this.shadowRoot) {
            this.updateBackgroundImage();
        }
    }

    connectedCallback() {
        this.render();
        this.addEventListeners();
        this.updateBackgroundImage();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    addEventListeners() {
        this.shadowRoot.querySelector('.desktop-surface').addEventListener('click', this.handleClick.bind(this));
        this.shadowRoot.querySelector('.desktop-surface').addEventListener('contextmenu', this.handleRightClick.bind(this));
    }

    removeEventListeners() {
        this.shadowRoot.querySelector('.desktop-surface').removeEventListener('click', this.handleClick.bind(this));
        this.shadowRoot.querySelector('.desktop-surface').removeEventListener('contextmenu', this.handleRightClick.bind(this));
    }

    handleClick(event) {
        // Only handle clicks directly on the desktop surface, not on children
        if (event.target === this.shadowRoot.querySelector('.desktop-surface')) {
            // Deselect all icons when clicking on empty desktop area
            document.querySelectorAll('desktop-icon').forEach(icon => {
                if (icon.shadowRoot.querySelector('.desktop-icon.selected')) {
                    icon.shadowRoot.querySelector('.desktop-icon').classList.remove('selected');
                }
            });
            
            this.dispatchEvent(new CustomEvent('desktop-click', {
                detail: { x: event.clientX, y: event.clientY },
                bubbles: true,
                composed: true
            }));
        }
    }

    handleRightClick(event) {
        event.preventDefault();
        // Show context menu
        this.dispatchEvent(new CustomEvent('desktop-context-menu', {
            detail: { x: event.clientX, y: event.clientY },
            bubbles: true,
            composed: true
        }));
    }

    updateBackgroundImage() {
        const desktopSurface = this.shadowRoot.querySelector('.desktop-surface');
        if (desktopSurface) {
            if (this.backgroundImage) {
                desktopSurface.style.backgroundImage = `url("${this.backgroundImage}")`;
                desktopSurface.classList.add('has-background-image');
            } else {
                desktopSurface.style.backgroundImage = '';
                desktopSurface.classList.remove('has-background-image');
            }
        }
    }

    render() {
        const cssPath = 'js/components/desktop-surface/component.css';
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="${cssPath}">
            <div class="desktop-surface">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('desktop-surface', DesktopSurfaceComponent);
