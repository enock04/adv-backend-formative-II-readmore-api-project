const express = require('express');
const controller = require('../controllers/bookController');
const validateId = require('../middleware/validateId');
const { loadBook } = require('../middleware/loadDocument');

const router = express.Router();

router.post('/', controller.createBook);
router.get('/', controller.getBooks);

router.get('/:id', validateId, loadBook, controller.getBook);
router.put('/:id', validateId, loadBook, controller.updateBook);
router.delete('/:id', validateId, loadBook, controller.deleteBook);

module.exports = router;
