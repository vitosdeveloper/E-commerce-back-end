export default class DbConnection {
  static getConnection() {
    let mongoose;
    if (!mongoose) {
      mongoose = require('mongoose');
      mongoose.connect(process.env.MONGO_CONNECT);
    }
    return mongoose;
  }
}
