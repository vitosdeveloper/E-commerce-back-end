import DbConnection from './DbConnection';

export default class ProductModel extends DbConnection {
  static getSchema() {
    const connection = DbConnection.getConnection();
    const itemSchema = {
      productImg: String,
      productTitle: String,
      productPrice: String,
      class: String,
      status: String,
      estoque: Number,
      numDeCompras: Number,
    };
    return connection.model('itens', itemSchema);
  }
}
