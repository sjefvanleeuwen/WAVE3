// This file defines the API routes for the server.

const express = require('express');
const router = express.Router();

// Example route for getting data
router.get('/data', (req, res) => {
    res.json({ message: 'Hello from the API!' });
});

// Example route for posting data
router.post('/data', (req, res) => {
    const data = req.body;
    // Process the data here
    res.status(201).json({ message: 'Data received', data });
});

// Add more routes as needed

module.exports = router;