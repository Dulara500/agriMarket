const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProducts, createProduct, updateProduct, setPrice, getUsers, updateUser, getAnalytics, getProductRequests, approveProductRequest, rejectProductRequest } = require('../controllers/adminController');
const { getTypes, createType, updateType, getBranches, createBranch, updateBranch, getPrograms, createProgram, updateProgram, adjustQuantity, getProgramAllocations, collectAllocationAdmin, updateAllocationStatus } = require('../controllers/fertilizerController');

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

// Fertilizer system
router.get('/fertilizers/types', getTypes);
router.post('/fertilizers/types', createType);
router.patch('/fertilizers/types/:id', updateType);
router.get('/fertilizers/branches', getBranches);
router.post('/fertilizers/branches', createBranch);
router.patch('/fertilizers/branches/:id', updateBranch);
router.get('/fertilizers/programs', getPrograms);
router.post('/fertilizers/programs', createProgram);
router.patch('/fertilizers/programs/:id', updateProgram);
router.patch('/fertilizers/programs/:id/quantity', adjustQuantity);
router.get('/fertilizers/programs/:id/allocations', getProgramAllocations);
router.post('/fertilizers/programs/:id/collect', collectAllocationAdmin);
router.patch('/fertilizers/allocations/:id/status', updateAllocationStatus);

module.exports = router;
