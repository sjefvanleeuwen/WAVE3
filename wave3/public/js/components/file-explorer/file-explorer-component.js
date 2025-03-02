/**
 * File Explorer Component
 * A web component that provides a file system explorer interface
 * Refactored for better separation of concerns
 */

// Import modules
import filesystemService from '../../services/filesystem/service.js';
import ExplorerToolbar from './components/explorer-toolbar.js';
import FolderTree from './components/folder-tree.js';
import FileList from './components/file-list.js';
import DetailsPanel from './components/details-panel.js';
import ExplorerNavigation from './navigation/explorer-navigation.js';
import * as FileOperations from './operations/file-operations.js';

class FileExplorerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Create navigation manager
        this.navigation = new ExplorerNavigation();
    }

    connectedCallback() {
        this.render();
        // Wait for components to be registered
        setTimeout(() => this.initialize(), 500);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Force pointer cursor styles that will override any other styles */
                .file-item, .folder-node, .breadcrumb-item, .action-buttons button, .explorer-toolbar button {
                    cursor: pointer !important;
                }
                
                .file-item *, .folder-node *, .breadcrumb-item * {
                    cursor: pointer !important;
                }
                
                /* Prevent text selection in clickable items */
                .file-name, .folder-node span, .breadcrumb-item {
                    user-select: none !important;
                }
            </style>
            <link rel="stylesheet" href="js/components/file-explorer/file-explorer-styles.css">
            <div class="file-explorer">
                <panel-container id="file-explorer-main">
                    <!-- Will be filled programmatically -->
                </panel-container>
            </div>
        `;
    }

    initialize() {
        // Get the panel container
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
        
        // Initialize the toolbar
        this._initializeToolbar(explorerContainer);
        
        // Create a nested panel container for the content panels
        this._initializeContentPanels(explorerContainer);
    }
    
    /**
     * Initialize the toolbar component
     * @param {HTMLElement} container - The container to add the toolbar to
     */
    _initializeToolbar(container) {
        // Create toolbar with navigation callback
        this.toolbar = new ExplorerToolbar({
            onNavigate: (action, path) => {
                switch (action) {
                    case 'back':
                        const prevPath = this.navigation.goBack();
                        if (prevPath) this._loadDirectory(prevPath);
                        break;
                    case 'forward':
                        const nextPath = this.navigation.goForward();
                        if (nextPath) this._loadDirectory(nextPath);
                        break;
                    case 'up':
                        const parentPath = this.navigation.goUp();
                        if (parentPath) this._loadDirectory(parentPath);
                        break;
                    case 'refresh':
                        this._loadDirectory(this.navigation.getState().currentPath);
                        break;
                    case 'path':
                        if (path) this._navigateTo(path);
                        break;
                }
            }
        });
        
        // Create toolbar element
        const toolbarElement = this.toolbar.create();
        
        // Add toolbar to container
        container.addPanel(toolbarElement, 'top', {
            title: 'Navigation',
            collapsible: true
        });
    }
    
    /**
     * Initialize content panels (folder tree, file list, details)
     * @param {HTMLElement} container - The container to add panels to
     */
    _initializeContentPanels(container) {
        // Create a nested panel for content
        const contentPanel = document.createElement('nested-panel');
        
        // Add the nested panel to the center region
        const contentPanelRef = container.addPanel(contentPanel, 'center');
        
        // Wait for nested panel to initialize
        setTimeout(() => {
            // Get the nested container
            const contentContainer = contentPanel.panelContainer;
            if (!contentContainer) {
                console.error('Nested panel container not found');
                setTimeout(() => this._initializeContentPanels(container), 500);
                return;
            }
            
            // Initialize folder tree
            this.folderTree = new FolderTree({
                onFolderSelect: (path) => {
                    this._navigateTo(path);
                }
            });
            
            // Initialize file list
            this.fileList = new FileList({
                onItemSelect: (item) => {
                    this.detailsPanel.update(item);
                },
                onItemOpen: (item) => {
                    if (item.type === 'directory') {
                        this._navigateTo(item.path);
                    } else {
                        FileOperations.openFile(item);
                    }
                },
                onFileUpload: (path) => {
                    // Refresh the directory after file upload
                    this._loadDirectory(path);
                }
            });
            
            // Initialize details panel
            this.detailsPanel = new DetailsPanel({
                onOpen: (item) => {
                    if (item.type === 'directory') {
                        this._navigateTo(item.path);
                    } else {
                        FileOperations.openFile(item);
                    }
                },
                onDelete: (item) => {
                    if (FileOperations.deleteItem(item)) {
                        this._loadDirectory(this.navigation.getState().currentPath);
                    }
                }
            });
            
            // Add all panels to the content container
            contentContainer.addPanel(this.folderTree.getElement(), 'left', {
                title: 'Folders',
                closable: false,
                collapsible: true
            });
            
            contentContainer.addPanel(this.fileList.getElement(), 'center', {
                title: 'Files',
                closable: false
            });
            
            contentContainer.addPanel(this.detailsPanel.getElement(), 'right', {
                title: 'Details',
                closable: false,
                collapsible: true
            });
            
            // Load the initial directory
            this._loadDirectory(this.navigation.getState().currentPath);
            
        }, 200);
    }
    
    /**
     * Navigate to a specific path
     * @param {string} path - Path to navigate to
     */
    _navigateTo(path) {
        // Update navigation state
        const state = this.navigation.navigateTo(path);
        // Load the directory contents
        this._loadDirectory(path);
    }
    
    /**
     * Load directory contents and update UI
     * @param {string} path - Path to load
     */
    _loadDirectory(path) {
        try {
            // Get directory contents from filesystem service
            const contents = filesystemService.listDirectory(path);
            
            // Update UI components
            this.toolbar.updateBreadcrumb(path);
            this.folderTree.update(path);
            this.fileList.update(contents, path);  // Pass path here
            
            // Update navigation button states
            const state = this.navigation.getState();
            this.toolbar.updateButtonStates(state);
            
            // Clear the details panel
            this.detailsPanel.update(null);
            
        } catch (error) {
            console.error(`Error loading directory ${path}:`, error);
            this.fileList.getElement().innerHTML = `
                <div class="error-message">
                    Error loading directory: ${error.message || 'Unknown error'}
                </div>
            `;
        }
    }
}

// Register the component
customElements.define('file-explorer', FileExplorerComponent);
