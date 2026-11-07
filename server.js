require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4000;

// Only start listening once Mongo is reachable, otherwise every request would hang.
connectDB()
  .then(() => {
    // Express 5 hands listen errors (e.g. port already in use) to the callback.
    app.listen(PORT, (err) => {
      if (err) {
        console.error(`Could not bind to port ${PORT}:`, err.message);
        process.exit(1);
      }
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
