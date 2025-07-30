require('dotenv').config()
const express = require('express')
const cors = require('cors');
const logger = require('morgan')
const usersRouter = require('./routes/users')

const app = express()

// Middlewares
app.use(cors({
  origin: '*'
}))
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false})) //will experience run without it



// Routes🎯
app.use('/api/users', usersRouter)


// ---------------⚠️
module.exports = app;