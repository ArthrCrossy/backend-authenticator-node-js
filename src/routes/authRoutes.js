const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

router.get('/profile', authMiddleware, AuthController.getProfile);
router.get('/users', authMiddleware, AuthController.getAllUsers);
router.get('/test', (req, res) => res.json({ message: 'teste!' }))
router.get("/names", AuthController.getAllNames);

module.exports = router;