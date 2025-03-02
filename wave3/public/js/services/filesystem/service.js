/**
 * FileSystemService - A service that provides file system operations using localStorage
 */
class FileSystemService {
    constructor(storageKey = 'wave_filesystem') {
        this.storageKey = storageKey;
        this.currentPath = '/';
        this.fs = this.loadFileSystem();
        
        // Automatically save changes
        this._setupAutoSave();
        
        console.log('FileSystem Service initialized');
    }
    
    /**
     * Initialize or load the file system structure
     */
    loadFileSystem() {
        try {
            const storedFS = localStorage.getItem(this.storageKey);
            
            if (storedFS) {
                return JSON.parse(storedFS);
            } else {
                // Create default file system structure
                const defaultFS = {
                    name: 'root',
                    type: 'directory',
                    path: '/',
                    children: {
                        'documents': {
                            name: 'documents',
                            type: 'directory',
                            path: '/documents',
                            children: {}
                        },
                        'pictures': {
                            name: 'pictures',
                            type: 'directory',
                            path: '/pictures',
                            children: {}
                        },
                        'readme.txt': {
                            name: 'readme.txt',
                            type: 'file',
                            path: '/readme.txt',
                            content: 'Welcome to WAVE3 File System!',
                            size: 30,
                            mimeType: 'text/plain',
                            created: Date.now(),
                            modified: Date.now()
                        }
                    },
                    created: Date.now(),
                    modified: Date.now()
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(defaultFS));
                return defaultFS;
            }
        } catch (error) {
            console.error('Error loading file system:', error);
            return this._createDefaultFS();
        }
    }
    
    /**
     * Creates a default file system in case of errors
     */
    _createDefaultFS() {
        return {
            name: 'root',
            type: 'directory',
            path: '/',
            children: {},
            created: Date.now(),
            modified: Date.now()
        };
    }
    
