const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getMyProducts, getAllProductsForFarmer, addProduct, updateStock, removeProduct, getFarmerStats, getEarnings, getLowStockProducts, createProductRequest, getMyProductRequests } = require('../controllers/farmerController');
const { getFarmerPrograms, claimAllocation, getMyClaims } = require('../controllers/fertilizerController');

router.use(authenticate, requireRole('farmer'));
router.get('/stats', getFarmerStats);
router.get('/earnings', getEarnings);
router.get('/available-products', getAllProductsForFarmer);
router.get('/products', getMyProducts);
router.get('/low-stock', getLowStockProducts);
router.post('/products', addProduct);
router.patch('/products/:id/stock', updateStock);
router.delete('/products/:id', removeProduct);

router.post('/product-requests', createProductRequest);
router.get('/product-requests', getMyProductRequests);

// Fertilizer allocations
router.get('/fertilizers', getFarmerPrograms);
router.get('/fertilizers/my-claims', getMyClaims);
router.post('/fertilizers/:programId/claim', claimAllocation);

module.exports = router;
