const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProducts, createProduct, updateProduct, setPrice, getUsers, updateUser, getAnalytics, getProductRequests, approveProductRequest, rejectProductRequest } = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));
router.get('/products', getProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.post('/products/:id/price', setPrice);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.get('/analytics', getAnalytics);

router.get('/product-requests', getProductRequests);
router.patch('/product-requests/:id/approve', approveProductRequest);
router.patch('/product-requests/:id/reject', rejectProductRequest);

module.exports = router;
