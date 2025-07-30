require('dotenv').config()
const express = require('express')
const cors = require('cors');
const logger = require('morgan')
const usersRouter = require('./routes/users')

const app = express()

// Middlewares
app.use(cors({
  origin: 'https://itransition-task4.netlify.app'
}))
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false})) //will experience run without it



// Routes🎯
app.use('/api/users', usersRouter)

app.get('/', (req, res) => {
  res.send('Welcome to the I-transition Task 4 API');
});


// ---------------⚠️
module.exports = app;