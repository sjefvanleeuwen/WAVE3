// This file manages the application state and provides methods for state manipulation.

class StateService {
    constructor() {
        this.state = {};
    }

    // Method to get the current state
    getState() {
        return this.state;
    }

    // Method to set a new state
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    // Method to subscribe to state changes
    subscribe(listener) {
        if (!this.listeners) {
            this.listeners = [];
        }
        this.listeners.push(listener);
    }

    // Method to notify all listeners of state changes
    notifyListeners() {
        if (this.listeners) {
            this.listeners.forEach(listener => listener(this.state));
        }
    }
}

export default new StateService();