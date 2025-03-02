/**
 * File Explorer Component
 * A web component that provides a file system explorer interface
 */
class FileExplorerComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
            <button>← Back</button>
            <button>→ Forward</button>
            <button>↑ Up</button>
            <button>⟳ Refresh</button>
            <div class="path-bar">
                <span>C:\\Users\\Documents\\</span>
            </div>
        `;
        
        // Add toolbar to the top region
        explorerContainer.addPanel(toolbarPanel, 'top', {
            title: 'Navigation',
            collapsible: true
        });
        
        // Create a nested panel container for the main content area
        const contentPanel = document.createElement('nested-panel');
        
        // Add the nested panel to the center region
        const contentPanelRef = explorerContainer.addPanel(contentPanel, 'center');
        
        // Access the nested panel container
        const contentContainer = contentPanel.panelContainer;
        if (!contentContainer) {
            console.error('Nested panel container not found');
            setTimeout(() => this.initialize(), 500);
            return;
        }
        
        // Create folder tree view for left panel
        const folderTreePanel = document.createElement('div');
        folderTreePanel.className = 'folder-tree';
        folderTreePanel.innerHTML = `
            <div class="folder-node active">
                <span>📁 Documents</span>
            </div>
            <div style="padding-left: 15px">
                <div class="folder-node">
                    <span>📁 Projects</span>
                </div>
                <div style="padding-left: 15px">
                    <div class="folder-node">
                        <span>📁 WAVE3</span>
                    </div>
                </div>
                <div class="folder-node">
                    <span>📁 Personal</span>
                </div>
            </div>
            <div class="folder-node">
                <span>📁 Pictures</span>
            </div>
            <div class="folder-node">
                <span>📁 Downloads</span>
            </div>
        `;
        
        // Create file list view for center panel
        const fileListPanel = document.createElement('div');
        fileListPanel.className = 'file-list';
        
        // Generate sample files
        const fileTypes = [
            { name: 'Document.docx', icon: '📄' },
            { name: 'Spreadsheet.xlsx', icon: '📊' },
            { name: 'Presentation.pptx', icon: '📑' },
            { name: 'Image.jpg', icon: '🖼️' },
            { name: 'Archive.zip', icon: '📦' },
            { name: 'Source Code.js', icon: '📝' },
            { name: 'Config.json', icon: '⚙️' },
            { name: 'Video.mp4', icon: '🎬' }
        ];
        
        fileTypes.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            fileElement.innerHTML = `
                <div class="file-icon">${file.icon}</div>
                <div class="file-name">${file.name}</div>
            `;
            fileElement.addEventListener('click', () => this.selectFile(file, fileElement, fileListPanel));
            fileListPanel.appendChild(fileElement);
        });
        
        // Create file details panel for right panel
        const fileDetailsPanel = document.createElement('div');
        fileDetailsPanel.className = 'file-details';
        fileDetailsPanel.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">Select a file</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Size:</span>
                <span class="detail-value">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Modified:</span>
                <span class="detail-value">-</span>
            </div>
        `;
        
        // Store reference to the details panel
        this.fileDetailsPanel = fileDetailsPanel;
        
        // Add the panels to the nested container
        contentContainer.addPanel(folderTreePanel, 'left', {
            title: 'Folders',
            closable: false,
            collapsible: true
        });
        
        contentContainer.addPanel(fileListPanel, 'center', {
            title: 'Files',
            closable: false
        });
        
        contentContainer.addPanel(fileDetailsPanel, 'right', {
            title: 'Details',
            closable: false,
            collapsible: true
        });
    }
    
    // Handle file selection
    selectFile(file, element, fileListPanel) {
        // Remove selected class from all files
        const allFileItems = this.shadowRoot.querySelectorAll('.file-item');
        allFileItems.forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selected class to clicked file
        element.classList.add('selected');
        
        // Update details panel
        this.fileDetailsPanel.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${file.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${file.name.split('.').pop().toUpperCase()} File</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Size:</span>
                <span class="detail-value">${Math.floor(Math.random() * 1000)} KB</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Created:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Modified:</span>
                <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
        `;
        
        // Dispatch file-selected event
        this.dispatchEvent(new CustomEvent('file-selected', {
            bubbles: true,
            composed: true,
            detail: { file }
        }));
    }
}

// Register the component
customElements.define('file-explorer', FileExplorerComponent);
