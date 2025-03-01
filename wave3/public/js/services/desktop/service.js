import iconService from './icon-service.js';

// Desktop service for managing desktop state
class DesktopService {
    constructor() {
        this.iconService = iconService;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for icon moved events
        document.addEventListener('icon-moved', (event) => {
            console.log('Icon moved:', event.detail);
            this.iconService.saveIconPosition(
                event.detail.label,
                event.detail.icon,
                event.detail.x,
                event.detail.y
            );
        });

        // Apply positions when DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.iconService.applyStoredPositions();
            }, 200); // Increased delay to ensure components are ready
        });
    }
}

// Create and export the desktop service instance
const desktopService = new DesktopService();

// Expose a function for debugging
window.getDesktopIconsData = () => {
    return iconService.getAllIconsData();
};

export default desktopService;

// Reset positions if holding shift key during page load (for debugging)
window.addEventListener('load', (event) => {
    if (event.shiftKey) {
        console.log('Shift key detected on load, resetting all positions');
        iconService.resetAllPositions();
    } else {
        console.log('Window loaded, applying saved positions');
        // Apply with a slight delay to ensure DOM is ready
        setTimeout(() => {
            iconService.applyStoredPositions();
        }, 300);
    }
});

// Add a global method to reset positions
window.resetDesktopIcons = () => {
    iconService.resetAllPositions();
};
