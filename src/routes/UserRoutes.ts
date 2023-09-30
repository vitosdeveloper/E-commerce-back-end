import UsersController from '../controllers/UsersController';
import Router from './Router';

export default class UserRoutes extends Router {
  private controller = new UsersController();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/api/registerUser', this.controller.registerUser);
    this.router.post('/api/logar', this.controller.logar);
    this.router.post('/api/editarUser', this.controller.editarUser);
    this.router.post(
      '/api/alimentarHistorico',
      this.controller.alimentarHistorico
    );
  }
}
