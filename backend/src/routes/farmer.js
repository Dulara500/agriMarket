const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getMyProducts, getAllProductsForFarmer, addProduct, updateStock, removeProduct, getFarmerStats, getEarnings, createProductRequest, getMyProductRequests } = require('../controllers/farmerController');

router.use(authenticate, requireRole('farmer'));
router.get('/stats', getFarmerStats);
router.get('/earnings', getEarnings);
router.get('/available-products', getAllProductsForFarmer);
router.get('/products', getMyProducts);
router.post('/products', addProduct);
router.patch('/products/:id/stock', updateStock);
router.delete('/products/:id', removeProduct);

router.post('/product-requests', createProductRequest);
router.get('/product-requests', getMyProductRequests);

module.exports = router;
