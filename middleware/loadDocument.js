const Author = require('../models/Author');
const Book = require('../models/Book');

// Builds a middleware that fetches the document named by :id and stores it on
// req[key]. If it doesn't exist the request ends here with a 404.
function loadDocument(Model, key, label) {
  return async function (req, res, next) {
    const doc = await Model.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: `No ${label} found with that id` });
    }
    req[key] = doc;
    next();
  };
}

module.exports = {
  loadAuthor: loadDocument(Author, 'author', 'author'),
  loadBook: loadDocument(Book, 'book', 'book'),
};
