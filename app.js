const fs = require('fs');
const express = require('express');
const { dirname } = require('path');
const morgan = require('morgan');

const app = express();

// 1) MIDDLEWARES
app.use(morgan('dev'));
app.use(express.json());

// app.get('/', (req, res) => {
//         res.status(200).json({message:'Hello from the server side', app: 'Natours'})
// })

app.use((req, res, next) => {
  console.log('Hello from the middleware !!');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const _dirname = dirname(__filename);
const tours = JSON.parse(
  fs.readFileSync(`${_dirname}/dev-data/data/tours-simple.json`)
);

// ROUTE HANDLERS
const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

const getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

const addTour = (req, res) => {
  // console.log(req.body);
  const newID = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newID }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${_dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

const modifyTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: '< Updated tour here>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: '<this route has not been implemented yet>',
  });
};
const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: '<this route has not been implemented yet>',
  });
};
const createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: '<this route has not been implemented yet>',
  });
};
const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: '<this route has not been implemented yet>',
  });
};
const modifyUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: '<this route has not been implemented yet>',
  });
};

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', addTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', modifyTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3. ROUTES
const tourRouter = express.Router();
const userRouter = express.Router();

tourRouter.route('/').get(getAllTours).post(addTour);
tourRouter.route('/:id').get(getTour).patch(modifyTour).delete(deleteTour);

userRouter.route('/').get(getAllUsers).post(createUser);
userRouter.route('/:id').get(getUser).patch(modifyUser).delete(deleteUser);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// 4. START THE SERVER
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});
