import { Request, Response } from 'express';
var jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

export default class AuthController {
  checkJwt = async (req: Request, res: Response) => {
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
  };
}
