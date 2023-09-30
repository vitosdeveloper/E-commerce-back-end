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

  logar = async (req: Request, res: Response) => {
    const loginInfo = {
      user: req.body.toLogin.user.toLowerCase(),
      pass: req.body.toLogin.pass,
    };
    this.User.find({ login: loginInfo.user }, (err: unknown, result: any) => {
      //se tudo estiver certo
      if (
        result.length > 0 &&
        bcrypt.compareSync(loginInfo.pass, result[0].password)
      ) {
        const token = jwt.sign(
          {
            exp: Math.floor(Date.now() / 1000) + 30 * 60,
            data: {
              _id: result[0]._id,
              login: result[0].login,
              nome: result[0].nome,
              endereco: result[0].endereco,
              sexo: result[0].sexo,
            },
          },
          jwtSecret
        );

        return res.json({
          status: 'success',
          jwt: token,
        });
      } else if (result.length === 0) {
        return res.json({
          status: '404user',
        });
      } else if (!bcrypt.compareSync(loginInfo.pass, result[0].password)) {
        return res.json({
          status: 'wrongPass',
        });
      }
    });
  };

  editarUser = async (req: Request, res: Response) => {
    const newUser = req.body.dadosComJwt;
    const oldJwt = req.body.dadosComJwt.jwt;
    //checagem pra ver se o id do usuário é o mesmo incluso no JWT
    try {
      const decoded = jwt.verify(oldJwt, jwtSecret);
      if (decoded.data._id === newUser._id) {
        const updateResult = await this.User.findByIdAndUpdate(newUser._id, {
          endereco: newUser.endereco,
          nome: newUser.nome,
          sexo: newUser.sexo,
        });
        const newJwt = jwt.sign(
          {
            exp: Math.floor(Date.now() / 1000) + 30 * 60,
            data: {
              _id: updateResult._id,
              login: newUser.login,
              nome: newUser.nome,
              endereco: newUser.endereco,
              sexo: newUser.sexo,
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
      console.log(err);
      return res.json({
        status: 'err',
      });
    }
  };

  alimentarHistorico = async (req: Request, res: Response) => {
    try {
      const userId = req.body.dataToVerify.userId;
      const currentJwt = req.body.dataToVerify.jwt;
      const decodedJwt = jwt.verify(currentJwt, jwtSecret);
      if (userId == decodedJwt.data._id) {
        const user = await this.User.findById(userId);
        return res.json({
          status: user.itensComprados,
        });
      }
    } catch (err) {
      console.log(err);
      return res.json({
        status: err,
      });
    }
  };
}
