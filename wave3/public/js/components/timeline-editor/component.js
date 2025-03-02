/**
 * Timeline Editor Component
 * A customizable timeline editor with drag-and-drop support for items
 */
class TimelineEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Timeline configuration
        this.config = {
            startTime: 0,          // Start time in seconds
            endTime: 60,           // End time in seconds
            visibleDuration: 60,   // Visible duration in seconds
            pixelsPerSecond: 10,   // Scale (pixels per second)
            snapToGrid: true,      // Snap items to grid
            gridSize: 1,           // Grid size in seconds
            trackHeight: 40,       // Height of each track in pixels
            tracks: 3,             // Number of tracks
            minItemWidth: 20       // Minimum width for timeline items in pixels
        };
        
        // State
        this._items = [];
        this._isDragging = false;
        this._isResizing = false;
        this._dragItem = null;
        this._dragStartX = 0;
        this._dragOffsetX = 0;
        this._resizeEdge = null;
        this._scrollPosition = 0;
        
        // Bind methods
        this._handleItemDragStart = this._handleItemDragStart.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleScroll = this._handleScroll.bind(this);
        this._handleItemResizeStart = this._handleItemResizeStart.bind(this);
    }
    
    /**
     * Lifecycle: Component connected to DOM
     */
    connectedCallback() {
        this._render();
        this._setupEventListeners();
        
        // Add default items if none exist
        if (this._items.length === 0) {
            this.addItem({
                id: 'item-1',
                track: 0,
                start: 5,
                end: 15,
                title: 'First Item',
                color: '#4285f4'
            });
            
            this.addItem({
                id: 'item-2',
                track: 1,
                start: 20,
                end: 35,
                title: 'Second Item',
                color: '#ea4335'
            });
        }
    }
    
    /**
     * Lifecycle: Component attributes changed
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        
        switch (name) {
            case 'duration':
                this.config.endTime = parseInt(newValue) || 60;
                this.config.visibleDuration = this.config.endTime;
                break;
            case 'tracks':
                this.config.tracks = parseInt(newValue) || 3;
                break;
            case 'scale':
                this.config.pixelsPerSecond = parseInt(newValue) || 10;
                break;
        }
        
        if (this.isConnected) {
            this._render();
        }
    }
    
    static get observedAttributes() {
        return ['duration', 'tracks', 'scale'];
    }
    
    /**
     * Creates the initial DOM structure
     */
    _render() {
        const { pixelsPerSecond, trackHeight, tracks, endTime } = this.config;
        const timelineWidth = endTime * pixelsPerSecond;
        
        // Create the component HTML
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: auto;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
                    --timeline-track-height: ${trackHeight}px;
                    overflow: hidden;
                    user-select: none;
                }
                
                .timeline-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    background-color: #f8f9fa;
                }
                
                .timeline-header {
                    position: relative;
                    height: 30px;
                    background-color: #e9ecef;
                    border-bottom: 1px solid #ced4da;
                    overflow: hidden;
                }
                
                .timeline-ruler {
                    position: absolute;
                    height: 100%;
                    background-color: transparent;
                    width: ${timelineWidth}px;
                    white-space: nowrap;
                }
                
                .timeline-marker {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 1px;
                    background-color: #ced4da;
                }
                
                .timeline-marker-label {
                    position: absolute;
                    top: 2px;
                    transform: translateX(-50%);
                    font-size: 10px;
                    color: #495057;
                }
                
                .timeline-tracks {
                    position: relative;
                    flex: 1;
                    overflow-x: auto;
                    overflow-y: hidden;
                }
                
                .timeline-tracks-container {
                    position: relative;
                    width: ${timelineWidth}px;
                    height: ${tracks * trackHeight}px;
                }
                
                .timeline-track {
                    position: absolute;
                    width: 100%;
                    height: var(--timeline-track-height);
                    background-color: rgba(255, 255, 255, 0.8);
                    border-bottom: 1px solid #dee2e6;
                }
                
                .timeline-track:nth-child(odd) {
                    background-color: rgba(248, 249, 250, 0.8);
                }
                
                .timeline-item {
                    position: absolute;
                    height: calc(var(--timeline-track-height) - 6px);
                    border-radius: 4px;
                    padding: 0 8px;
                    color: white;
                    font-size: 12px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    cursor: move;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
                    transition: box-shadow 0.2s ease;
                }
                
                .timeline-item:hover {
                    box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
                }
                
                .timeline-item.dragging {
                    opacity: 0.8;
                    z-index: 10;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
                }
                
                .timeline-resize-handle {
                    position: absolute;
                    top: 0;
                    width: 8px;
                    height: 100%;
                    cursor: ew-resize;
                }
                
                .timeline-resize-handle.left {
                    left: 0;
                }
                
                .timeline-resize-handle.right {
                    right: 0;
                }
                
                .timeline-toolbar {
                    padding: 8px;
                    border-top: 1px solid #ced4da;
                    display: flex;
                    gap: 8px;
                    background-color: #e9ecef;
                }
                
                .timeline-toolbar button {
                    padding: 4px 8px;
                    background-color: white;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .timeline-toolbar button:hover {
                    background-color: #f1f3f5;
                }
                
                .timeline-current-time {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 2px;
                    background-color: red;
                    z-index: 5;
                }
                
                .timeline-cursor {
                    position: absolute;
                    top: -10px;
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid red;
                    transform: translateX(-6px);
                }
                
                /* Scrollbar styling */
                .timeline-tracks::-webkit-scrollbar {
                    height: 8px;
                }
                
                .timeline-tracks::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                
                .timeline-tracks::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                
                .timeline-tracks::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            </style>
            
            <div class="timeline-container">
                <div class="timeline-header">
                    <div class="timeline-ruler"></div>
                </div>
                <div class="timeline-tracks">
                    <div class="timeline-tracks-container"></div>
                    <div class="timeline-current-time">
                        <div class="timeline-cursor"></div>
                    </div>
                </div>
                <div class="timeline-toolbar">
                    <button class="zoom-in">Zoom In</button>
                    <button class="zoom-out">Zoom Out</button>
                    <button class="add-item">Add Item</button>
                </div>
            </div>
        `;
        
        this._createTimeMarkers();
        this._createTracks();
        this._renderItems();
        this._setupScrollSync();
    }
    
    /**
     * Create time markers on the ruler
     */
    _createTimeMarkers() {
        const { pixelsPerSecond, endTime } = this.config;
        const ruler = this.shadowRoot.querySelector('.timeline-ruler');
        ruler.innerHTML = '';
        
        // Determine marker interval based on scale
        let interval = 5; // Default: mark every 5 seconds
        
        if (pixelsPerSecond < 5) interval = 60;      // Every minute
        else if (pixelsPerSecond < 10) interval = 30; // Every 30 seconds
        else if (pixelsPerSecond < 20) interval = 15; // Every 15 seconds
        else if (pixelsPerSecond < 50) interval = 10; // Every 10 seconds
        else if (pixelsPerSecond >= 50) interval = 1; // Every second
        
        for (let time = 0; time <= endTime; time += interval) {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.left = `${time * pixelsPerSecond}px`;
            
            const label = document.createElement('div');
            label.className = 'timeline-marker-label';
            
            // Format time as mm:ss
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            label.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            marker.appendChild(label);
            ruler.appendChild(marker);
        }
    }
    
    /**
     * Create timeline tracks
     */
    _createTracks() {
        const { tracks, trackHeight } = this.config;
        const tracksContainer = this.shadowRoot.querySelector('.timeline-tracks-container');
        tracksContainer.innerHTML = '';
        
        for (let i = 0; i < tracks; i++) {
            const track = document.createElement('div');
            track.className = 'timeline-track';
            track.style.top = `${i * trackHeight}px`;
            track.dataset.track = i;
            tracksContainer.appendChild(track);
        }
    }
    
    /**
     * Render timeline items
     */
    _renderItems() {
        const { pixelsPerSecond, trackHeight } = this.config;
        const tracksContainer = this.shadowRoot.querySelector('.timeline-tracks-container');
        
        // Remove existing items
        this.shadowRoot.querySelectorAll('.timeline-item').forEach(el => el.remove());
        
        // Create items
        this._items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'timeline-item';
            el.id = item.id;
            el.textContent = item.title;
            el.style.backgroundColor = item.color || '#4285f4';
            el.style.left = `${item.start * pixelsPerSecond}px`;
            el.style.width = `${(item.end - item.start) * pixelsPerSecond}px`;
            el.style.top = `${item.track * trackHeight + 3}px`;
            el.dataset.itemId = item.id;
            
            // Add resize handles
            const leftHandle = document.createElement('div');
            leftHandle.className = 'timeline-resize-handle left';
            leftHandle.addEventListener('mousedown', (e) => this._handleItemResizeStart(e, item, 'left'));
            
            const rightHandle = document.createElement('div');
            rightHandle.className = 'timeline-resize-handle right';
            rightHandle.addEventListener('mousedown', (e) => this._handleItemResizeStart(e, item, 'right'));
            
            el.appendChild(leftHandle);
            el.appendChild(rightHandle);
            
            el.addEventListener('mousedown', (e) => this._handleItemDragStart(e, item));
            tracksContainer.appendChild(el);
        });
    }
    
    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
        
        // Zoom controls
        this.shadowRoot.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
        this.shadowRoot.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
        this.shadowRoot.querySelector('.add-item').addEventListener('click', () => this.addDefaultItem());
        
        // Track click for positioning items
        const tracksContainer = this.shadowRoot.querySelector('.timeline-tracks-container');
        tracksContainer.addEventListener('click', (e) => {
            // Ignore clicks on items
            if (e.target.closest('.timeline-item')) return;
            
            // Get click coordinates
            const rect = tracksContainer.getBoundingClientRect();
            const x = e.clientX - rect.left + this._scrollPosition;
            const y = e.clientY - rect.top;
            
            // Convert to time and track
            const time = this._pixelsToTime(x);
            const track = Math.floor(y / this.config.trackHeight);
            
            console.log(`Clicked at time ${time}s on track ${track}`);
        });
    }
    
    /**
     * Sync scrolling between ruler and tracks
     */
    _setupScrollSync() {
        const tracksElement = this.shadowRoot.querySelector('.timeline-tracks');
        const rulerElement = this.shadowRoot.querySelector('.timeline-ruler');
        
        tracksElement.addEventListener('scroll', this._handleScroll);
    }
    
    /**
     * Handle scroll events
     */
    _handleScroll(event) {
        const scrollLeft = event.target.scrollLeft;
        this._scrollPosition = scrollLeft;
        
        // Sync ruler scroll position
        this.shadowRoot.querySelector('.timeline-ruler').style.transform = `translateX(-${scrollLeft}px)`;
        
        // Update current time indicator if needed
    }
    
    /**
     * Handle item drag start
     */
    _handleItemDragStart(event, item) {
        // Ignore resize handle clicks
        if (event.target.classList.contains('timeline-resize-handle')) return;
        
        this._isDragging = true;
        this._dragItem = item;
        this._dragStartX = event.clientX;
        
        const itemElement = this.shadowRoot.getElementById(item.id);
        
        // Calculate offset within the item
        const rect = itemElement.getBoundingClientRect();
        this._dragOffsetX = event.clientX - rect.left;
        
        // Add dragging class
        itemElement.classList.add('dragging');
        
        event.preventDefault();
    }
    
    /**
     * Handle item resize start
     */
    _handleItemResizeStart(event, item, edge) {
        this._isResizing = true;
        this._dragItem = item;
        this._resizeEdge = edge;
        this._dragStartX = event.clientX;
        
        const itemElement = this.shadowRoot.getElementById(item.id);
        itemElement.classList.add('dragging');
        
        event.stopPropagation();
        event.preventDefault();
    }
    
    /**
     * Handle mouse movements
     */
    _handleMouseMove(event) {
        if (this._isDragging && this._dragItem) {
            const { pixelsPerSecond, gridSize, snapToGrid } = this.config;
            const tracksContainer = this.shadowRoot.querySelector('.timeline-tracks-container');
            const rect = tracksContainer.getBoundingClientRect();
            
            let x = event.clientX - rect.left + this._scrollPosition - this._dragOffsetX;
            let time = x / pixelsPerSecond;
            
            // Snap to grid if enabled
            if (snapToGrid) {
                time = Math.round(time / gridSize) * gridSize;
                x = time * pixelsPerSecond;
            }
            
            // Find track based on y position
            const y = event.clientY - rect.top;
            let track = Math.floor(y / this.config.trackHeight);
            track = Math.max(0, Math.min(track, this.config.tracks - 1));
            
            // Get item duration
            const duration = this._dragItem.end - this._dragItem.start;
            
            // Limit positions
            time = Math.max(0, Math.min(time, this.config.endTime - duration));
            
            // Update item position visually
            const itemElement = this.shadowRoot.getElementById(this._dragItem.id);
            itemElement.style.left = `${time * pixelsPerSecond}px`;
            itemElement.style.top = `${track * this.config.trackHeight + 3}px`;
            
            // Update item data
            this._dragItem.start = time;
            this._dragItem.end = time + duration;
            this._dragItem.track = track;
            
        } else if (this._isResizing && this._dragItem) {
            const { pixelsPerSecond, gridSize, snapToGrid, minItemWidth } = this.config;
            const tracksContainer = this.shadowRoot.querySelector('.timeline-tracks-container');
            const rect = tracksContainer.getBoundingClientRect();
            
            let x = event.clientX - rect.left + this._scrollPosition;
            let time = x / pixelsPerSecond;
            
            // Snap to grid if enabled
            if (snapToGrid) {
                time = Math.round(time / gridSize) * gridSize;
            }
            
            // Limit time to valid range
            time = Math.max(0, Math.min(time, this.config.endTime));
            
            const itemElement = this.shadowRoot.getElementById(this._dragItem.id);
            
            if (this._resizeEdge === 'left') {
                // Ensure minimum width
                if (this._dragItem.end - time < this._timeToPixels(minItemWidth) / pixelsPerSecond) {
                    time = this._dragItem.end - this._timeToPixels(minItemWidth) / pixelsPerSecond;
                }
                
                this._dragItem.start = time;
                itemElement.style.left = `${time * pixelsPerSecond}px`;
                itemElement.style.width = `${(this._dragItem.end - time) * pixelsPerSecond}px`;
                
            } else if (this._resizeEdge === 'right') {
                // Ensure minimum width
                if (time - this._dragItem.start < this._timeToPixels(minItemWidth) / pixelsPerSecond) {
                    time = this._dragItem.start + this._timeToPixels(minItemWidth) / pixelsPerSecond;
                }
                
                this._dragItem.end = time;
                itemElement.style.width = `${(time - this._dragItem.start) * pixelsPerSecond}px`;
            }
        }
    }
    
    /**
     * Handle mouse up event
     */
    _handleMouseUp(event) {
        if (this._isDragging || this._isResizing) {
            // Remove dragging class
            const itemElement = this.shadowRoot.getElementById(this._dragItem.id);
            if (itemElement) {
                itemElement.classList.remove('dragging');
            }
            
            // Dispatch change event
            const changeEvent = new CustomEvent('timeline-change', {
                detail: {
                    item: this._dragItem,
                    action: this._isDragging ? 'move' : 'resize',
                    edge: this._isResizing ? this._resizeEdge : null
                }
            });
            this.dispatchEvent(changeEvent);
        }
        
        this._isDragging = false;
        this._isResizing = false;
        this._dragItem = null;
        this._resizeEdge = null;
    }
    
    /**
     * Convert time to pixels
     */
    _timeToPixels(time) {
        return time * this.config.pixelsPerSecond;
    }
    
    /**
     * Convert pixels to time
     */
    _pixelsToTime(pixels) {
        return pixels / this.config.pixelsPerSecond;
    }
    
    /* Public API methods */
    
    /**
     * Add a new item to the timeline
     */
    addItem(item) {
        // Generate ID if not provided
        if (!item.id) {
            item.id = `item-${Date.now()}`;
        }
        
        // Ensure start/end times are valid
        item.start = Math.max(0, item.start || 0);
        item.end = Math.min(this.config.endTime, item.end || item.start + 5);
        
        // Ensure track is valid
        item.track = Math.min(Math.max(0, item.track || 0), this.config.tracks - 1);
        
        this._items.push(item);
        
        if (this.isConnected) {
            this._renderItems();
            
            // Dispatch add event
            const addEvent = new CustomEvent('timeline-item-add', {
                detail: { item }
            });
            this.dispatchEvent(addEvent);
        }
        
        return item;
    }
    
    /**
     * Add a default item
     */
    addDefaultItem() {
        // Find the first empty space
        const existingPositions = this._items.map(item => ({
            track: item.track,
            start: item.start,
            end: item.end
        }));
        
        // Start with track 0, time 0
        let track = 0;
        let startTime = 0;
        const duration = 5; // 5 seconds
        
        // Try to find an empty space
        while (true) {
            const collision = existingPositions.some(pos => 
                pos.track === track && 
                ((startTime >= pos.start && startTime < pos.end) || 
                 (startTime + duration > pos.start && startTime + duration <= pos.end) ||
                 (startTime <= pos.start && startTime + duration >= pos.end))
            );
            
            if (!collision) break;
            
            // Try next position
            startTime += 5;
            
            // If we reach the end, go to next track
            if (startTime > this.config.endTime - duration) {
                startTime = 0;
                track++;
                
                // If we've checked all tracks, just add at the end of timeline
                if (track >= this.config.tracks) {
                    track = 0;
                    startTime = this.config.endTime - duration;
                    break;
                }
            }
        }
        
        // Generate a random color
        const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Add the new item
        return this.addItem({
            track,
            start: startTime,
            end: startTime + duration,
            title: `Item ${this._items.length + 1}`,
            color
        });
    }
    
    /**
     * Remove an item
     */
    removeItem(id) {
        const index = this._items.findIndex(item => item.id === id);
        if (index !== -1) {
            const item = this._items[index];
            this._items.splice(index, 1);
            
            if (this.isConnected) {
                this._renderItems();
                
                // Dispatch remove event
                const removeEvent = new CustomEvent('timeline-item-remove', {
                    detail: { item }
                });
                this.dispatchEvent(removeEvent);
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Get all items
     */
    getItems() {
        return [...this._items];
    }
    
    /**
     * Clear all items
     */
    clearItems() {
        this._items = [];
        if (this.isConnected) {
            this._renderItems();
            
            // Dispatch clear event
            this.dispatchEvent(new CustomEvent('timeline-clear'));
        }
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.config.pixelsPerSecond = Math.min(200, this.config.pixelsPerSecond * 1.5);
        this._render();
        
        // Dispatch zoom event
        this.dispatchEvent(new CustomEvent('timeline-zoom', {
            detail: { scale: this.config.pixelsPerSecond }
        }));
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.config.pixelsPerSecond = Math.max(1, this.config.pixelsPerSecond / 1.5);
        this._render();
        
        // Dispatch zoom event
        this.dispatchEvent(new CustomEvent('timeline-zoom', {
            detail: { scale: this.config.pixelsPerSecond }
        }));
    }
    
    /**
     * Set timeline duration
     */
    setDuration(seconds) {
        this.config.endTime = Math.max(10, seconds);
        this.config.visibleDuration = this.config.endTime;
        this._render();
    }
    
    /**
     * Set current time (playhead position)
     */
    setCurrentTime(seconds) {
        const time = Math.max(0, Math.min(seconds, this.config.endTime));
        const position = time * this.config.pixelsPerSecond;
        
        const timeIndicator = this.shadowRoot.querySelector('.timeline-current-time');
        timeIndicator.style.left = `${position}px`;
        
        // Dispatch time update event
        this.dispatchEvent(new CustomEvent('timeline-time-update', {
            detail: { time }
        }));
        
        return time;
    }
}

// Register the component
customElements.define('timeline-editor', TimelineEditor);
