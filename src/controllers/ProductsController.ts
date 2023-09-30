import { Request, Response } from 'express';
import ProductModel from '../models/ProductModel';

export default class ProductsController extends ProductModel {
  getAllProductsasync = async (req: Request, res: Response) => {
    const result = await this.Item.find({});
    return res.send(result);
  };
}
