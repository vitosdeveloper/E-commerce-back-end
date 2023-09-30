import { Request, Response } from 'express';
import { IProductFrom } from '../helpers/types';
import { Item } from '../models/ProductModel';
import { User } from '../models/UserModel';
var jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

export default class ProductsController {
  private Item: any;
  private User: any;
  constructor() {
    this.Item = Item;
    this.User = User;
  }

  getAllProductsasync = async (req: Request, res: Response) => {
    const result = await this.Item.find({});
    return res.send(result);
  };

  efetuarCompra = async (req: Request, res: Response) => {
    const oldJwt = req.body.formulario.jwt;
    const form = req.body.formulario;
    const returnError = () => {
      return res.json({
        status: 'err',
      });
    };
    const stockCheck = form.itensByIdAndItsQuantity.map(
      async (item: IProductFrom) => {
        let mapResult = false;
        const quantidadeDesseItem = item.quantidade;
        const resultItem = await this.Item.findById(item._id);
        if (resultItem.estoque < quantidadeDesseItem) {
          mapResult = true;
        }
        return mapResult;
      }
    );
    const checkResults = await Promise.all(stockCheck);
    //se nao tiver algo no estoque
    if (checkResults.includes(true)) {
      return res.json({
        status: 'estoqueFail',
      });
      //se tiver tudo em ordem no estoque
    } else {
      try {
        const decoded = jwt.verify(oldJwt, jwtSecret);
        if (decoded.data._id === form.userId) {
          const result = await this.User.findById(form.userId);
          const whatToChange = [
            ...result.itensComprados,
            {
              detalhes: {
                valor: form.valorDaCompra,
                dataDaCompra: form.horarioDeCompra,
              },
              itens: form.itensByIdAndItsQuantity,
            },
          ];
          await this.User.findByIdAndUpdate(form.userId, {
            itensComprados: whatToChange,
          });
          //
          const updatedUser = await this.User.findById(form.userId);
          //checa se tem os itens no estoque pra continuar
          form.itensByIdAndItsQuantity.forEach(async (item: IProductFrom) => {
            const quantidadeDesseItem = item.quantidade;
            const resultItem = await this.Item.findById(item._id);
            await this.Item.findByIdAndUpdate(item._id, {
              estoque: resultItem.estoque - quantidadeDesseItem,
            });
            await this.Item.findByIdAndUpdate(item._id, {
              numDeCompras: resultItem.numDeCompras + quantidadeDesseItem,
            });
          });
          const newJwt = jwt.sign(
            {
              exp: Math.floor(Date.now() / 1000) + 30 * 60,
              data: {
                _id: updatedUser._id,
                login: updatedUser.login,
                nome: updatedUser.nome,
                endereco: updatedUser.endereco,
                sexo: updatedUser.sexo,
              },
            },
            jwtSecret
          );
          return res.json({
            status: 'success',
            jwt: newJwt,
          });
        }
      } catch (err) {
        returnError();
      }
    }
  };

  efetuarCompraPeloItem = async (req: Request, res: Response) => {
    const form = req.body.formulario;
    const item = form.itensByIdAndItsQuantity;
    const quantidadeDesseItem = form.itensByIdAndItsQuantity.quantidade;
    const oldJwt = form.jwt;
    const returnError = async (erro: unknown) => {
      return res.json({
        status: erro,
      });
    };
    try {
      const decoded = jwt.verify(oldJwt, jwtSecret);
      if (decoded.data._id === form.userId) {
        const result = await this.User.findById(form.userId);
        const whatToChange = [
          ...result.itensComprados,
          {
            detalhes: {
              valor: form.valorDaCompra,
              dataDaCompra: form.horarioDeCompra,
            },
            itens: form.itensByIdAndItsQuantity,
          },
        ];
        const itemToBuy = await this.Item.findById(item._id);
        if (itemToBuy.estoque >= quantidadeDesseItem) {
          await this.Item.findByIdAndUpdate(item._id, {
            estoque: itemToBuy.estoque - quantidadeDesseItem,
          });
          await this.Item.findByIdAndUpdate(item._id, {
            numDeCompras: itemToBuy.numDeCompras + quantidadeDesseItem,
          });
          await this.User.findByIdAndUpdate(form.userId, {
            itensComprados: whatToChange,
          });
          const updatedUser = await this.User.findById(form.userId);
          const newJwt = jwt.sign(
            {
              exp: Math.floor(Date.now() / 1000) + 30 * 60,
              data: {
                _id: updatedUser._id,
                login: updatedUser.login,
                nome: updatedUser.nome,
                endereco: updatedUser.endereco,
                sexo: updatedUser.sexo,
              },
            },
            jwtSecret
          );
          return res.json({
            status: 'success',
            jwt: newJwt,
          });
        } else {
          returnError('estoqueFail');
        }
      }
    } catch (err) {
      returnError('err');
    }
  };
}
