import MainPageController from '../controllers/MainPageController';
import Router from './Router';

export default class MainPageRoutes extends Router {
  private controller = new MainPageController();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/api/', this.controller.showStaticPage);
  }
}
