/**
 * Explorer Navigation
 * Handles navigation history, path manipulation, and directory traversal
 */

class ExplorerNavigation {
    /**
     * Create a new navigation manager
     */
    constructor() {
        this.currentPath = '/';
        this.history = ['/'];
        this.historyIndex = 0;
    }
    
    /**
     * Navigate to a specific path
     * @param {string} path - The target path
     * @returns {object} Navigation state
     */
    navigateTo(path) {
        // Update history if it's a new path
        if (path !== this.currentPath) {
            // If navigating from a point in history, trim the forward history
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            
            // Add new path to history
            this.history.push(path);
            this.historyIndex = this.history.length - 1;
            this.currentPath = path;
        }
        
        // Return updated navigation state
        return this.getState();
    }
    
    /**
     * Go back in history
     * @returns {string|null} The previous path or null if can't go back
     */
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.currentPath = this.history[this.historyIndex];
            return this.currentPath;
        }
        return null;
    }
    
    /**
     * Go forward in history
     * @returns {string|null} The next path or null if can't go forward
     */
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.currentPath = this.history[this.historyIndex];
            return this.currentPath;
        }
        return null;
    }
    
    /**
     * Go up one level in the directory hierarchy
     * @returns {string|null} The parent path or null if at root
     */
    goUp() {
        if (this.currentPath === '/') return null;
        
        // Get parent path
        const parts = this.currentPath.split('/').filter(p => p);
        parts.pop();
        const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}/`;
        
        // Navigate to parent path
        return this.navigateTo(parentPath).currentPath;
    }
    
    /**
     * Get current navigation state
     * @returns {object} Navigation state
     */
    getState() {
        return {
            currentPath: this.currentPath,
            canGoBack: this.historyIndex > 0,
            canGoForward: this.historyIndex < this.history.length - 1,
            canGoUp: this.currentPath !== '/'
        };
    }
}

export default ExplorerNavigation;
