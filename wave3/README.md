# WAVE3

WAVE3 is a desktop application built using vanilla JavaScript and HTML5, utilizing Web Components to create a modular and maintainable codebase. The application is structured to separate concerns between components, services, and server-side code.

## Project Structure

```
wave3
├── public                     # Client-side code and assets
│   ├── index.html             # Main HTML file serving as the entry point
│   ├── css
│   │   └── main.css           # Global application styles
│   ├── js
│   │   ├── main.js            # Application initialization and bootstrap
│   │   ├── components         # Web Components directory
│   │   │   ├── button         # Standard button component
│   │   │   │   ├── component.js   # Button JavaScript implementation
│   │   │   │   ├── component.css  # Button-specific styles
│   │   │   │   └── component.html # Button HTML template
│   │   │   ├── desktop-icon   # Desktop icon component for GUI
│   │   │   │   ├── component.js   # Icon implementation with drag-and-drop
│   │   │   │   └── component.css  # Icon styling
│   │   │   ├── desktop-surface # Desktop workspace container
│   │   │   │   ├── component.js   # Surface implementation with grid and positioning
│   │   │   │   ├── component.css  # Desktop styling and layout
│   │   │   │   └── component.html # Surface template
│   │   │   ├── navbar         # Navigation bar component
│   │   │   │   ├── component.js   # Navbar implementation
│   │   │   │   ├── component.css  # Navbar styling
│   │   │   │   └── component.html # Navbar template
│   │   │   ├── startbar       # Start menu and taskbar component
│   │   │   │   ├── component.js   # Startbar implementation
│   │   │   │   └── component.css  # Startbar styling
│   │   │   └── ... other components
│   │   └── services           # Reusable services
│   │       ├── api            # API communication layer
│   │       │   └── service.js # Handles HTTP requests and responses
│   │       └── state          # Application state management
│   │           └── service.js # Centralized state handling
│   └── images                 # Static image assets
│       └── logo.svg           # Application logo
├── server                     # Server-side code
│   ├── index.js               # Server entry point
│   └── routes                 # API routing
│       └── api.js             # API endpoint definitions
├── dist                       # Build output directory
│   └── .gitkeep               # Keeps the dist directory in version control
├── package.json               # Project dependencies and scripts
└── README.md                  # Project documentation
```

## Component Architecture

WAVE3 uses Web Components to create a modular UI:

- **Button Component**: Reusable button elements with customizable styles and behaviors
- **Desktop Surface Component**: Main workspace container that:
  - Provides a grid-based layout system
  - Manages icon positioning and alignment
  - Handles workspace interactions and events
  - Supports dynamic resizing and responsive layout
- **Desktop Icon Component**: Interactive icons that can be positioned and dragged on the desktop interface
  - Supports custom icons and labels
  - Implements drag-and-drop functionality
  - Handles selection, context menus, and double-click events
- **Navbar Component**: Application navigation with responsive design
- **Startbar Component**: Windows-like taskbar that:
  - Provides a start button and menu trigger
  - Shows active applications and system tray
  - Displays current time
  - Handles window management events

## Services

- **API Service**: Centralizes all communication with the backend server
- **State Service**: Manages application state to ensure consistent data across components

## Getting Started

To get started with WAVE3, clone the repository and install the necessary dependencies:

```bash
git clone <repository-url>
cd wave3
npm install
```

## Usage

To run the application, you can use the following command:

```bash
npm start
```

This will start the server and open the application in your default web browser.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.