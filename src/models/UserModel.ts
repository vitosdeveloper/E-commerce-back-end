import DbConnection from './DbConnection';

export default class UserModel extends DbConnection {
  static getSchema() {
    const connection = DbConnection.getConnection();
    const userSchema = {
      login: String,
      password: String,
      nome: String,
      endereco: String,
      sexo: String,
      itensComprados: [
        {
          detalhes: {
            valor: Number,
            dataDaCompra: String,
          },
          itens: [
            {
              _id: String,
              quantidade: Number,
              preco: String,
            },
          ],
        },
      ],
    };
    return connection.model('accounts', userSchema);
  }
}
