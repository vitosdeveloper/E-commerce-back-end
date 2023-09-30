const express = require('express');

export default class Router {
  protected router = express.Router();
  getRouter = () => this.router;
}
