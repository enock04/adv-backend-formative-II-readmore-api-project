const express = require('express');
const controller = require('../controllers/authorController');
const validateId = require('../middleware/validateId');
const { loadAuthor } = require('../middleware/loadDocument');

const router = express.Router();

router.post('/', controller.createAuthor);
router.get('/', controller.getAuthors);

// Everything below targets one author: check the id, then load it (404 if missing).
router.get('/:id', validateId, loadAuthor, controller.getAuthor);
router.put('/:id', validateId, loadAuthor, controller.updateAuthor);
router.delete('/:id', validateId, loadAuthor, controller.deleteAuthor);

router.get('/:id/books', validateId, loadAuthor, controller.getAuthorBooks);
router.get('/:id/stats', validateId, loadAuthor, controller.getAuthorStats);

module.exports = router;
