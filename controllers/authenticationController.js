const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

// eslint-disable-next-line arrow-body-style
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
    role: req.body.role,
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

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.roles)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //  1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('There is no user that exsist with email address.', 404)
    );
  }
  // 2) Generate the random reset token
  const resetToken = await user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  //  3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot you password ? No worry. Submit a  PATCH request with your new password and confirmpassword to: ${resetURL}.\n If you didn't forgot your password, please ignore this email !`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password rest token ( valid for 10 min only)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to mail',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error sending the email. Try again later', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //  1) get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token not expired, and there is a user, set the niew password
  if (!user) {
    return next(new AppError('token is invalid or expired. Try again', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const token = signToken(user._id);

  // 3) update changedPasswordAt property for the user
  //  4) Log the user in, send the JWT
  res.status(200).json({
    status: 'success',
    token,
  });
});
