const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
        client: 'pg',
        connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe(`Unauthorized requests`, () => {
        const testBookmarks = fixtures.makeBookmarksArray()
    
        beforeEach('insert bookmarks', () => {
          return db
            .into('bookmarks')
            .insert(testBookmarks)
        })
    
        it(`responds with 401 Unauthorized for GET /api/bookmarks`, () => {
          return supertest(app)
            .get('/api/bookmarks')
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for POST /api/bookmarks`, () => {
          return supertest(app)
            .post('/api/bookmarks')
            .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for GET /api/bookmarks/:id`, () => {
          const secondBookmark = testBookmarks[1]
          return supertest(app)
            .get(`/api/bookmarks/${secondBookmark.id}`)
            .expect(401, { error: 'Unauthorized request' })
        })
    
        it(`responds with 401 Unauthorized for DELETE /api/bookmarks/:id`, () => {
          const aBookmark = testBookmarks[1]
          return supertest(app)
            .delete(`/api/bookmarks/${aBookmark.id}`)
            .expect(401, { error: 'Unauthorized request' })
        })
      })

    describe(`GET /api/bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
            return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, [])
            })
        })
        
        context('Given there are bookmarks in the database', () => {
            const testbookmarks = fixtures.makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testbookmarks)
            })

            it('responds with 200 and all of the bookmarks', () => {
            return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testbookmarks)
            })
        })
    })
    describe(`GET /api/bookmarks/:Bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
            const BookmarkId = 123456
            return supertest(app)
                .get(`/api/bookmarks/${BookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(404, { error: { message: `bookmark doesn't exist` } })
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testbookmarks = fixtures.makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testbookmarks)
            })

            it('responds with 200 and the specified Bookmark', () => {
            const BookmarkId = 2
            const expectedBookmark = testbookmarks[BookmarkId - 1]
            return supertest(app)
                .get(`/api/bookmarks/${BookmarkId}`)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, expectedBookmark)
            })
        })
    })
    describe('POST /api/bookmarks', () => {
        it (`creates a bookmark, responding with 201 and the new bookmark`, function() {
            const newBookmark = {
                title: 'Test new Bookmark',
                description: 'Listicle',
                rating: 5,
                url: 'http//: google.com'
            }
            return supertest(app)   
                .post('/api/bookmarks')
                .send(newBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                )
            }) 
        })
        const requiredFields = ['title', 'rating', 'url']

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new Bookmark',
                rating: 5,
                url: 'http//: google.com'
            }
            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmark')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
            })
        })
    })
    describe(`DELETE /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `bookmark doesn't exist`} })
            })
        })
        context('Given there are Bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray()

            beforeEach('insert Bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('responds with 204 and removes the Bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(Bookmark => Bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmarks)
                    )
            })
        })
    })
    describe.only(`PATCH /api/bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
          const testBookmarks = fixtures.makeBookmarksArray()
    
          beforeEach('insert bookmarks', () => {
            return db
              .into('bookmarks')
              .insert(testBookmarks)
          })
    
          it('responds with 204 and updates the bookmark', () => {
            const idToUpdate = 2
            const updateBookmark = {
              title: 'updated bookmark title',
            }
            const expectedBookmark = {
              ...testBookmarks[idToUpdate - 1],
              ...updateBookmark
            }
            return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .send(updateBookmark)
              .expect(204)
              .then(res =>
                supertest(app)
                  .get(`/api/bookmarks/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(expectedBookmark)
                )
          })
          it(`responds with 400 when no required fields supplied`, () => {
            const idToUpdate = 2
            return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .send({ irrelevantField: 'foo' })
              .expect(400, {
                error: {
                  message: `Request body must contain either 'title', 'style' or 'content'`
                }
              })
          })
          it(`responds with 204 when updating only a subset of fields`, () => {
            const idToUpdate = 2
            const updateBookmark = {
              title: 'updated bookmark title',
            }
            const expectedBookmark = {
              ...testBookmarks[idToUpdate - 1],
              ...updateBookmark
            }
      
            return supertest(app)
              .patch(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .send({
                ...updateBookmark,
                fieldToIgnore: 'should not be in GET response'
              })
              .expect(204)
              .then(res =>
                supertest(app)
                  .get(`/api/bookmarks/${idToUpdate}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(expectedBookmark)
              )
          })
        })  
    })
})