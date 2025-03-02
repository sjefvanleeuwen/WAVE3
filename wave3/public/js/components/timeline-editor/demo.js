/**
 * Timeline Editor Demo
 * Demonstrates the functionality of the timeline editor component
 */

document.addEventListener('DOMContentLoaded', () => {
    // Create the timeline editor
    const timeline = document.querySelector('timeline-editor') || createTimelineEditor();
    
    // Setup event listeners
    setupEventListeners(timeline);
    
    // Add some demo items
    addDemoItems(timeline);
    
    console.log('Timeline editor demo initialized');
});

/**
 * Create a timeline editor if one doesn't exist in the document
 */
function createTimelineEditor() {
    const timeline = document.createElement('timeline-editor');
    timeline.setAttribute('duration', '120'); // 2 minutes timeline
    timeline.setAttribute('tracks', '4'); // 4 tracks
    timeline.setAttribute('scale', '15'); // 15 pixels per second
    
    // Append to demo container or body
    const container = document.querySelector('#timeline-container') || document.body;
    container.appendChild(timeline);
    
    return timeline;
}

/**
 * Setup event listeners for the timeline
 */
function setupEventListeners(timeline) {
    // Listen for item changes
    timeline.addEventListener('timeline-change', (event) => {
        const { item, action, edge } = event.detail;
        console.log(`Timeline item ${action}:`, item, edge ? `(${edge} edge)` : '');
        
        // Update info panel with selected item data
        updateInfoPanel(item);
    });
    
    // Listen for item additions
    timeline.addEventListener('timeline-item-add', (event) => {
        console.log('Item added:', event.detail.item);
    });
    
    // Listen for item removals
    timeline.addEventListener('timeline-item-remove', (event) => {
        console.log('Item removed:', event.detail.item);
    });
    
    // Listen for timeline zoom changes
    timeline.addEventListener('timeline-zoom', (event) => {
        console.log('Timeline zoomed to scale:', event.detail.scale);
    });
    
    // Listen for timeline time updates
    timeline.addEventListener('timeline-time-update', (event) => {
        console.log('Current time:', event.detail.time);
        document.querySelector('#current-time').textContent = formatTime(event.detail.time);
    });
    
    // Add buttons for controlling the timeline
    const controls = document.createElement('div');
    controls.className = 'timeline-demo-controls';
    controls.innerHTML = `
        <div class="control-panel">
            <button id="play-btn">Play</button>
            <button id="pause-btn">Pause</button>
            <button id="add-item-btn">Add Item</button>
            <button id="clear-btn">Clear All</button>
            <span>Current Time: <span id="current-time">0:00</span></span>
        </div>
        <div id="info-panel" class="info-panel">
            <h3>Selected Item</h3>
            <div id="item-details">No item selected</div>
        </div>
    `;
    
    // Add controls before the timeline
    timeline.parentNode.insertBefore(controls, timeline);
    
    // Attach control event handlers
    document.querySelector('#play-btn').addEventListener('click', () => {
        playTimeline(timeline);
    });
    
    document.querySelector('#pause-btn').addEventListener('click', () => {
        pauseTimeline();
    });
    
    document.querySelector('#add-item-btn').addEventListener('click', () => {
        const newItem = timeline.addDefaultItem();
        console.log('Added new item:', newItem);
    });
    
    document.querySelector('#clear-btn').addEventListener('click', () => {
        timeline.clearItems();
    });
}

/**
 * Add demo items to the timeline
 */
function addDemoItems(timeline) {
    // Clear any existing items
    timeline.clearItems();
    
    // Add a few items spanning different tracks and times
    timeline.addItem({
        id: 'intro',
        track: 0,
        start: 0,
        end: 15,
        title: 'Introduction',
        color: '#4285f4'
    });
    
    timeline.addItem({
        id: 'section1',
        track: 0,
        start: 20,
        end: 45,
        title: 'Main Content',
        color: '#ea4335'
    });
    
    timeline.addItem({
        id: 'background-music',
        track: 1,
        start: 0,
        end: 60,
        title: 'Background Music',
        color: '#34a853'
    });
    
    timeline.addItem({
        id: 'sound-effect',
        track: 2,
        start: 25,
        end: 28,
        title: 'Sound Effect',
        color: '#fbbc05'
    });
    
    timeline.addItem({
        id: 'outro',
        track: 0,
        start: 50,
        end: 65,
        title: 'Conclusion',
        color: '#4285f4'
    });
}

// Playback functionality
let playbackInterval = null;
let currentTime = 0;

/**
 * Start timeline playback
 */
function playTimeline(timeline) {
    // Stop any existing playback
    pauseTimeline();
    
    // Get the timeline's current time or start from beginning
    currentTime = parseFloat(document.querySelector('#current-time').textContent.split(':').reduce((acc, time) => (60 * acc) + parseFloat(time))) || 0;
    
    // Update every 100ms (smoother animation)
    playbackInterval = setInterval(() => {
        currentTime += 0.1; // Increment by 0.1 second
        timeline.setCurrentTime(currentTime);
        
        // Loop back to beginning if we reach the end
        if (currentTime >= parseFloat(timeline.getAttribute('duration') || 120)) {
            currentTime = 0;
        }
    }, 100);
}

/**
 * Pause timeline playback
 */
function pauseTimeline() {
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
}

/**
 * Update the info panel with item details
 */
function updateInfoPanel(item) {
    const panel = document.querySelector('#item-details');
    
    if (!item) {
        panel.textContent = 'No item selected';
        return;
    }
    
    panel.innerHTML = `
        <div class="item-detail"><strong>ID:</strong> ${item.id}</div>
        <div class="item-detail"><strong>Title:</strong> ${item.title}</div>
        <div class="item-detail"><strong>Track:</strong> ${item.track}</div>
        <div class="item-detail"><strong>Start:</strong> ${formatTime(item.start)}</div>
        <div class="item-detail"><strong>End:</strong> ${formatTime(item.end)}</div>
        <div class="item-detail"><strong>Duration:</strong> ${formatTime(item.end - item.start)}</div>
    `;
}

/**
 * Format time in seconds to mm:ss format
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Add some CSS for the demo page
const style = document.createElement('style');
style.textContent = `
    #timeline-container {
        width: 100%;
        height: 400px;
        margin: 20px 0;
    }
    
    .timeline-demo-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-bottom: 20px;
    }
    
    .control-panel {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .control-panel button {
        padding: 8px 12px;
        background-color: #1a73e8;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .control-panel button:hover {
        background-color: #1558b7;
    }
    
    .info-panel {
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
        border: 1px solid #ddd;
        min-width: 250px;
    }
    
    .info-panel h3 {
        margin-top: 0;
        margin-bottom: 8px;
        font-size: 16px;
    }
    
    .item-detail {
        margin-bottom: 4px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);
