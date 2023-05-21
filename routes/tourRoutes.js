const express = require('express');
const tourController = require('../controllers/tourController');
const router = express.Router();

router.param('id', tourController.checkID);
//Create a checkBodymiddleware

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.chechBody, tourController.addTour);
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.modifyTour)
  .delete(tourController.deleteTour);

module.exports = router;
