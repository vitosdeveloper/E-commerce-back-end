import { Request, Response } from 'express';

export default class MainPageController {
  showStaticPage(req: Request, res: Response) {
    return res.sendFile('index.html', {
      root: './',
    });
  }
}
