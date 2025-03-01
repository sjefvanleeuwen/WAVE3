class StartBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        console.log('StartBar component constructed'); // Debug log
    }

    connectedCallback() {
        console.log('StartBar component connected'); // Debug log
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="./js/components/startbar/component.css">
            <div class="startbar">
                <button class="start-button">Start</button>
                <div class="taskbar-items"></div>
                <div class="system-tray">
                    <span class="clock"></span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.updateClock();
    }

    setupEventListeners() {
        const startButton = this.shadowRoot.querySelector('.start-button');
        startButton.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('startmenu-toggle'));
        });
        
        // Update clock every minute
        setInterval(() => this.updateClock(), 60000);
    }

    updateClock() {
        const clock = this.shadowRoot.querySelector('.clock');
        const now = new Date();
        clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

try {
    customElements.define('start-bar', StartBar);
    console.log('StartBar component registered successfully');
} catch (e) {
    console.error('Failed to register StartBar component:', e);
}
