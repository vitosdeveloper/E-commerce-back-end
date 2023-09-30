import ProductsController from '../controllers/ProductsController';
import Router from './Router';

export default class ProductsRoutes extends Router {
  private controller = new ProductsController();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/api/itensDaLoja', this.controller.getAllProductsasync);
    this.router.post('/api/efetuarCompra', this.controller.efetuarCompra);
    this.router.post(
      '/api/efetuarCompraPeloItem',
      this.controller.efetuarCompraPeloItem
    );
  }
}
