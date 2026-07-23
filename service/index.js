const express = require('express');
const app = express();

const port = process.argv.length > 2 ? process.argv[2] : 3000;

const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const authCookieName = "token";

app.use(express.json());
app.use(cookieParser());

let users = [];
let notes = [];
let axolotlStats = [{}];

let apiRouter = express.Router();
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Gedidone service listening on port ${port}`);
});