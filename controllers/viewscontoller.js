const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  //  1) Get tour data from collection
  const tours = await Tour.find();
  console.log(tours[0].slug);

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
  // 2) Build template

  // 3) Render that template using the tour data from 1)

  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour,
  });
});
