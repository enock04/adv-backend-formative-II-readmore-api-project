const express = require('express');
const controller = require('../controllers/bookController');
const validateId = require('../middleware/validateId');

const router = express.Router();

router.post('/', controller.createBook);
router.get('/', controller.getBooks);
router.get('/:id', validateId, controller.getBook);
router.put('/:id', validateId, controller.updateBook);
router.delete('/:id', validateId, controller.deleteBook);

module.exports = router;
