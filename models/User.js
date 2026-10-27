const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  author_id: { type: String, unique: true }, 
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  phone: { type: String },
  city: { type: String },
  role: { type: String, enum: ['author', 'admin'], default: 'author' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joined_date: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
