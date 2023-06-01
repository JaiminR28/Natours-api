const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'sucess',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //  1) check if email and password actually exsit
  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  // 2) check if the user exist and check of the password is correct
  // const user = User.findOne({ email: email });
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorect email or password', 401));
  }

  // 3) Send the JWT to the client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //  1) Getting token and check of it's true
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged In!', 401));
  }
  //  2) Varification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if the user still exists
  const CurrentUser = await User.findById(decoded.id);
  if (!CurrentUser) {
    return next(
      new AppError(
        'The user belonging to this token does not no longer exist',
        401
      )
    );
  }

  // 4) check if the user changed password after the token was issued
  if (CurrentUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError(
        'User has recently changed Password. Please logIn again. ',
        401
      )
    );

  // ACESS GRANTED TO PROTECTED ROUTE
  req.user = CurrentUser;
  next();
});
