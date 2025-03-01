// Icon service for managing desktop icon positions
class IconService {
    constructor() {
        this.icons = new Map();
        this.clearInvalidPositions();
        this.loadIconPositions();
    }
    
    clearInvalidPositions() {
        try {
            const savedData = localStorage.getItem('desktop_icons');
            if (savedData) {
                const iconData = JSON.parse(savedData);
                let hasInvalidPositions = false;
                
                // Check for invalid positions
                Object.keys(iconData).forEach(key => {
                    const pos = iconData[key];
                    if (pos.x < 0 || pos.y < 0 || pos.x > 3000 || pos.y > 3000) {
                        console.log(`Found invalid position for ${key}: `, pos);
                        hasInvalidPositions = true;
                    }
                });
                
                if (hasInvalidPositions) {
                    console.log('Clearing invalid positions from localStorage');
                    localStorage.removeItem('desktop_icons');
                }
            }
        } catch (e) {
            console.error('Error checking positions, clearing localStorage:', e);
            localStorage.removeItem('desktop_icons');
        }
    }

    saveIconPosition(label, iconPath, x, y) {
        // Validate position values before saving
        if (x < 0 || y < 0 || x > 3000 || y > 3000 || isNaN(x) || isNaN(y)) {
            console.warn(`Invalid position detected for ${label}: x=${x}, y=${y}, using defaults`);
            x = 20;
            y = 20;
        }
        
        const iconKey = this.getIconKey(label, iconPath);
        console.log(`Saving position for ${iconKey}: x=${x}, y=${y}`);
        this.icons.set(iconKey, { x, y });
        this.persistIconPositions();
        
        // Force update on all matching icons in the DOM
        document.querySelectorAll('desktop-icon').forEach(icon => {
            if (icon.getAttribute('label') === label && icon.getAttribute('icon') === iconPath) {
                // Directly update the element's style
                if (icon.shadowRoot) {
                    const iconElement = icon.shadowRoot.querySelector('.desktop-icon');
                    if (iconElement) {
                        iconElement.style.left = `${x}px`;
                        iconElement.style.top = `${y}px`;
                    }
                }
            }
        });
    }

    getIconKey(label, iconPath) {
        // Create a unique key for the icon based on label and path
        return `${label}:${iconPath}`;
    }

    getIconPosition(label, iconPath) {
        const iconKey = this.getIconKey(label, iconPath);
        return this.icons.get(iconKey) || { x: null, y: null };
    }

    persistIconPositions() {
        // Save to localStorage
        const iconData = {};
        this.icons.forEach((position, key) => {
            iconData[key] = position;
        });
        const dataString = JSON.stringify(iconData);
        console.log('Saving positions to localStorage:', dataString);
        localStorage.setItem('desktop_icons', dataString);
    }

    loadIconPositions() {
        try {
            const savedData = localStorage.getItem('desktop_icons');
            console.log('Loading positions from localStorage:', savedData);
            if (savedData) {
                const iconData = JSON.parse(savedData);
                Object.keys(iconData).forEach(key => {
                    this.icons.set(key, iconData[key]);
                });
                console.log('Loaded icon positions:', this.icons);
            }
        } catch (e) {
            console.error('Failed to load icon positions:', e);
        }
    }

    applyStoredPositions() {
        console.log('Applying stored positions to icons');
        // Apply stored positions to all desktop icons in the DOM
        document.querySelectorAll('desktop-icon').forEach(icon => {
            const label = icon.getAttribute('label');
            const iconPath = icon.getAttribute('icon');
            const position = this.getIconPosition(label, iconPath);
            
            console.log(`Applying position for ${label}: `, position);
            
            // Only apply valid positions
            if (position.x !== null && position.y !== null && 
                position.x >= 0 && position.y >= 0 && 
                position.x < 3000 && position.y < 3000) {
                
                // Update the attributes with the stored position
                icon.setAttribute('position-x', position.x);
                icon.setAttribute('position-y', position.y);
                
                // Force icon to update its visual position
                setTimeout(() => {
                    // Force a refresh of the position
                    const currentPos = { 
                        x: parseInt(icon.getAttribute('position-x')),
                        y: parseInt(icon.getAttribute('position-y'))
                    };
                    icon.updatePosition && icon.updatePosition(currentPos);
                }, 50);
            } else if (!this.hasInitialPosition(icon)) {
                // Only set default position if no position is already set
                icon.setAttribute('position-x', '20');
                icon.setAttribute('position-y', '20');
            }
        });
    }
    
    hasInitialPosition(icon) {
        const x = icon.getAttribute('position-x');
        const y = icon.getAttribute('position-y');
        return x !== null && y !== null && !isNaN(parseInt(x)) && !isNaN(parseInt(y));
    }
    
    resetAllPositions() {
        // Reset all icons to default positions
        localStorage.removeItem('desktop_icons');
        this.icons.clear();
        document.querySelectorAll('desktop-icon').forEach(icon => {
            icon.setAttribute('position-x', '20');
            icon.setAttribute('position-y', '20');
        });
        console.log('All icon positions have been reset to defaults');
    }
    
    getAllIconsData() {
        const data = {};
        this.icons.forEach((pos, key) => {
            data[key] = pos;
        });
        return data;
    }
}

// Create and export the icon service instance
const iconService = new IconService();
export default iconService;
