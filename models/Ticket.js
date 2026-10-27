
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Optional: a ticket can be created without a book
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
    },

    subject: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },

    // AI-generated or admin-edited classification
    aiClassification: {
      type: String,
      enum: [
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'Legal & Copyright',
        'Marketing & Promotions',
        'Formatting Issues',
        'General Inquiry',
      ],
      default: null,
    },

    // AI-generated or admin-edited priority
    aiPriority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low', 'Unassigned'],
      default: 'Unassigned',
    },

    aiDraftResponse: {
      type: String,
    },

    adminResponse: {
      type: String,
    },

    adminNotes: {
      type: String,
    },

    internalNotes: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    replies: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderRole: {
          type: String,
          enum: ['admin', 'author'],
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
