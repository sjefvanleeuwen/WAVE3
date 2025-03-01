import fileSystem from './service.js';

/**
 * Simple demo script to demonstrate FileSystemService functionality
 */
function runFileSystemDemo() {
    console.log('Running FileSystem Service Demo...');
    
    try {
        // List root directory
        console.log('Root directory contents:', fileSystem.listDirectory('/'));
        
        // Create a new directory
        console.log('Creating projects directory...');
        fileSystem.createDirectory('projects');
        
        // Create a file in the projects directory
        console.log('Creating project1.txt file...');
        const file = fileSystem.createFile('project1.txt', 'This is a project file', '/projects');
        console.log('File created:', file);
        
        // Read the file
        const content = fileSystem.readFile('/projects/project1.txt');
        console.log('File content:', content);
        
        // Update the file
        console.log('Updating file content...');
        fileSystem.writeFile('/projects/project1.txt', 'Updated project information');
        
        // Read the updated file
        const updatedContent = fileSystem.readFile('/projects/project1.txt');
        console.log('Updated content:', updatedContent);
        
        // Copy the file
        console.log('Copying file to root...');
        fileSystem.copy('/projects/project1.txt', '/');
        
        // Search for files
        console.log('Searching for "project"...');
        const searchResults = fileSystem.search('project');
        console.log('Search results:', searchResults);
        
        // Get storage stats
        const stats = fileSystem.getFreeSpace();
        console.log('Storage stats:', stats);
        
        // List all directories to verify changes
        console.log('Root directory after changes:', fileSystem.listDirectory('/'));
        console.log('Projects directory after changes:', fileSystem.listDirectory('/projects'));
        
        console.log('Demo completed successfully!');
    } catch (error) {
        console.error('Error in file system demo:', error);
    }
}

// Run the demo when the script is loaded
document.addEventListener('DOMContentLoaded', runFileSystemDemo);
