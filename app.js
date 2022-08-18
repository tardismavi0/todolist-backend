const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');


const app = express();

// Routers
const userRouter = require('./routes/users');


app.use(cors({
    origin: '*'
}));

app.use(bodyParser.json({limit: '50mb'}));


app.use('/user', userRouter);



module.exports = app;
