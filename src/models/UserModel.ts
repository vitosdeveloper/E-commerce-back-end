import DbConnection from './DbConnection';

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

export const User = connection.model('accounts', userSchema);
