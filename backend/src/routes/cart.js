const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cartController');

router.use(authenticate, requireRole('buyer'));
router.get('/', getCart);
router.post('/items', addToCart);
router.delete('/items/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
