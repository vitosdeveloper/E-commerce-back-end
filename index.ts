import { Request, Response } from 'express';
import MainPageRoutes from './src/routes/MainPageRoutes';
import ProductsRoutes from './src/routes/ProductsRoutes';
import UserRoutes from './src/routes/UserRoutes';

const express = require('express');
const PORT = process.env.PORT || 5000;
const cors = require('cors');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(new MainPageRoutes().getRouter());
app.use(new ProductsRoutes().getRouter());
app.use(new UserRoutes().getRouter());

const saltRounds = process.env.SALTYSALTY;
const jwtSecret = process.env.JWT_SECRET;

//registrar usuario
// app.post('/api/registerUser', async (req: Request, res: Response) => {
//   //lembrar de logar com o user em minusculo
//   const user = {
//     login: req.body.toRegister.user.toLowerCase(),
//     password: req.body.toRegister.pass,
//     repeatPassword: req.body.toRegister.repeatPass,
//   };
//   const result = await User.find({ login: user.login });
//   if (result.length > 0) {
//     return res.json({
//       status: 'err',
//     });
//   } else {
//     const salt = bcrypt.genSaltSync(parseInt(saltRounds as string));
//     const hashedPass = bcrypt.hashSync(user.password, salt);
//     const toRegister = {
//       login: user.login,
//       nome: 'User',
//       password: hashedPass,
//       endereco: '',
//       sexo: 'Prefiro não informar',
//       itensComprados: [],
//     };
//     const userSave = new User(toRegister);
//     userSave.save();
//     return res.json({
//       status: 'success',
//     });
//   }
// });

app.post('/api/logar', (req: Request, res: Response) => {
  const loginInfo = {
    user: req.body.toLogin.user.toLowerCase(),
    pass: req.body.toLogin.pass,
  };
  User.find({ login: loginInfo.user }, (err: unknown, result: any) => {
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
});

app.post('/api/checkJwt', async (req: Request, res: Response) => {
  const jwtToCheck = req.body.jwt;
  try {
    const decoded = jwt.verify(jwtToCheck, jwtSecret);
    return res.json({
      status: 'ok',
      user: decoded.data,
    });
  } catch (err) {
    return res.json({
      status: 'err',
    });
  }
});

app.post('/api/editarUser', async (req: Request, res: Response) => {
  const newUser = req.body.dadosComJwt;
  const oldJwt = req.body.dadosComJwt.jwt;
  //checagem pra ver se o id do usuário é o mesmo incluso no JWT
  try {
    const decoded = jwt.verify(oldJwt, jwtSecret);
    if (decoded.data._id === newUser._id) {
      const updateResult = await User.findByIdAndUpdate(newUser._id, {
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
});

app.post('/api/alimentarHistorico', async (req: Request, res: Response) => {
  try {
    const userId = req.body.dataToVerify.userId;
    const currentJwt = req.body.dataToVerify.jwt;
    const decodedJwt = jwt.verify(currentJwt, jwtSecret);
    if (userId == decodedJwt.data._id) {
      const user = await User.findById(userId);
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
});

app.listen(PORT, () => {
  console.log('Server conectado, porta: ' + PORT);
});

export default app;
