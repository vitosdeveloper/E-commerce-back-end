import { ObjectId } from 'mongodb';

export interface IProductFrom {
  _id?: ObjectId;
  quantidade: number;
  preco: string;
}
