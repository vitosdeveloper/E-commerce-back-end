import MainPageRoutes from './src/routes/MainPageRoutes';
import ProductsRoutes from './src/routes/ProductsRoutes';
import UserRoutes from './src/routes/UserRoutes';
import AuthRoutes from './src/routes/AuthRoutes';

require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(new MainPageRoutes().getRouter());
app.use(new ProductsRoutes().getRouter());
app.use(new UserRoutes().getRouter());
app.use(new AuthRoutes().getRouter());

app.listen(PORT, () => {
  console.log('Server conectado, porta: ' + PORT);
});

export default app;
