const express = require('express');
const controller = require('../controllers/authorController');
const validateId = require('../middleware/validateId');

const router = express.Router();

router.post('/', controller.createAuthor);
router.get('/', controller.getAuthors);
router.get('/:id', validateId, controller.getAuthor);
router.put('/:id', validateId, controller.updateAuthor);
router.delete('/:id', validateId, controller.deleteAuthor);

router.get('/:id/books', validateId, controller.getAuthorBooks);
router.get('/:id/stats', validateId, controller.getAuthorStats);

module.exports = router;
