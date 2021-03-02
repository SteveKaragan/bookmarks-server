const { v4: uuid } = require('uuid');

const bookmarks = [
    {
        id: uuid(),
        title: "How to",
        description: "Yodle",
        rating: 3,
        url: "https://www.thinkful1.com"},
    {
        id: uuid(),
        title: "Eating",
        description: "Restaurants",
        rating: 2,
        url: "https://www.thinkful2.com"},
    {
        id: "cjozyzcil0000lxygs3gyg2mr",
        title: "Thinkful",
        description: "Think outside the classroom",
        rating: 5,
        url: "https://www.thinkful.com"},    
  ]

module.exports = { bookmarks }