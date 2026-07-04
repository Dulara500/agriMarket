const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateLocation } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/location', authenticate, updateLocation);

module.exports = router;
