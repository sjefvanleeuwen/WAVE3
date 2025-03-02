/**
 * Folder Tree Component
 * Renders and manages the folder hierarchy in the explorer
 */
import filesystemService from '../../../services/filesystem/service.js';

class FolderTree {
    /**
     * Create a new folder tree component
     * @param {object} options - Configuration options
     * @param {Function} options.onFolderSelect - Callback when a folder is selected
     */
    constructor(options = {}) {
        this.element = document.createElement('div');
        this.element.className = 'folder-tree';
        this.onFolderSelect = options.onFolderSelect || (() => {});
        this.maxDepth = options.maxDepth || 3;
    }
    
    /**
     * Get the folder tree element
     * @returns {HTMLElement} The folder tree element
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Update the folder tree with the current path
     * @param {string} currentPath - The currently selected path
     */
    update(currentPath) {
        try {
            // Get root directory structure for the tree
            const tree = this._buildDirectoryTree();
            
            // Create HTML for the tree
            this.element.innerHTML = this._generateFolderTreeHTML(tree, currentPath);
            
            // Add click handlers
            this._setupEventListeners();
            
        } catch (error) {
            console.error('Error building folder tree:', error);
            this.element.innerHTML = `
                <div class="error-message">
                    Error loading folder structure: ${error.message || 'Unknown error'}
                </div>
            `;
        }
    }
    
    /**
     * Add event listeners to folder nodes
     */
    _setupEventListeners() {
        // Add click event listeners to folder nodes
        this.element.querySelectorAll('.folder-node').forEach(node => {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                const path = node.dataset.path;
                this.onFolderSelect(path);
            });
        });
    }
    
    /**
     * Build a directory tree structure for folder navigation
     * @param {string} path - Starting path for the tree 
     * @param {number} depth - Current depth in the tree
     * @param {number} maxDepth - Maximum depth to build
     * @returns {Array} Tree structure
     */
    _buildDirectoryTree(path = '/', depth = 0, maxDepth = this.maxDepth) {
        if (depth > maxDepth) return null;
        
        try {
            const contents = filesystemService.listDirectory(path);
            const directories = contents.filter(item => item.type === 'directory');
            
            const children = directories.map(dir => {
                return {
                    name: dir.name,
                    path: dir.path,
                    children: depth < maxDepth ? this._buildDirectoryTree(dir.path, depth + 1, maxDepth) : null
                };
            });
            
            return children;
        } catch (error) {
            console.error(`Error building directory tree for ${path}:`, error);
            return [];
        }
    }
    
    /**
     * Generate HTML for the folder tree
     * @param {Array} tree - The tree data structure 
     * @param {string} currentPath - The currently selected path
     * @param {number} level - Current indentation level
     * @returns {string} HTML representation of the tree
     */
    _generateFolderTreeHTML(tree, currentPath, level = 0) {
        if (!tree || tree.length === 0) return '';
        
        let html = '';
        tree.forEach(item => {
            // Determine if this folder is active (part of the current path)
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
            
            html += `
                <div class="folder-node ${isActive ? 'active' : ''}" 
                     data-path="${item.path}"
                     style="padding-left: ${level * 15}px; cursor: pointer !important;"
                     onmouseover="this.style.cursor='pointer'">
                    <span style="cursor: pointer !important; user-select: none;">📁 ${item.name}</span>
                </div>
            `;
            
            // Add children if they exist and this folder is in the active path
            if (item.children && (isActive || level < 1)) {
                html += this._generateFolderTreeHTML(item.children, currentPath, level + 1);
            }
        });
        
        return html;
    }
}

export default FolderTree;
