const mongoose = require('mongoose');

// Range rules for price / publishedYear live in the controller on purpose:
// they have to answer with 422, which a schema validator (400) can't do cleanly.
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    genre: { type: String, required: [true, 'Genre is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'] },
    publishedYear: { type: Number, required: [true, 'Published year is required'] },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author id is required'],
    },
  },
  { timestamps: true }
);

// Speeds up "books by author" lookups and the duplicate-title check.
bookSchema.index({ author: 1, title: 1 });

module.exports = mongoose.model('Book', bookSchema);
