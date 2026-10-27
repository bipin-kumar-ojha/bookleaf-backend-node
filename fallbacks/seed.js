const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User'); // Ensure path is correct
const Book = require('../models/Book'); // Ensure path is correct

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Clear existing data to avoid duplicates during testing
    await User.deleteMany();
    await Book.deleteMany();

    // 3. Read the JSON file
    const rawData = fs.readFileSync(path.join(__dirname, '../bookleaf_sample_data.json'), 'utf-8');
    const jsonData = JSON.parse(rawData);
    const authorsData = jsonData.authors;

    // 4. Generate a default hashed password ('password123') for all users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 5. Loop through the JSON data and save to MongoDB
    for (const author of authorsData) {
      const newUser = await User.create({
        author_id: author.author_id,
        name: author.name,
        email: author.email,
        password: hashedPassword,
        phone: author.phone,
        city: author.city,
        role: 'author',
        joined_date: author.joined_date
      });

      // Save each book for this author
      for (const book of author.books) {
        await Book.create({
          author: newUser._id,
          ...book
        });
      }
    }

    // 6. Create one Admin account for the admin portal testing
    await User.create({
      author_id: 'ADMIN001',
      name: 'BookLeaf Admin',
      email: 'admin@bookleaf.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Sample data and Admin account seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
