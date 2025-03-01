/**
 * Utility for debugging desktop icon positions
 */
class PositionDebugger {
    constructor() {
        this.initialized = false;
        this.initialize();
    }

    initialize() {
        if (this.initialized) return;
        
        // Create a debug overlay
        const overlay = document.createElement('div');
        overlay.id = 'position-debug-overlay';
        overlay.style.cssText = `
            position: fixed;
            bottom: 40px;
            left: 10px;
            z-index: 9999;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // Track mouse position
        document.addEventListener('mousemove', this.trackMouse.bind(this));
        
        // Setup keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        this.initialized = true;
        console.log('Position debugger initialized. Press Alt+D to toggle.');
    }
    
    trackMouse(event) {
        if (this.overlay.style.display === 'block') {
            this.overlay.textContent = `Mouse: ${event.clientX}, ${event.clientY}\n`;
            
            // Find the icon under the mouse
            document.querySelectorAll('desktop-icon').forEach(icon => {
                const rect = icon.getBoundingClientRect();
                if (
                    event.clientX >= rect.left && 
                    event.clientX <= rect.right &&
                    event.clientY >= rect.top &&
                    event.clientY <= rect.bottom
                ) {
                    const label = icon.getAttribute('label');
                    const posX = icon.getAttribute('position-x');
                    const posY = icon.getAttribute('position-y');
                    
                    if (icon.shadowRoot) {
                        const iconEl = icon.shadowRoot.querySelector('.desktop-icon');
                        if (iconEl) {
                            const style = window.getComputedStyle(iconEl);
                            const computedLeft = style.left;
                            const computedTop = style.top;
                            
                            this.overlay.textContent += `\nIcon: ${label}\n`;
                            this.overlay.textContent += `Attr: ${posX}, ${posY}\n`;
                            this.overlay.textContent += `Computed: ${computedLeft}, ${computedTop}`;
                        }
                    }
                }
            });
        }
    }
    
    handleKeydown(event) {
        // Alt+D to toggle debug overlay
        if (event.altKey && event.key === 'd') {
            this.overlay.style.display = 
                this.overlay.style.display === 'block' ? 'none' : 'block';
        }
    }
    
    static showPositions() {
        console.group('Desktop Icon Positions');
        document.querySelectorAll('desktop-icon').forEach(icon => {
            const label = icon.getAttribute('label');
            const posX = icon.getAttribute('position-x');
            const posY = icon.getAttribute('position-y');
            
            let computedPos = { left: 'unknown', top: 'unknown' };
            if (icon.shadowRoot) {
                const iconEl = icon.shadowRoot.querySelector('.desktop-icon');
                if (iconEl) {
                    const style = window.getComputedStyle(iconEl);
                    computedPos = { 
                        left: style.left, 
                        top: style.top 
                    };
                }
            }
            
            console.log(`${label}: Attr(${posX}, ${posY}) Computed(${computedPos.left}, ${computedPos.top})`);
        });
        console.groupEnd();
    }
}

// Initialize the debugger
const positionDebugger = new PositionDebugger();

// Expose global function
window.showPositions = PositionDebugger.showPositions;

export default positionDebugger;
