import DbConnection from './DbConnection';

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

export const Item = connection.model('itens', itemSchema);
