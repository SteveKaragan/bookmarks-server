const express = require('express')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const { bookmarks } = require('./store')
const { isWebUri } = require('valid-url')

bookmarksRouter
  .route('/bookmarks')
  .get((req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
        if (!req.body[field]) {
          logger.error(`${field} is required`)
          return res.status(400).send(`'${field}' is required`)
        }
      }
    const { title, description='', rating, url } = req.body;
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
        logger.error(`Invalid rating '${rating}' supplied`)
        return res.status(400).send(`'rating' must be a number between 0 and 5`)
      }
  
    if (!isWebUri(url)) {
        logger.error(`Invalid url '${url}' supplied`)
        return res.status(400).send(`'url' must be a valid URL`)
      }

    const id = uuid();

    const bookmark = {
        id,
        title,
        description,
        rating,
        url
    }

    bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/list/${id}`)
        .json({id});
  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(c => c.id == id);

    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Bookmark Not Found');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(book => book.id == id);

    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Not Found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
        .status(204)
        .end();
  })

module.exports = bookmarksRouter