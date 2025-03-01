# File System Service

The FileSystemService provides a virtual file system that's stored in the browser's localStorage. It mimics a traditional hierarchical file system with directories and files.

## Features

- Create, read, update, and delete files and directories
- Navigate and browse the file system
- Search for files and directories
- Move and copy files/directories
- Export and import file system data
- Storage usage statistics

## Usage

### Basic Operations

```javascript
import fileSystem from './services/filesystem/service.js';

// Create directories
fileSystem.createDirectory('documents');
fileSystem.createDirectory('projects', '/documents');

// Create files
fileSystem.createFile('hello.txt', 'Hello, World!');
fileSystem.createFile('project.json', '{"name":"My Project"}', '/documents/projects', 'application/json');

// Read files
const content = fileSystem.readFile('/hello.txt');
console.log(content); // Outputs: Hello, World!

// Update files
fileSystem.writeFile('/hello.txt', 'Updated content');

// List directory contents
const rootFiles = fileSystem.listDirectory('/');
console.log(rootFiles); // Array of files and directories in root

// Delete files or directories
fileSystem.delete('/hello.txt');

// Copy and move
fileSystem.copy('/documents/projects/project.json', '/');
fileSystem.move('/project.json', '/documents');
```

### Advanced Operations

```javascript
// Search for files
const results = fileSystem.search('project');
console.log(results); // Array of matching files/directories

// Export file system
fileSystem.exportFileSystem();

// Import file system
const jsonData = '{"name":"root",...}'; // Valid file system JSON
fileSystem.importFileSystem(jsonData);

// Get storage statistics
const stats = fileSystem.getFreeSpace();
console.log(`Used: ${stats.used} bytes, Free: ${stats.free} bytes`);
```

## File System Structure

The file system uses a JSON structure that represents files and directories:

```javascript
{
  name: 'root',
  type: 'directory',
  path: '/',
  children: {
    'documents': {
      name: 'documents',
      type: 'directory',
      path: '/documents',
      children: { ... }
    },
    'hello.txt': {
      name: 'hello.txt',
      type: 'file',
      path: '/hello.txt',
      content: 'Hello, World!',
      size: 13,
      mimeType: 'text/plain',
      created: 1620000000000,
      modified: 1620000000000
    }
  },
  created: 1620000000000,
  modified: 1620000000000
}
```

## Limitations

- Storage is limited by localStorage quotas (typically 5-10MB)
- No built-in encryption or security features
- All data is stored client-side

## Error Handling

The service throws descriptive errors for common issues like:
- Path not found
- File already exists
- Cannot delete root directory
- Storage quota exceeded
