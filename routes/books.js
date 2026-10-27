const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getBooks } = require('../controllers/booksController');

router.get('/', auth, getBooks);

module.exports = router;
