const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { createTicket, getTickets, updateTicket, sendTicketReply } = require('../controllers/ticketsController');

// POST /api/tickets - Author submits a new ticket
router.post('/', auth, createTicket);

// GET /api/tickets - Fetch tickets based on role
router.get('/', auth, getTickets);

// PUT /api/tickets/:id - Admin updates status, adds an internal note, or assigns an admin
router.put('/:id', auth, updateTicket);

// POST /api/tickets/:id/replies - Admin sends a reply to the ticket
router.post('/:id/replies', auth, sendTicketReply);

module.exports = router;
