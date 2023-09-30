import DbConnection from './DbConnection';

export default class ProductModel extends DbConnection {
  private connection = DbConnection.getConnection();
  private itemSchema = {
    productImg: String,
    productTitle: String,
    productPrice: String,
    class: String,
    status: String,
    estoque: Number,
    numDeCompras: Number,
  };
  protected Item = this.connection.model('itens', this.itemSchema);
}
