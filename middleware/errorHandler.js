function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} does not exist` });
}

// Last stop for anything a controller throws (Express 5 forwards rejected promises here).
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError') {
    const problems = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation failed', errors: problems });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for "${err.path}"` });
  }

  // express.json() throws this for malformed JSON bodies
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side' });
}

module.exports = { notFound, errorHandler };
