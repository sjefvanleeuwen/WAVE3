/**
 * File Type Utilities
 * Utility functions for handling file types, icons, and size formatting
 */

/**
 * Get an icon for a file based on its extension
 * @param {string} filename - The name of the file
 * @returns {string} An emoji icon representing the file type
 */
export function getFileIcon(filename) {
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
 * @param {string} filename - The name of the file
 * @returns {string} A descriptive file type
 */
export function getFileType(filename) {
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
 * Format file size in human-readable form
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if the file is a viewable image
 * @param {string} filename - The name of the file
 * @returns {boolean} True if the file is an image
 */
export function isImageFile(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension);
}

/**
 * Check if the file is a viewable video
 * @param {string} filename - The name of the file
 * @returns {boolean} True if the file is a video
 */
export function isVideoFile(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension);
}

/**
 * Check if the file is playable audio
 * @param {string} filename - The name of the file
 * @returns {boolean} True if the file is audio
 */
export function isAudioFile(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return ['mp3', 'wav', 'ogg', 'flac'].includes(extension);
}

/**
 * Get the file extension from a filename
 * @param {string} filename - The name of the file
 * @returns {string} The file extension (without the dot)
 */
export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}
