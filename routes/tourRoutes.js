const express = require('express');
const tourController = require('../controllers/tourController');
const authenticationController = require('../controllers/authenticationController');

const router = express.Router();

// router.param('id', tourController.checkID);
//Create a checkBodymiddleware

router.route('/tour-stats').get(tourController.getTourStats);

router.route('/montly-Plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(authenticationController.protect, tourController.getAllTours)
  .post(tourController.addTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.modifyTour)
  .delete(tourController.deleteTour);

module.exports = router;
