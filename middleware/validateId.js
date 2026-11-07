const mongoose = require('mongoose');

// Rejects ids that aren't valid ObjectIds before they reach Mongoose,
// so a typo like /authors/abc gives a clear 400 instead of a cast error.
function validateId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: `"${req.params.id}" is not a valid id` });
  }
  next();
}

module.exports = validateId;
