const Author = require('../models/Author');
const Book = require('../models/Book');

const EDITABLE_FIELDS = ['name', 'country', 'bio'];

// Copy only the fields we allow, so clients can't slip in _id, createdAt, etc.
function pickFields(body) {
  const picked = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
}

async function createAuthor(req, res) {
  const author = await Author.create(pickFields(req.body));
  res.status(201).json(author);
}

async function getAuthors(req, res) {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
}

async function getAuthor(req, res) {
  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'No author found with that id' });
  }
  res.json(author);
}

async function updateAuthor(req, res) {
  const author = await Author.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!author) {
    return res.status(404).json({ message: 'No author found with that id' });
  }
  res.json(author);
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
  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'No author found with that id' });
  }

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
  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'No author found with that id' });
  }

  const books = await Book.find({ author: author._id }).sort({ publishedYear: 1 });
  res.json(books);
}

async function getAuthorStats(req, res) {
  const author = await Author.findById(req.params.id);
  if (!author) {
    return res.status(404).json({ message: 'No author found with that id' });
  }

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
