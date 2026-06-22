const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { createOrder, getOrders, getOrder, updateOrderStatus, reviewOrder } = require('../controllers/orderController');

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/review', reviewOrder);

module.exports = router;
