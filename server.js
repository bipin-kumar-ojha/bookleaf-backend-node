const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Database Connection
connectDB().catch(err => console.error('MongoDB connection error:', err));

// 3. Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const bookRoutes = require('./routes/books'); // Import the books route
const userRoutes = require('./routes/users');
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/books', bookRoutes); // Add this line to include the books route
app.use('/api/users', userRoutes);

// 4. Test Route
app.get('/', (req, res) => {
  res.send('BookLeaf API is running successfully!');
});

// 5. Port Setup
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
