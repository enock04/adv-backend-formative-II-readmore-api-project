const Author = require('../models/Author');
const Book = require('../models/Book');
const pickFields = require('../utils/pickFields');

const EDITABLE_FIELDS = ['name', 'country', 'bio'];

// For every handler below that takes an :id, the loadAuthor middleware has
// already fetched the author into req.author (or answered 404).

async function createAuthor(req, res) {
  const author = await Author.create(pickFields(req.body, EDITABLE_FIELDS));
  res.status(201).json(author);
}

async function getAuthors(req, res) {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
}

function getAuthor(req, res) {
  res.json(req.author);
}

async function updateAuthor(req, res) {
  req.author.set(pickFields(req.body, EDITABLE_FIELDS));
  await req.author.save(); // save() runs the schema validators
  res.json(req.author);
}

/*
 * Delete policy: BLOCK (option A).
 * An author who still has books can't be deleted; the client gets a 409 and
 * has to remove or reassign those books first.
 * Why: a bookstore's catalogue is tied to sales and order history, so silently
 * wiping books (cascade) or guessing a fallback author (reassign) is the kind of
 * mistake you can't take back. Downside: more friction, since someone has to
 * clear the books by hand before the author can go.
 */
async function deleteAuthor(req, res) {
  const { author } = req;

  const bookCount = await Book.countDocuments({ author: author._id });
  if (bookCount > 0) {
    return res.status(409).json({
      message: `Cannot delete ${author.name}: they still have ${bookCount} book(s). Delete or reassign those books first.`,
      bookCount,
    });
  }

  await author.deleteOne();
  res.json({ message: `Author ${author.name} deleted` });
}

async function getAuthorBooks(req, res) {
  const books = await Book.find({ author: req.author._id }).sort({ publishedYear: 1 });
  res.json(books);
}

async function getAuthorStats(req, res) {
  const { author } = req;
  const books = await Book.find({ author: author._id }).sort({ price: 1 });

  // No books yet: 0 for the numbers, null for the titles (there is nothing to name).
  if (books.length === 0) {
    return res.json({
      author: author.name,
      bookCount: 0,
      averagePrice: 0,
      cheapestBook: null,
      mostExpensiveBook: null,
    });
  }

  const total = books.reduce((sum, book) => sum + book.price, 0);

  res.json({
    author: author.name,
    bookCount: books.length,
    averagePrice: Math.round((total / books.length) * 100) / 100,
    cheapestBook: books[0].title,
    mostExpensiveBook: books[books.length - 1].title,
  });
}

module.exports = {
  createAuthor,
  getAuthors,
  getAuthor,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
  getAuthorStats,
};
