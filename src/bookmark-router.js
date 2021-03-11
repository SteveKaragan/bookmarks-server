const express = require('express');
const { isWebUri } = require('valid-url');
const xss = require('xss')
const logger = require('./logger');
const BookmarksService = require('./BookmarksService');
const bodyParser = express.json();
const bookmarksRouter = express.Router();
const jsonParser = express.json();


//const { v4: uuid } = require('uuid');
//const { bookmarks } = require('./store');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
})



bookmarksRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark))
      })
      .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, description, rating, url} = req.body
    const newBookmark = { title, description, rating, url }
    // for (const [key, value] of Object.entries(newBookmark)) {
    //     if (value == null)
    //     logger.error(`${key} is required`)
    //     return res.status(400).json({
    //         error: { message: `Missing '${key}' in request body`}
    //     })
    //}
    
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(Bookmark => {
        res
          .status(201)
          .location(`/api/bookmarks/${Bookmark.id}`)
          .json(serializeBookmark(Bookmark))
      })
      .catch(next)
    })

bookmarksRouter
  .route('/api/bookmarks/:id')
  .all((req, res, next) => {
      BookmarksService.getById(
        req.app.get('db'),
        req.params.id
      )
        .then(bookmark => {
          if (!bookmark) {
            return res.status(404).json({
              error: { message: `bookmark doesn't exist` }
            })
          }
          res.bookmark = bookmark // save the bookmark for the next middleware
          next() // don't forget to call next so the next middleware happens!
        })
        .catch(next)
    })
  .get((req, res, next) => {
    res.json(serializeBookmark(res.bookmark))
  }) 
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
        req.app.get('db'),
        req.params.id
    )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, description, rating, url } = req.body
    const bookmarkToUpdate = { title, description, rating, url }
    const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'style' or 'content'`
        }
      })
    }
    BookmarksService.updateBookmark(
      req.app.get('db'),
      req.params.id,
      bookmarkToUpdate
      )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = bookmarksRouter