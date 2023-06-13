const express = require('express');
const viewController = require('../controllers/viewscontoller');
const authController = require('../controllers/authenticationController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLogInForm);
router.get('/me', authController.protect, viewController.getAccount);

module.exports = router;
