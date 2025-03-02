/**
 * File Operations
 * Provides file operations like open, delete, create, etc.
 */
import filesystemService from '../../../services/filesystem/service.js';
import { isImageFile, isVideoFile, isAudioFile, getFileExtension } from '../utils/file-type-utils.js';

/**
 * Open and display a file in a popup
 * @param {object} file - File object to open
 */
export function openFile(file) {
    try {
        const content = filesystemService.readFile(file.path);
        
        // Create a popup to show file contents
        const popup = _createFileViewerPopup(file, content);
        
        // Add to document
        document.body.appendChild(popup);
        
    } catch (error) {
        console.error(`Error opening file ${file.path}:`, error);
        alert(`Error opening file: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Delete a file or directory
 * @param {object} item - File or directory to delete
 * @returns {boolean} True if deletion was successful
 */
export function deleteItem(item) {
    const isDirectory = item.type === 'directory';
    const message = isDirectory 
        ? `Are you sure you want to delete the folder "${item.name}" and all its contents?`
        : `Are you sure you want to delete "${item.name}"?`;
        
    if (confirm(message)) {
        try {
            filesystemService.delete(item.path);
            return true;
        } catch (error) {
            console.error(`Error deleting ${item.path}:`, error);
            alert(`Error deleting ${isDirectory ? 'folder' : 'file'}: ${error.message || 'Unknown error'}`);
            return false;
        }
    }
    return false;
}

/**
 * Create a file viewer popup based on file type
 * @param {object} file - File object to display
 * @param {string} content - File content
 * @returns {HTMLElement} Popup element
 */
function _createFileViewerPopup(file, content) {
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
    if (isImageFile(file.name)) {
        // Image file
        const extension = getFileExtension(file.name);
        contentArea.innerHTML = `
            <img src="data:image/${extension};base64,${content}" 
                 style="max-width:100%; max-height:100%;" alt="${file.name}">
        `;
    } else if (isVideoFile(file.name)) {
        // Video file
        const extension = getFileExtension(file.name);
        contentArea.innerHTML = `
            <video controls style="max-width:100%; max-height:100%;">
                <source src="data:video/${extension};base64,${content}" type="video/${extension}">
                Your browser does not support the video tag.
            </video>
        `;
    } else if (isAudioFile(file.name)) {
        // Audio file
        const extension = getFileExtension(file.name);
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
    
    // Add close handler
    popup.querySelector('#close-btn').addEventListener('click', () => {
        popup.remove();
    });
    
    return popup;
}

/**
 * Create a new directory
 * @param {string} parentPath - Path of the parent directory
 * @param {string} name - Name of the new directory
 * @returns {boolean} True if creation was successful
 */
export function createDirectory(parentPath, name) {
    try {
        const newPath = `${parentPath}/${name}`.replace(/\/\//g, '/');
        filesystemService.createDirectory(newPath);
        return true;
    } catch (error) {
        console.error(`Error creating directory ${name}:`, error);
        alert(`Error creating folder: ${error.message || 'Unknown error'}`);
        return false;
    }
}

/**
 * Create a new file
 * @param {string} parentPath - Path of the parent directory
 * @param {string} name - Name of the new file
 * @param {string} content - Initial content of the file
 * @returns {boolean} True if creation was successful
 */
export function createFile(parentPath, name, content = '') {
    try {
        const newPath = `${parentPath}/${name}`.replace(/\/\//g, '/');
        filesystemService.writeFile(newPath, content);
        return true;
    } catch (error) {
        console.error(`Error creating file ${name}:`, error);
        alert(`Error creating file: ${error.message || 'Unknown error'}`);
        return false;
    }
}

/**
 * Improve the uploadFile function with better error handling
 */

/**
 * Upload a file to the filesystem
 * @param {string} directoryPath - Directory to upload to
 * @param {string} fileName - Name of the file
 * @param {string|ArrayBuffer} content - File content
 * @returns {boolean} True if upload was successful
 */
export function uploadFile(directoryPath, fileName, content) {
    try {
        console.log(`Uploading ${fileName} to ${directoryPath}`);
        
        // If the content is a DataURL, extract the base64 part
        if (typeof content === 'string' && content.startsWith('data:')) {
            // Extract base64 data from DataURL
            const base64Content = content.split(',')[1];
            content = base64Content;
        }
        
        // Ensure the directory path ends with a slash
        const dirPath = directoryPath.endsWith('/') 
            ? directoryPath 
            : directoryPath + '/';
        
        // Create the full file path and normalize it
        const filePath = (dirPath + fileName).replace(/\/\//g, '/');
        
        // Write file to filesystem
        const result = filesystemService.writeFile(filePath, content);
        console.log(`Upload completed for ${fileName}`);
        
        return result;
    } catch (error) {
        console.error(`Error uploading file ${fileName} to ${directoryPath}:`, error);
        throw error;
    }
}