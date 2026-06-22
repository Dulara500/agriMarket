const express = require('express');
const router = express.Router();
const { getAllProducts, getCategories, getProduct, getProductFarmers } = require('../controllers/productController');

router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.get('/:id/farmers', getProductFarmers);

module.exports = router;
