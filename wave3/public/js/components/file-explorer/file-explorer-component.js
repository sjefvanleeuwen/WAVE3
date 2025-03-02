/**
 * File Explorer Component
 * A web component that provides a file system explorer interface
 * Integrated with the existing filesystem service
 */

// Import the filesystem service
import filesystemService from '../../services/filesystem/service.js';

class FileExplorerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // State
        this.currentPath = '/';  // Start at root
        this.history = ['/'];
        this.historyIndex = 0;
        this.selectedFile = null;
    }

    connectedCallback() {
        this.render();
        // Wait for components to be registered
        setTimeout(() => this.initialize(), 500);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                
                /* File explorer specific styles */
                .explorer-toolbar {
                    padding: 5px;
                    background-color: #f0f0f0;
                    border-bottom: 1px solid #ddd;
                }
                
                .explorer-toolbar button {
                    padding: 4px 8px;
                    margin-right: 4px;
                    background-color: #fff;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                }
                
                .path-bar {
                    margin: 5px 0;
                    padding: 4px 8px;
                    background-color: #fff;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                }
                
                .folder-tree {
                    font-size: 14px;
                    line-height: 1.5;
                }
                
                .folder-node {
                    padding: 2px 5px;
                    cursor: pointer;
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                }
                
                .folder-node:hover {
                    background-color: #e9ecef;
                }
                
                .folder-node.active {
                    background-color: #007bff;
                    color: white;
                }
                
                .file-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 10px;
                    align-content: flex-start;
                }
                
                .file-item {
                    width: 80px;
                    height: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    padding: 5px;
                    box-sizing: border-box;
                    border-radius: 4px;
                }
                
                .file-item:hover {
                    background-color: #e9ecef;
                }
                
                .file-item.selected {
                    background-color: #e2eeff;
                }
                
                .file-icon {
                    width: 48px;
                    height: 48px;
                    margin-bottom: 5px;
                }
                
                .file-name {
                    font-size: 12px;
                    text-align: center;
                    word-break: break-word;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }
                
                .file-details {
                    padding: 10px;
                    font-size: 13px;
                }
                
                .detail-row {
                    margin-bottom: 8px;
                }
                
                .detail-label {
                    font-weight: bold;
                    margin-right: 5px;
                }
                
                /* Additional styles for filesystem integration */
                .breadcrumb {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px;
                }
                
                .breadcrumb-item {
                    cursor: pointer;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                
                .breadcrumb-item:hover {
                    background-color: rgba(0,0,0,0.05);
                }
                
                .breadcrumb-separator {
                    color: #777;
                }
                
                .action-buttons {
                    margin-top: 10px;
                    display: flex;
                    gap: 5px;
                }
                
                .error-message {
                    color: #d9534f;
                    padding: 10px;
                    background-color: rgba(217, 83, 79, 0.1);
                    border-radius: 4px;
                    margin: 10px;
                }
                
                .empty-folder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100px;
                    color: #777;
                    font-style: italic;
                }
            </style>
            
            <panel-container id="file-explorer-main">
                <!-- Will be filled programmatically -->
            </panel-container>
        `;
    }

    initialize() {
        const explorerContainer = this.shadowRoot.querySelector('#file-explorer-main');
        if (!explorerContainer) {
            console.error('File explorer container not found');
            return;
        }
        
        // Check if the panel API is available
        if (typeof explorerContainer.addPanel !== 'function') {
            console.error('Panel container component not fully initialized. Retrying...');
            // Retry after a delay
            setTimeout(() => this.initialize(), 500);
            return;
        }
        
        // Create upper panel (toolbar)
        const toolbarPanel = document.createElement('div');
        toolbarPanel.className = 'explorer-toolbar';
        toolbarPanel.innerHTML = `
            <button id="back-btn" title="Go back">← Back</button>
            <button id="forward-btn" title="Go forward">→ Forward</button>
            <button id="up-btn" title="Go up one level">↑ Up</button>
            <button id="refresh-btn" title="Refresh">⟳ Refresh</button>
            <div class="path-bar">
                <div class="breadcrumb" id="path-breadcrumb"></div>
            </div>
        `;
        
        // Store reference to important elements
        this.backBtn = toolbarPanel.querySelector('#back-btn');
        this.forwardBtn = toolbarPanel.querySelector('#forward-btn');
        this.upBtn = toolbarPanel.querySelector('#up-btn');
        this.refreshBtn = toolbarPanel.querySelector('#refresh-btn');
        this.pathBreadcrumb = toolbarPanel.querySelector('#path-breadcrumb');
        
        // Add event listeners for toolbar buttons
        this.backBtn.addEventListener('click', () => this.goBack());
        this.forwardBtn.addEventListener('click', () => this.goForward());
        this.upBtn.addEventListener('click', () => this.goUp());
        this.refreshBtn.addEventListener('click', () => this.refresh());
        
        // Add toolbar to the top region
        explorerContainer.addPanel(toolbarPanel, 'top', {
            title: 'Navigation',
            collapsible: true
        });
        
        // Create a nested panel container for the main content area
        const contentPanel = document.createElement('nested-panel');
        
        // Add the nested panel to the center region
        const contentPanelRef = explorerContainer.addPanel(contentPanel, 'center');
        
        // Wait for the nested panel to be connected
        setTimeout(() => {
            // Access the nested panel container
            const contentContainer = contentPanel.panelContainer;
            if (!contentContainer) {
                console.error('Nested panel container not found');
                setTimeout(() => this.initialize(), 500);
                return;
            }
            
            // Create folder tree view for left panel
            this.folderTreePanel = document.createElement('div');
            this.folderTreePanel.className = 'folder-tree';
            
            // Create file list view for center panel
            this.fileListPanel = document.createElement('div');
            this.fileListPanel.className = 'file-list';
            
            // Create details panel for right panel
            this.fileDetailsPanel = document.createElement('div');
            this.fileDetailsPanel.className = 'file-details';
            this._updateDetailsPanel(null);
            
            // Add the panels to the nested container
            contentContainer.addPanel(this.folderTreePanel, 'left', {
                title: 'Folders',
                closable: false,
                collapsible: true
            });
            
            contentContainer.addPanel(this.fileListPanel, 'center', {
                title: 'Files',
                closable: false
            });
            
            contentContainer.addPanel(this.fileDetailsPanel, 'right', {
                title: 'Details',
                closable: false,
                collapsible: true
            });
            
            // Load the initial directory
            this.loadDirectory(this.currentPath);
        }, 200);
    }
    
    /**
     * Load a directory and update the file explorer
     */
    loadDirectory(path) {
        try {
            // Get directory contents from filesystem service
            const contents = filesystemService.listDirectory(path);
            
            // Update current path and history
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
            
            // Update UI elements
            this._updateBreadcrumb(path);
            this._updateFolderTree(path);
            this._updateFileList(contents);
            this._updateButtonStates();
            
            // Clear selected file
            this.selectedFile = null;
            this._updateDetailsPanel(null);
        } catch (error) {
            console.error(`Error loading directory ${path}:`, error);
            this.fileListPanel.innerHTML = `
                <div class="error-message">
                    Error loading directory: ${error.message || 'Unknown error'}
                </div>
            `;
        }
    }
    
    /**
     * Update the breadcrumb navigation
     */
    _updateBreadcrumb(path) {
        // Split the path into segments
        const segments = path.split('/').filter(segment => segment);
        
        // Create breadcrumb HTML
        let html = `<span class="breadcrumb-item" data-path="/">Root</span>`;
        
        // Build path progressively to create each breadcrumb segment
        let currentPath = '/';
        segments.forEach((segment, index) => {
            html += `<span class="breadcrumb-separator">/</span>`;
            currentPath += segment + '/';
            html += `<span class="breadcrumb-item" data-path="${currentPath}">${segment}</span>`;
        });
        
        this.pathBreadcrumb.innerHTML = html;
        
        // Add click event listeners to breadcrumb items
        this.pathBreadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadDirectory(item.dataset.path);
            });
        });
    }
    
    /**
     * Update the folder tree
     */
    _updateFolderTree(currentPath) {
        try {
            // Get root directory structure for the tree
            const tree = this._buildDirectoryTree();
            
            // Create HTML for the tree
            this.folderTreePanel.innerHTML = this._generateFolderTreeHTML(tree, currentPath);
            
            // Add click handlers for folder navigation
            this.folderTreePanel.querySelectorAll('.folder-node').forEach(node => {
                node.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const path = node.dataset.path;
                    this.loadDirectory(path);
                });
            });
        } catch (error) {
            console.error('Error building folder tree:', error);
            this.folderTreePanel.innerHTML = `
                <div class="error-message">
                    Error loading folder structure: ${error.message || 'Unknown error'}
                </div>
            `;
        }
    }
    
    /**
     * Build a directory tree structure for folder navigation
     * Limits depth to prevent excessive recursion
     */
    _buildDirectoryTree(path = '/', depth = 0, maxDepth = 3) {
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
                     style="padding-left: ${level * 15}px">
                    <span>📁 ${item.name}</span>
                </div>
            `;
            
            // Add children if they exist and this folder is in the active path
            if (item.children && (isActive || level < 1)) {
                html += this._generateFolderTreeHTML(item.children, currentPath, level + 1);
            }
        });
        
        return html;
    }
    
    /**
     * Update the file list with contents from the current directory
     */
    _updateFileList(contents) {
        // Clear existing content
        this.fileListPanel.innerHTML = '';
        
        if (!contents || contents.length === 0) {
            this.fileListPanel.innerHTML = `
                <div class="empty-folder">
                    This folder is empty
                </div>
            `;
            return;
        }
        
        // Sort contents: directories first, then files alphabetically
        contents.sort((a, b) => {
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
        
        // Create elements for each item
        contents.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'file-item';
            itemElement.dataset.path = item.path;
            
            // Determine icon based on type
            let icon = item.type === 'directory' ? '📁' : this._getFileIcon(item.name);
            
            itemElement.innerHTML = `
                <div class="file-icon">${icon}</div>
                <div class="file-name">${item.name}</div>
            `;
            
            // Add click handler for selection
            itemElement.addEventListener('click', () => {
                this._selectItem(item, itemElement);
            });
            
            // Add double click handler for directories
            if (item.type === 'directory') {
                itemElement.addEventListener('dblclick', () => {
                    this.loadDirectory(item.path);
                });
            } else {
                // Double click to open files
                itemElement.addEventListener('dblclick', () => {
                    this._openFile(item);
                });
            }
            
            this.fileListPanel.appendChild(itemElement);
        });
    }
    
    /**
     * Select a file or directory
     */
    _selectItem(item, element) {
        // Remove selected class from all items
        this.shadowRoot.querySelectorAll('.file-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selected class to the clicked item
        element.classList.add('selected');
        
        // Store the selected item
        this.selectedFile = item;
        
        // Update details panel
        this._updateDetailsPanel(item);
    }
    
    /**
     * Update the details panel with item information
     */
    _updateDetailsPanel(item) {
        if (!item) {
            this.fileDetailsPanel.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">No item selected</span>
                </div>
            `;
            return;
        }
        
        try {
            // Get more detailed file information from filesystem service
            const details = filesystemService.getInfo(item.path);
            
            // Format creation and modification dates
            const created = new Date(details.created).toLocaleString();
            const modified = new Date(details.modified).toLocaleString();
            
            // Format file size
            const size = item.type === 'file' ? this._formatSize(details.size) : '--';
            
            this.fileDetailsPanel.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${details.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${item.type === 'directory' ? 'Folder' : this._getFileType(details.name)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Size:</span>
                    <span class="detail-value">${size}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Path:</span>
                    <span class="detail-value">${details.path}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${created}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Modified:</span>
                    <span class="detail-value">${modified}</span>
                </div>
                
                <div class="action-buttons">
                    ${item.type === 'directory' 
                        ? '<button id="open-folder-btn">Open</button>' 
                        : '<button id="open-file-btn">Open</button>'}
                    <button id="delete-btn">Delete</button>
                </div>
            `;
            
            // Add event listeners to buttons
            if (item.type === 'directory') {
                this.fileDetailsPanel.querySelector('#open-folder-btn').addEventListener('click', () => {
                    this.loadDirectory(item.path);
                });
            } else {
                this.fileDetailsPanel.querySelector('#open-file-btn').addEventListener('click', () => {
                    this._openFile(item);
                });
            }
            
            this.fileDetailsPanel.querySelector('#delete-btn').addEventListener('click', () => {
                this._deleteItem(item);
            });
            
        } catch (error) {
            console.error(`Error getting details for ${item.path}:`, error);
            this.fileDetailsPanel.innerHTML = `
                <div class="error-message">
                    Error loading item details: ${error.message || 'Unknown error'}
                </div>
            `;
        }
    }
    
    /**
     * Format file size in human-readable form
     */
    _formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Get an icon for a file based on its extension
     */
    _getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        const icons = {
            // Document icons
            'txt': '📄', 'pdf': '📕', 'doc': '📘', 'docx': '📘',
            'xls': '📊', 'xlsx': '📊', 'ppt': '📑', 'pptx': '📑',
            
            // Image icons
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 
            'bmp': '🖼️', 'svg': '🖼️',
            
            // Code icons
            'js': '📝', 'ts': '📝', 'html': '🌐', 'css': '🎨',
            'json': '⚙️', 'xml': '📋', 'md': '📝',
            
            // Archive icons
            'zip': '📦', 'rar': '📦', 'tar': '📦', 'gz': '📦',
            
            // Media icons
            'mp3': '🎵', 'wav': '🎵', 'mp4': '🎬', 'avi': '🎬',
            'mov': '🎬', 'mkv': '🎬'
        };
        
        return icons[extension] || '📄';
    }
    
    /**
     * Get a descriptive file type based on extension
     */
    _getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        const types = {
            // Documents
            'txt': 'Text Document',
            'pdf': 'PDF Document',
            'doc': 'Word Document',
            'docx': 'Word Document',
            'xls': 'Excel Spreadsheet',
            'xlsx': 'Excel Spreadsheet',
            'ppt': 'PowerPoint Presentation',
            'pptx': 'PowerPoint Presentation',
            
            // Images
            'jpg': 'JPEG Image',
            'jpeg': 'JPEG Image',
            'png': 'PNG Image',
            'gif': 'GIF Image',
            'bmp': 'Bitmap Image',
            'svg': 'SVG Vector Image',
            
            // Code
            'js': 'JavaScript File',
            'ts': 'TypeScript File',
            'html': 'HTML Document',
            'css': 'CSS Stylesheet',
            'json': 'JSON Data File',
            'xml': 'XML Document',
            'md': 'Markdown Document',
            
            // Archives
            'zip': 'ZIP Archive',
            'rar': 'RAR Archive',
            'tar': 'TAR Archive',
            'gz': 'GZip Archive',
            
            // Media
            'mp3': 'MP3 Audio',
            'wav': 'WAV Audio',
            'mp4': 'MP4 Video',
            'avi': 'AVI Video',
            'mov': 'QuickTime Video',
            'mkv': 'MKV Video'
        };
        
        return types[extension] || `${extension.toUpperCase()} File`;
    }
    
    /**
     * Open a file using the filesystem service
     */
    _openFile(file) {
        try {
            const content = filesystemService.readFile(file.path);
            
            // Create a popup to show file contents
            const popup = document.createElement('div');
            popup.style.position = 'fixed';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            popup.style.width = '80%';
            popup.style.height = '80%';
            popup.style.backgroundColor = 'white';
            popup.style.zIndex = '1000';
            popup.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
            popup.style.borderRadius = '5px';
            popup.style.display = 'flex';
            popup.style.flexDirection = 'column';
            
            // Header with file name and close button
            const header = document.createElement('div');
            header.style.padding = '10px';
            header.style.borderBottom = '1px solid #ddd';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.innerHTML = `
                <div>${file.name}</div>
                <button id="close-btn" style="background:none;border:none;cursor:pointer;font-size:20px;">×</button>
            `;
            
            // Content area with file contents
            const contentArea = document.createElement('div');
            contentArea.style.flex = '1';
            contentArea.style.padding = '10px';
            contentArea.style.overflow = 'auto';
            
            // Different display based on file type
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) {
                // Image file
                contentArea.innerHTML = `
                    <img src="data:image/${extension};base64,${content}" 
                         style="max-width:100%; max-height:100%;" alt="${file.name}">
                `;
            } else if (['mp4', 'webm', 'ogg'].includes(extension)) {
                // Video file
                contentArea.innerHTML = `
                    <video controls style="max-width:100%; max-height:100%;">
                        <source src="data:video/${extension};base64,${content}" type="video/${extension}">
                        Your browser does not support the video tag.
                    </video>
                `;
            } else if (['mp3', 'wav'].includes(extension)) {
                // Audio file
                contentArea.innerHTML = `
                    <audio controls style="width:100%;">
                        <source src="data:audio/${extension};base64,${content}" type="audio/${extension}">
                        Your browser does not support the audio tag.
                    </audio>
                `;
            } else {
                // Text file (default)
                contentArea.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${content}</pre>`;
            }
            
            popup.appendChild(header);
            popup.appendChild(contentArea);
            
            // Add to document
            document.body.appendChild(popup);
            
            // Add close handler
            popup.querySelector('#close-btn').addEventListener('click', () => {
                popup.remove();
            });
            
        } catch (error) {
            console.error(`Error opening file ${file.path}:`, error);
            alert(`Error opening file: ${error.message || 'Unknown error'}`);
        }
    }
    
    /**
     * Delete an item using the filesystem service
     */
    _deleteItem(item) {
        const isDirectory = item.type === 'directory';
        const message = isDirectory 
            ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
            : `Are you sure you want to delete "${item.name}"?`;
            
        if (confirm(message)) {
            try {
                filesystemService.delete(item.path);
                
                // Refresh the current directory
                this.refresh();
                
            } catch (error) {
                console.error(`Error deleting ${item.path}:`, error);
                alert(`Error deleting ${isDirectory ? 'folder' : 'file'}: ${error.message || 'Unknown error'}`);
            }
        }
    }
    
    /**
     * Navigation methods
     */
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadDirectory(this.history[this.historyIndex]);
        }
    }
    
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadDirectory(this.history[this.historyIndex]);
        }
    }
    
    goUp() {
        if (this.currentPath === '/') return;
        
        // Get parent path
        const parts = this.currentPath.split('/').filter(p => p);
        parts.pop();
        const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}/`;
        
        this.loadDirectory(parentPath);
    }
    
    refresh() {
        this.loadDirectory(this.currentPath);
    }
    
    /**
     * Update button states based on navigation history
     */
    _updateButtonStates() {
        // Back button enabled only if we have history to go back to
        this.backBtn.disabled = this.historyIndex <= 0;
        
        // Forward button enabled only if we have history to go forward to
        this.forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
        
        // Up button enabled only if we're not at the root
        this.upBtn.disabled = this.currentPath === '/';
    }
}

// Register the component
customElements.define('file-explorer', FileExplorerComponent);
