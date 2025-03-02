/**
 * Details Panel Component
 * Shows detailed information for selected files and folders
 */
import filesystemService from '../../../services/filesystem/service.js';
import { getFileType, formatSize } from '../utils/file-type-utils.js';

class DetailsPanel {
    /**
     * Create a new details panel component
     * @param {object} options - Configuration options
     * @param {Function} options.onOpen - Callback when open/view button is clicked
     * @param {Function} options.onDelete - Callback when delete button is clicked
     */
    constructor(options = {}) {
        this.element = document.createElement('div');
        this.element.className = 'file-details';
        
        this.onOpen = options.onOpen || (() => {});
        this.onDelete = options.onDelete || (() => {});
    }
    
    /**
     * Get the details panel element
     * @returns {HTMLElement} The details panel element
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Update the details panel with item information
     * @param {object|null} item - The selected item or null to show empty state
     */
    update(item) {
        if (!item) {
            this._showEmptyState();
            return;
        }
        
        try {
            // Check if getInfo exists, otherwise use the item directly
            let details = item;
            
            if (typeof filesystemService.getInfo === 'function') {
                try {
                    details = filesystemService.getInfo(item.path);
                } catch (e) {
                    console.warn(`getInfo failed, falling back to item data: ${e.message}`);
                }
            }
            
            // Format creation and modification dates
            const created = details.created ? new Date(details.created).toLocaleString() : 'Unknown';
            const modified = details.modified ? new Date(details.modified).toLocaleString() : 'Unknown';
            
            // Format file size
            const size = item.type === 'file' ? formatSize(details.size || 0) : '--';
            
            this.element.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${details.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${item.type === 'directory' ? 'Folder' : getFileType(details.name)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Size:</span>
                    <span class="detail-value">${size}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Path:</span>
                    <span class="detail-value">${details.path || 'Unknown'}</span>
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
                        : '<button id="open-file-btn">View</button>'}
                    <button id="delete-btn">Delete</button>
                </div>
            `;
            
            this._setupEventListeners(item);
            
        } catch (error) {
            console.error(`Error showing details for ${item.path}:`, error);
            
            // Show simplified details using only the item data
            this.element.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${item.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${item.type === 'directory' ? 'Folder' : getFileType(item.name)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Path:</span>
                    <span class="detail-value">${item.path}</span>
                </div>
                
                <div class="action-buttons">
                    ${item.type === 'directory' 
                        ? '<button id="open-folder-btn">Open</button>' 
                        : '<button id="open-file-btn">View</button>'}
                    <button id="delete-btn">Delete</button>
                </div>
            `;
            
            this._setupEventListeners(item);
        }
    }
    
    /**
     * Show empty state when no item is selected
     */
    _showEmptyState() {
        this.element.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">No item selected</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Size:</span>
                <span class="detail-value">-</span>
        `;
    }
    
    /**
     * Set up event listeners for the action buttons
     * @param {object} item - The selected item
     */
    _setupEventListeners(item) {
        // Set up open/view button
        const openBtn = this.element.querySelector('#open-folder-btn, #open-file-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.onOpen(item);
            });
        }
        
        // Set up delete button
        const deleteBtn = this.element.querySelector('#delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.onDelete(item);
            });
        }
    }
}

export default DetailsPanel;
