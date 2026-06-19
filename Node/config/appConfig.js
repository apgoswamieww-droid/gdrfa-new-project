const express = require('express');
const path = require('path');
const session = require('express-session');
const responseFormatter = require('../middlewares/responseFormatter');

require('dotenv').config();

const configureApp = (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        }
    }));
    app.use(responseFormatter);
};

module.exports = configureApp;
