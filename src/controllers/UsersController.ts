import { Request, Response } from 'express';
import ProductModel from '../models/ProductModel';
import { IProductFrom } from '../helpers/types';
import UserModel from '../models/UserModel';
var jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const bcrypt = require('bcrypt');
const saltRounds = process.env.SALTYSALTY;

export default class UsersController {
  private Item: any;
  private User: any;
  constructor() {
    this.Item = ProductModel.getSchema();
    this.User = UserModel.getSchema();
  }

  registerUser = async (req: Request, res: Response) => {
    //lembrar de logar com o user em minusculo
    const user = {
      login: req.body.toRegister.user.toLowerCase(),
      password: req.body.toRegister.pass,
      repeatPassword: req.body.toRegister.repeatPass,
    };
    const result = await this.User.find({ login: user.login });
    if (result.length > 0) {
      return res.json({
        status: 'err',
      });
    } else {
      const salt = bcrypt.genSaltSync(parseInt(saltRounds as string));
      const hashedPass = bcrypt.hashSync(user.password, salt);
      const toRegister = {
        login: user.login,
        nome: 'User',
        password: hashedPass,
        endereco: '',
        sexo: 'Prefiro não informar',
        itensComprados: [],
      };
      const userSave = new this.User(toRegister);
      userSave.save();
      return res.json({
        status: 'success',
      });
    }
  };
}
