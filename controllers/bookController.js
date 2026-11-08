const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

const EDITABLE_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const SORTABLE_FIELDS = ['price', 'title', 'publishedYear'];
const EARLIEST_YEAR = 1450; // roughly when the printing press arrived

function pickFields(body) {
  const picked = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) picked[field] = body[field];
  }
  return picked;
}

// Rule 3: things the schema can't express. Returns an error message, or null if fine.
function checkBusinessRanges({ price, publishedYear }) {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return 'price must be a number';
  }
  if (price <= 0) {
    return 'price must be greater than zero';
  }
  if (!Number.isInteger(publishedYear)) {
    return 'publishedYear must be a whole number';
  }
  const thisYear = new Date().getFullYear();
  if (publishedYear > thisYear) {
    return `publishedYear cannot be in the future (latest allowed: ${thisYear})`;
  }
  if (publishedYear < EARLIEST_YEAR) {
    return `publishedYear cannot be before ${EARLIEST_YEAR}`;
  }
  return null;
}

// Rule 2: same title (any casing) for the same author. `ignoreId` lets an update skip itself.
async function titleTakenByAuthor(title, authorId, ignoreId) {
  const filter = { author: authorId, title };
  if (ignoreId) filter._id = { $ne: ignoreId };

  // strength 2 = case-insensitive compare, and no regex escaping needed
  return Book.exists(filter).collation({ locale: 'en', strength: 2 });
}

// Rule 1: the author id must point at a real author.
async function authorExists(authorId) {
  if (!mongoose.isValidObjectId(authorId)) return false;
  return Boolean(await Author.exists({ _id: authorId }));
}

// Runs rules 1-3 on a full book payload. Returns { status, message } on failure, null if clean.
async function checkBook(data, ignoreId) {
  if (!(await authorExists(data.author))) {
    return { status: 400, message: 'That author does not exist, so the book cannot be saved' };
  }

  const rangeProblem = checkBusinessRanges(data);
  if (rangeProblem) {
    return { status: 422, message: rangeProblem };
  }

  if (await titleTakenByAuthor(data.title, data.author, ignoreId)) {
    return { status: 409, message: `This author already has a book titled "${data.title}"` };
  }

  return null;
}

async function createBook(req, res) {
  const data = pickFields(req.body);

  // Let the schema report missing required fields first (400)
  await new Book(data).validate();

  const problem = await checkBook(data);
  if (problem) {
    return res.status(problem.status).json({ message: problem.message });
  }

  const book = await Book.create(data);
  await book.populate('author');
  res.status(201).json(book);
}

// Rule 5: only the query params that were actually sent become part of the filter.
function buildFilter(query) {
  const filter = {};

  if (query.genre) {
    filter.genre = new RegExp(`^${escapeRegex(query.genre)}$`, 'i');
  }
  if (query.author) {
    filter.author = query.author;
  }
  if (query.search) {
    filter.title = new RegExp(escapeRegex(query.search), 'i');
  }

  const price = {};
  if (query.minPrice !== undefined) price.$gte = Number(query.minPrice);
  if (query.maxPrice !== undefined) price.$lte = Number(query.maxPrice);
  if (Object.keys(price).length > 0) filter.price = price;

  return filter;
}

// Stops user input like "a.b(" from being treated as regex syntax.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Returns an error message for bad query params, or null if they're usable.
function checkQuery(query) {
  for (const key of ['minPrice', 'maxPrice']) {
    if (query[key] !== undefined && Number.isNaN(Number(query[key]))) {
      return `${key} must be a number`;
    }
  }
  if (query.author !== undefined && !mongoose.isValidObjectId(query.author)) {
    return 'author must be a valid author id';
  }
  if (query.sort !== undefined && !SORTABLE_FIELDS.includes(query.sort)) {
    return `sort must be one of: ${SORTABLE_FIELDS.join(', ')}`;
  }
  if (query.order !== undefined && !['asc', 'desc'].includes(query.order)) {
    return 'order must be "asc" or "desc"';
  }
  for (const key of ['page', 'limit']) {
    if (query[key] !== undefined && !(Number.isInteger(Number(query[key])) && Number(query[key]) >= 1)) {
      return `${key} must be a positive whole number`;
    }
  }
  return null;
}

async function getBooks(req, res) {
  const problem = checkQuery(req.query);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  const filter = buildFilter(req.query);
  const sortBy = req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { createdAt: -1 };

  const total = await Book.countDocuments(filter);

  // No page/limit sent -> return everything, as the filter rules ask.
  const paginated = req.query.page !== undefined || req.query.limit !== undefined;
  const page = Number(req.query.page) || 1;
  const limit = paginated ? Number(req.query.limit) || 10 : total;

  let query = Book.find(filter).sort(sortBy).populate('author');
  if (paginated) query = query.skip((page - 1) * limit).limit(limit);

  const results = await query;
  res.json({ page, limit, total, results });
}

async function getBook(req, res) {
  const book = await Book.findById(req.params.id).populate('author');
  if (!book) {
    return res.status(404).json({ message: 'No book found with that id' });
  }
  res.json(book);
}

async function updateBook(req, res) {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'No book found with that id' });
  }

  // Merge the changes over what's stored, then check the finished result as a whole.
  const merged = { ...book.toObject(), ...pickFields(req.body) };
  const problem = await checkBook(merged, book._id);
  if (problem) {
    return res.status(problem.status).json({ message: problem.message });
  }

  book.set(pickFields(req.body));
  await book.save();
  await book.populate('author');
  res.json(book);
}

async function deleteBook(req, res) {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'No book found with that id' });
  }
  res.json({ message: `Book "${book.title}" deleted` });
}

module.exports = { createBook, getBooks, getBook, updateBook, deleteBook };
