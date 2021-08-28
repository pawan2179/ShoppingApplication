const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const Product = require('./models/product');
const productsRouter = require('./routers/products');
const categoryRouter = require('./routers/categories');
const userRouter = require('./routers/users');
const orderRouter = require('./routers/orders');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/errorHandler');

//Middlewares
app.use(express.json());
app.use(morgan('tiny'));
app.use(cors());
app.use(authJwt());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + 'public/uploads'));

app.options('*', cors());

require('dotenv/config');
const api = process.env.API_URL;

//Routers
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoryRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, orderRouter)

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Database server is running');
})
.catch((err) => {
    console.log(err);
})

app.listen(3000, () => {
    console.log(api);
})