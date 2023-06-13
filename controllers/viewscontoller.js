const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //  1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using the tour data from 1)
  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //  1) get the data, for the requested tour(including reviews and guides);
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name ', 404));
  }
  // 2) Build template
  // 3) Render that template using the tour data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour,
  });
});

exports.getLogInForm = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'your account',
  });
};
