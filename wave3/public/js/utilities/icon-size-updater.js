/**
 * Utility for updating all desktop icon sizes
 */
class IconSizeUpdater {
    constructor() {
        this.defaultSize = 96; // The new default size
        this.initialize();
    }

    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.updateAllIcons());
        } else {
            this.updateAllIcons();
        }
    }

    updateAllIcons() {
        console.log("Updating all icons to 96x96 size");
        
        setTimeout(() => {
            document.querySelectorAll('desktop-icon').forEach(icon => {
                // Set the size attribute if not already set
                if (!icon.hasAttribute('size')) {
                    icon.setAttribute('size', this.defaultSize);
                }
                
                // Force a refresh of the component's shadow DOM
                if (icon.updateIconSize) {
                    icon.updateIconSize();
                }
                
                // Adjust the icon position if needed to accommodate the new size
                const posX = parseInt(icon.getAttribute('position-x'));
                const posY = parseInt(icon.getAttribute('position-y'));
                
                // Update the position in the DOM directly
                if (icon.shadowRoot) {
                    const iconElement = icon.shadowRoot.querySelector('.desktop-icon');
                    if (iconElement) {
                        iconElement.style.width = "120px";
                        iconElement.style.height = "140px";
                        
                        const wrapper = iconElement.querySelector('.icon-wrapper');
                        const img = iconElement.querySelector('.icon-image');
                        
                        if (wrapper && img) {
                            wrapper.style.width = `${this.defaultSize}px`;
                            wrapper.style.height = `${this.defaultSize}px`;
                            img.style.width = `${this.defaultSize}px`;
                            img.style.height = `${this.defaultSize}px`;
                        }
                    }
                }
            });
        }, 500); // Wait for components to be fully defined
    }
}

// Initialize the updater
const iconSizeUpdater = new IconSizeUpdater();
export default iconSizeUpdater;