    /**
     * Set up auto-save on file system changes
     */
    _setupAutoSave() {
        this._saveTimeout = null;
        this._saveFileSystem = () => {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.fs));
                console.log('File system saved to localStorage');
            } catch (error) {
                console.error('Error saving file system:', error);
                if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                    console.error('LocalStorage quota exceeded. Cannot save file system.');
                    // Dispatch an event for the UI to show an error
                    document.dispatchEvent(new CustomEvent('filesystem-quota-exceeded'));
                }
            }
        };
    }
    
    /**
     * Queue a save operation to avoid excessive writes
     */
    _queueSave() {
        if (this._saveTimeout) {
            clearTimeout(this._saveTimeout);
        }
        
        this._saveTimeout = setTimeout(() => {
            this._saveFileSystem();
        }, 500); // Debounce saves to every 500ms
    }
    
    /**
     * Get node at specified path
     */
    getNode(path = this.currentPath) {
        if (path === '/') return this.fs;
        
        const parts = this._normalizePath(path).split('/').filter(p => p);
        let current = this.fs;
        
        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                throw new Error(`Path not found: ${path}`);
            }
            current = current.children[part];
        }
        
        return current;
    }
    
    /**
     * List contents of a directory
     */
    listDirectory(path = this.currentPath) {
        const dir = this.getNode(path);
        
        if (dir.type !== 'directory') {
            throw new Error(`Not a directory: ${path}`);
        }
        
        return Object.values(dir.children || {});
    }
    
    /**
     * Create a new file
     */
    createFile(name, content = '', path = this.currentPath, mimeType = 'text/plain') {
        const dir = this.getNode(path);
        
        if (dir.type !== 'directory') {
            throw new Error(`Cannot create file in non-directory: ${path}`);
        }
        
        if (dir.children[name]) {
            throw new Error(`File already exists: ${path}/${name}`);
        }
        
        const filePath = path === '/' ? `/${name}` : `${path}/${name}`;
        
        dir.children[name] = {
            name,
            type: 'file',
            path: filePath,
            content,
            size: content.length,
            mimeType,
            created: Date.now(),
            modified: Date.now()
        };
        
        dir.modified = Date.now();
        this._queueSave();
        
        return dir.children[name];
    }
    
    /**
     * Read a file's content
     */
    readFile(path) {
        const file = this.getNode(path);
        
        if (file.type !== 'file') {
            throw new Error(`Not a file: ${path}`);
        }
        
        return file.content;
    }
    
    /**
     * Update a file's content
     * @param {string} path - Path to the file
     * @param {string|ArrayBuffer} content - Content to write
     * @returns {boolean} True if successful
     */
    writeFile(path, content) {
        try {
            const parts = path.split('/').filter(p => p);
            const fileName = parts.pop();
            const parentPath = '/' + parts.join('/');
            
            // Fix: Use getNode instead of _getNodeByPath
            const parentNode = this.getNode(parentPath); 
            
            if (!parentNode.children) {
                parentNode.children = {};
            }
            
            // Determine file size based on content type
            let size = 0;
            if (typeof content === 'string') {
                size = content.length;
            } else if (content instanceof ArrayBuffer) {
                size = content.byteLength;
            } else if (content instanceof Uint8Array) {
                size = content.length;
            }
            
            // Create new file or update existing one
            parentNode.children[fileName] = {
                type: 'file',
                name: fileName,
                path: path,
                size: size,
                content: content,
                created: parentNode.children[fileName]?.created || new Date().toISOString(),
                modified: new Date().toISOString()
            };
            
            // Update parent modification time
            parentNode.modified = new Date().toISOString();
            
            // Save changes to localStorage
            this._queueSave();
            
            return true;
        } catch (error) {
            console.error(`Error writing file: ${path}`, error);
            throw error;
        }
    }
    
    /**
     * Create a new directory
     */
    createDirectory(name, path = this.currentPath) {
        const dir = this.getNode(path);
        
        if (dir.type !== 'directory') {
            throw new Error(`Cannot create directory in non-directory: ${path}`);
        }
        
        if (dir.children[name]) {
            throw new Error(`Directory already exists: ${path}/${name}`);
        }
        
        const dirPath = path === '/' ? `/${name}` : `${path}/${name}`;
        
        dir.children[name] = {
            name,
            type: 'directory',
            path: dirPath,
            children: {},
            created: Date.now(),
            modified: Date.now()
        };
        
        dir.modified = Date.now();
        this._queueSave();
        
        return dir.children[name];
    }
    
    /**
     * Delete a file or directory
     */
    delete(path) {
        if (path === '/') {
            throw new Error('Cannot delete root directory');
        }
        
        const parts = this._normalizePath(path).split('/').filter(p => p);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNode(parentPath);
        
        if (!parent.children[name]) {
            throw new Error(`Path not found: ${path}`);
        }
        
        delete parent.children[name];
        parent.modified = Date.now();
        this._queueSave();
        
        return true;
    }
    
    /**
     * Move a file or directory
     */
    move(sourcePath, destPath) {
        // Get the source node
        const node = this.getNode(sourcePath);
        
        // Copy the node to destination
        this._copyNode(node, destPath);
        
        // Delete the source
        this.delete(sourcePath);
        
        return true;
    }
    
    /**
     * Copy a file or directory
     */
    copy(sourcePath, destPath) {
        // Get the source node
        const node = this.getNode(sourcePath);
        
        // Copy the node to destination
        return this._copyNode(node, destPath);
    }
    
    /**
     * Helper to copy a node to a destination
     */
    _copyNode(node, destPath) {
        const destDir = this.getNode(destPath);
        if (destDir.type !== 'directory') {
            throw new Error(`Destination is not a directory: ${destPath}`);
        }
        
        // Check if destination already exists
        if (destDir.children[node.name]) {
            throw new Error(`Destination already exists: ${destPath}/${node.name}`);
        }
        
        // Create a deep copy of the node
        const nodeCopy = JSON.parse(JSON.stringify(node));
        
        // Update the path of the copy
        const newPath = destPath === '/' ? `/${node.name}` : `${destPath}/${node.name}`;
        nodeCopy.path = newPath;
        
        // If it's a directory, update all child paths
        if (node.type === 'directory') {
            this._updateChildPaths(nodeCopy, newPath);
        }
        
        destDir.children[node.name] = nodeCopy;
        destDir.modified = Date.now();
        this._queueSave();
        
        return nodeCopy;
    }
    
    /**
     * Update paths recursively for directory copies
     */
    _updateChildPaths(dirNode, newParentPath) {
        Object.keys(dirNode.children || {}).forEach(childName => {
            const child = dirNode.children[childName];
            child.path = `${newParentPath}/${childName}`;
            
            if (child.type === 'directory') {
                this._updateChildPaths(child, child.path);
            }
        });
    }
    
    /**
     * Search for files or directories matching a pattern
     */
    search(pattern, path = '/', recursive = true) {
        const results = [];
        const dir = this.getNode(path);
        
        const regex = new RegExp(pattern, 'i');
        
        // Search current directory
        Object.values(dir.children || {}).forEach(node => {
            if (regex.test(node.name)) {
                results.push(node);
            }
            
            // Recursive search in subdirectories
            if (recursive && node.type === 'directory') {
                const childResults = this.search(pattern, node.path, recursive);
                results.push(...childResults);
            }
        });
        
        return results;
    }
    
    /**
     * Get free space in localStorage (approximation)
     */
    getFreeSpace() {
        let totalSize = 0;
        try {
            const test = '0'.repeat(1024); // 1KB
            let i = 0;
            while (true) {
                localStorage.setItem(`__size_test_${i}`, test);
                totalSize += test.length;
                i++;
            }
        } catch (e) {
            // We've hit the quota
        } finally {
            // Clean up
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('__size_test_')) {
                    localStorage.removeItem(key);
                }
            }
        }
        
        return {
            total: 5 * 1024 * 1024, // Approximate localStorage size (5MB)
            used: JSON.stringify(this.fs).length,
            free: totalSize
        };
    }
    
    /**
     * Export the file system as a JSON file
     */
    exportFileSystem() {
        const data = JSON.stringify(this.fs, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wave_filesystem_export.json';
        a.click();
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);
    }
    
    /**
     * Import a file system from a JSON file
     */
    importFileSystem(jsonData) {
        try {
            const parsedData = JSON.parse(jsonData);
            
            // Validate the data has the correct structure
            if (!parsedData.type || parsedData.type !== 'directory' || !parsedData.children) {
                throw new Error('Invalid file system format');
            }
            
            this.fs = parsedData;
            this._saveFileSystem();
            
            return true;
        } catch (error) {
            console.error('Error importing file system:', error);
            return false;
        }
    }
    
    /**
     * Normalize a file path
     */
    _normalizePath(path) {
        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        // Remove trailing slash unless it's the root
        if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
        }
        
        // Resolve .. and .
        const parts = path.split('/').filter(p => p);
        const result = [];
        
        for (const part of parts) {
            if (part === '.') continue;
            if (part === '..') {
                result.pop();
            } else {
                result.push(part);
            }
        }
        
        return '/' + result.join('/');
    }
}

// Initialize and export as singleton
const fileSystem = new FileSystemService();

// Export the service
export default fileSystem;
