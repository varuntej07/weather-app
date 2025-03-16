const express = require('express');
const cors = require('cors');
const weatherRoutes = require('./routes/weather');

const app = express();

// Middleware
app.use(cors()); // Allows frontend requests
app.use(express.json());

// Routes
app.use('/weather', weatherRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));