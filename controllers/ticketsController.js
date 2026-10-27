const Ticket = require('../models/Ticket');
const User = require('../models/User');
const mongoose = require('mongoose');
const { generateTicketAnalysis } = require('../services/aiService');

const createTicket = async (req, res) => {
  try {
    const { subject, description, bookId } = req.body;
    const userId = req.user.userId || req.user.id; 
    
    let ticket = new Ticket({
      author: userId,
      book: bookId || null,
      subject,
      description,
      status: 'Open',
      aiPriority: 'Unassigned'
    });
    await ticket.save();

    try {
      const aiData = await generateTicketAnalysis({ subject, description });

      ticket.aiClassification = aiData.category;
      ticket.aiPriority = aiData.priority;
      ticket.aiDraftResponse = aiData.draftResponse;
      await ticket.save();
    } catch (aiError) {
      console.error('AI Generation failed, saving ticket without AI data:', aiError);
    }

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("author", "name email")
      .populate("book", "title book_id isbn");

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: populatedTicket,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating ticket' });
  }
};

const getTickets = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const filter =
      req.user.role === "admin" ? {} : { author: userId };

    const ticketQuery = Ticket.find(filter)
      .populate("author", "name email")
      .populate("book", "title book_id isbn")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    // Internal notes are only available to admins.
    if (req.user.role !== 'admin') {
      ticketQuery.select('-internalNotes -adminNotes');
    }

    const tickets = await ticketQuery;

    res.json(tickets);
  } catch (error) {
    console.error("GET Tickets Error:", error);
    res.status(500).json({
      error: "Server error fetching tickets",
    });
  }
};

const updateTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const {
      status,
      internalNote,
      assignedTo,
      aiClassification,
      aiPriority,
    } = req.body;

    let changed = false;
    console.log('Update request received:', { status, internalNote, assignedTo });

    if (status !== undefined) {
      const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` });
      }
      ticket.status = status;
      changed = true;
    }

    // Update AI classification.
    if (aiClassification !== undefined) {
      const allowedCategories = [
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'Legal & Copyright',
        'Marketing & Promotions',
        'Formatting Issues',
        'General Inquiry',
      ];

      if (
        typeof aiClassification !== 'string' ||
        !allowedCategories.includes(aiClassification)
      ) {
        return res.status(400).json({
          error: 'Invalid AI classification.',
        });
      }

      ticket.aiClassification = aiClassification;
      changed = true;
    }

    // Update AI priority.
    if (aiPriority !== undefined) {
      const allowedPriorities = [
        'Critical',
        'High',
        'Medium',
        'Low',
        'Unassigned',
      ];

      if (
        typeof aiPriority !== 'string' ||
        !allowedPriorities.includes(aiPriority)
      ) {
        return res.status(400).json({
          error: 'Invalid AI priority.',
        });
      }

      ticket.aiPriority = aiPriority;
      changed = true;
    }

    if (internalNote !== undefined) {
      if (typeof internalNote !== 'string' || !internalNote.trim()) {
        return res.status(400).json({ error: 'Internal note must be a non-empty string' });
      }
      ticket.internalNotes.push({
        author: req.user.userId || req.user.id,
        message: internalNote.trim()
      });
      changed = true;
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        ticket.assignedTo = null;
        changed = true;
      } else {
        const assigneeId = assignedTo === 'me' ? (req.user.userId || req.user.id) : assignedTo;
        if (!mongoose.isValidObjectId(assigneeId)) {
          return res.status(400).json({ error: 'Invalid admin user ID for assignment' });
        }
        const admin = await User.findOne({ _id: assigneeId, role: 'admin', status: { $ne: 'inactive' } });
        if (!admin) {
          return res.status(400).json({ error: 'Tickets can only be assigned to an active admin' });
        }
        ticket.assignedTo = admin._id;
        changed = true;
      }
    }
    console.log('Ticket update changes applied:', { status: ticket.status, assignedTo: ticket.assignedTo, internalNotesCount: ticket.internalNotes.length });

    if (!changed) {
      return res.status(400).json({
        error:
          'Provide status, internalNote, assignedTo, aiClassification, or aiPriority to update',
      });
    }

    await ticket.save();
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('author', 'name email')
      .populate('book', 'title book_id isbn')
      .populate('assignedTo', 'name email')
      .populate('internalNotes.author', 'name email');
    res.json(updatedTicket);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ error: 'Server error updating ticket' });
  }
};

// Send a public reply to the author.
// Only an admin can send a reply in this version.
const sendTicketReply = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admins only.',
      });
    }

    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid ticket ID',
      });
    }

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Reply message must not be empty.',
      });
    }

    const senderId = req.user.userId || req.user.id;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        error: 'Ticket not found',
      });
    }

    ticket.replies.push({
      sender: senderId,
      senderRole: 'admin',
      message: message.trim(),
      createdAt: new Date(),
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('author', 'name email')
      .populate('book', 'title book_id isbn')
      .populate('assignedTo', 'name email')
      .populate('replies.sender', 'name email');

    return res.status(201).json({
      message: 'Reply sent successfully.',
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Send ticket reply error:', error);
    return res.status(500).json({
      error: 'Server error sending reply',
    });
  }
};

module.exports = { createTicket, getTickets, updateTicket, sendTicketReply };
