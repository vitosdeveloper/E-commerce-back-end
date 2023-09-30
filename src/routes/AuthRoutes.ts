import AuthController from '../controllers/AuthController';
import Router from './Router';

export default class AuthRoutes extends Router {
  private controller = new AuthController();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/api/checkJwt', this.controller.checkJwt);
  }
}
