/**
 * File List Component
 * Displays files and folders in a grid layout with drag-and-drop upload
 */
import { getFileIcon } from '../utils/file-type-utils.js';
import * as FileOperations from '../operations/file-operations.js';

class FileList {
    /**
     * Create a new file list component
     * @param {object} options - Configuration options
     * @param {Function} options.onItemSelect - Callback when an item is selected
     * @param {Function} options.onItemOpen - Callback when an item is opened (double-clicked)
     * @param {Function} options.onFileUpload - Callback when files are uploaded
     */
    constructor(options = {}) {
        this.element = document.createElement('div');
        this.element.className = 'file-list';
        this.selectedItem = null;
        this.currentPath = '/';
        
        this.onItemSelect = options.onItemSelect || (() => {});
        this.onItemOpen = options.onItemOpen || (() => {});
        this.onFileUpload = options.onFileUpload || (() => {});
        
        // Initialize the drop zone
        this._initializeDropZone();
    }
    
    /**
     * Initialize drag and drop functionality
     */
    _initializeDropZone() {
        // Setup drop zone behavior
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.element.classList.add('drag-over');
        });
        
        this.element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.element.classList.remove('drag-over');
        });
        
        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.element.classList.remove('drag-over');
            
            // Handle dropped files
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this._handleFileUpload(e.dataTransfer.files);
            }
        });
    }
    
    /**
     * Handle file uploads
     * @param {FileList} files - The files to upload
     */
    _handleFileUpload(files) {
        // Show upload progress indicator
        this._showUploadStatus(`Uploading ${files.length} file(s)...`);
        
        // Process each file
        let uploadedCount = 0;
        const uploadPromises = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Read file as text or binary based on type
            const reader = new FileReader();
            
            const uploadPromise = new Promise((resolve, reject) => {
                reader.onload = (event) => {
                    const content = event.target.result;
                    
                    // Try to upload the file
                    try {
                        console.log(`Processing upload for ${file.name}`);
                        FileOperations.uploadFile(this.currentPath, file.name, content);
                        uploadedCount++;
                        resolve(file.name);
                    } catch (error) {
                        console.error(`Error in upload handler for ${file.name}:`, error);
                        errors.push({ file: file.name, error });
                        reject({ file: file.name, error });
                    }
                };
                
                reader.onerror = (error) => {
                    console.error(`Error reading file ${file.name}:`, error);
                    errors.push({ file: file.name, error: new Error('Failed to read file') });
                    reject({ file: file.name, error });
                };
            });
            
            // Read the file content with appropriate method based on type
            try {
                if (file.type.startsWith('text/') || 
                    file.type === 'application/json' || 
                    file.name.match(/\.(js|css|html|txt|md)$/i)) {
                    reader.readAsText(file);
                } else {
                    reader.readAsDataURL(file);
                }
            } catch (e) {
                console.error(`Error initiating file read for ${file.name}:`, e);
                errors.push({ file: file.name, error: e });
            }
            
            uploadPromises.push(uploadPromise);
        }
        
        // When all uploads are done, refresh the view
        Promise.allSettled(uploadPromises).then((results) => {
            const success = results.filter(r => r.status === 'fulfilled').length;
            const failures = results.filter(r => r.status === 'rejected').length;
            
            // Show errors in console for debugging
            if (errors.length > 0) {
                console.error('Upload errors:', errors);
            }
            
            // Update status message
            this._showUploadStatus(
                `Upload complete: ${success} file(s) uploaded successfully, ${failures} failed.`, 
                failures > 0 ? 'error' : 'success'
            );
            
            // Trigger callback to refresh directory
            if (success > 0) {
                this.onFileUpload(this.currentPath);
            }
            
            // Hide status after a delay
            setTimeout(() => {
                this._hideUploadStatus();
            }, 3000);
        }).catch(error => {
            console.error('Fatal error in upload process:', error);
            this._showUploadStatus('Upload failed: A system error occurred.', 'error');
        });
    }
    
    /**
     * Show upload status message
     * @param {string} message - The status message
     * @param {string} type - Message type (info, success, error)
     */
    _showUploadStatus(message, type = 'info') {
        // Remove any existing status element
        const existingStatus = this.element.querySelector('.upload-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Create status element
        const statusElement = document.createElement('div');
        statusElement.className = `upload-status ${type}`;
        statusElement.innerHTML = `
            <div class="status-message">${message}</div>
            <button class="status-close">×</button>
        `;
        
        // Add close button functionality
        statusElement.querySelector('.status-close').addEventListener('click', () => {
            statusElement.remove();
        });
        
        // Add to element
        this.element.appendChild(statusElement);
    }
    
    /**
     * Hide the upload status message
     */
    _hideUploadStatus() {
        const statusElement = this.element.querySelector('.upload-status');
        if (statusElement) {
            statusElement.classList.add('fade-out');
            setTimeout(() => {
                if (statusElement.parentElement === this.element) {
                    statusElement.remove();
                }
            }, 500); // Match this with CSS transition duration
        }
    }
    
    /**
     * Get the file list element
     * @returns {HTMLElement} The file list element
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Update the file list with new contents and path
     * @param {Array} contents - Array of file and folder objects
     * @param {string} path - Current directory path
     */
    update(contents, path = this.currentPath) {
        // Update current path
        this.currentPath = path;
        
        // Clear existing content
        this.element.innerHTML = '';
        
        // Add upload instruction element when folder is empty
        if (!contents || contents.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-folder';
            emptyState.innerHTML = `
                <div class="upload-hint">
                    <div class="upload-icon">📤</div>
                    <div class="upload-message">
                        This folder is empty.<br>
                        Drag and drop files here to upload.
                    </div>
                </div>
            `;
            this.element.appendChild(emptyState);
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
            this._createItemElement(item);
        });
        
        // Add a visible drop zone hint at the end
        const dropHint = document.createElement('div');
        dropHint.className = 'drop-zone-hint';
        dropHint.innerHTML = `
            <div class="drop-icon">📤</div>
            <div>Drop files here to upload</div>
        `;
        this.element.appendChild(dropHint);
    }
    
    /**
     * Create an element for a file or directory
     * @param {object} item - The file or directory object
     */
    _createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'file-item';
        itemElement.dataset.path = item.path;
        itemElement.style.cursor = 'pointer'; // Add inline style for cursor
        
        // Determine icon based on type
        let icon = item.type === 'directory' ? '📁' : getFileIcon(item.name);
        
        itemElement.innerHTML = `
            <div class="file-icon" style="cursor: pointer;">${icon}</div>
            <div class="file-name" style="cursor: pointer; user-select: none;">${item.name}</div>
        `;
        
        // Add click handler for selection
        itemElement.addEventListener('click', (e) => {
            this._selectItem(item, itemElement);
        });
        
        // Add double click handler
        itemElement.addEventListener('dblclick', () => {
            this.onItemOpen(item);
        });
        
        this.element.appendChild(itemElement);
    }
    
    /**
     * Select a file or directory
     * @param {object} item - The selected item
     * @param {HTMLElement} element - The DOM element representing the item
     */
    _selectItem(item, element) {
        // Remove selected class from all items
        this.element.querySelectorAll('.file-item').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selected class to the clicked item
        element.classList.add('selected');
        
        // Store the selected item
        this.selectedItem = item;
        
        // Trigger the selection callback
        this.onItemSelect(item);
    }
    
    /**
     * Clear the selection
     */
    clearSelection() {
        this.element.querySelectorAll('.file-item').forEach(el => {
            el.classList.remove('selected');
        });
        this.selectedItem = null;
    }
    
    /**
     * Get the currently selected item
     * @returns {object|null} The selected item or null if nothing is selected
     */
    getSelectedItem() {
        return this.selectedItem;
    }
}

export default FileList;
