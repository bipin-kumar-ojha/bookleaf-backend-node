const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/usersController');

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

router.get('/', auth, requireAdmin, getUsers);
router.post('/', auth, requireAdmin, createUser);
router.put('/:id', auth, requireAdmin, updateUser);
router.delete('/:id', auth, requireAdmin, deleteUser);

module.exports = router;
