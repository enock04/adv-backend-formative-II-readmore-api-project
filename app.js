const express = require('express');
const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ReadMore API is up and running' });
});

app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
