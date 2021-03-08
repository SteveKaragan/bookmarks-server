const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./bookmarks.fixtures')

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

describe(`GET /bookmarks`, () => {
    context(`Given no bookmarks`, () => {
        it(`responds with 200 and an empty list`, () => {
        return supertest(app)
            .get('/bookmarks')
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
            .get('/bookmarks')
            .expect(200, testbookmarks)
        })
    })
})

describe(`GET /bookmarks/:article_id`, () => {
    context(`Given no bookmarks`, () => {
        it(`responds with 404`, () => {
        const articleId = 123456
        return supertest(app)
            .get(`/bookmarks/${articleId}`)
            .expect(404, { error: { message: `Article doesn't exist` } })
        })
    })

    context('Given there are bookmarks in the database', () => {
        const testbookmarks = fixtures.makeBookmarksArray()

        beforeEach('insert bookmarks', () => {
        return db
            .into('bookmarks')
            .insert(testbookmarks)
        })

        it('responds with 200 and the specified article', () => {
        const articleId = 2
        const expectedArticle = testbookmarks[articleId - 1]
        return supertest(app)
            .get(`/bookmarks/${articleId}`)
            .expect(200, expectedArticle)
        })
    })
})