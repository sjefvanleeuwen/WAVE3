// main.js is the main JavaScript file that initializes the application and handles any global scripts.

// Import file explorer component
import './components/file-explorer/file-explorer-component.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('WAVE3 application has started.');

    // Initialize components
    const button = document.createElement('button-component');
    document.body.appendChild(button);


    // Additional global scripts can be added here
});