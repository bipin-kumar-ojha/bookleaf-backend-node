const bcrypt = require('bcryptjs');
const User = require('../models/User');

const publicUser = user => ({
  id: user._id,
  author_id: user.author_id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || 'active',
  joined_date: user.joined_date,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map(publicUser));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { author_id, name, email, password, role, joined_date } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      author_id,
      name,
      email,
      password: hashedPassword,
      role,
      joined_date
    });

    res.status(201).json({ message: 'User created successfully', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A user with that email or author ID already exists' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const allowedFields = ['author_id', 'name', 'email', 'role', 'status', 'joined_date'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated successfully', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A user with that email or author ID already exists' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user data or user ID' });
    }
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deactivated successfully', user: publicUser(user) });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Server error deactivating user' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
