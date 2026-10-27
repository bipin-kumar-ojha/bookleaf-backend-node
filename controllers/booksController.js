const Book = require('../models/Book');
const User = require('../models/User');

const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ author: req.user.userId });
    const formattedBooks = books.map(book => ({
      _id: book._id,
      author: book.author,
      book_id: book.book_id,
      title: book.title,
      isbn: book.isbn || 'N/A',
      genre: book.genre || 'N/A',
      publication_date: book.publication_date,
      status: book.status || 'Unknown',
      mrp: book.mrp ?? 0,
      total_copies_sold: book.total_copies_sold ?? 0,
      total_royalty_earned: book.total_royalty_earned ?? 0,
      royalty_paid: book.royalty_paid ?? 0,
      royalty_pending: book.royalty_pending ?? 0,
      available_on: book.available_on ?? [],
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    }));

    res.json(formattedBooks);
  } catch (err) {
    console.error('Error fetching books:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
};

module.exports = { getBooks };
