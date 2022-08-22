const express = require('express');
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const { scheema } = mongoose;
const cors = require("cors");
const bcrypt = require("bcrypt");
//const { json } = require('express');
var jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const saltRounds = process.env.SALTYSALTY;
const jwtSecret = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGO_CONNECT);

const itemSchema = ({
    productImg: String,
    productTitle: String,
    productPrice: String,
    class: String,
    status: String,
    estoque: Number,
    numDeCompras: Number
});
const Item = mongoose.model('itens', itemSchema);

const userSchema = ({
    login: String,
    password: String,
    nome: String,
    endereco: String,
    sexo: String,
    itensComprados: [{
        detalhes: {
            valor: Number, 
            dataDaCompra: String
        }, 
        itens: [{
            _id: String, 
            quantidade: Number,
            preco: String
        }]
    }]
})
const User = mongoose.model('accounts', userSchema)

app.get('/', (req, res)=>{
    return res.send('serverzin do vitosnatios riven');
})

app.get('/itensDaLoja', async (req, res)=>{
    const result = await Item.find({});
    return res.send(result);
})

//comprar pelo carrinho
app.post('/efetuarCompra', async (req, res)=>{
    const oldJwt = req.body.formulario.jwt;
    const form = req.body.formulario;
    const returnError = ()=>{
        return res.json({
            status: 'err'
        });
    }

    const testres = form.itensByIdAndItsQuantity.map(async item=>{
        let mapResult = false;
        const quantidadeDesseItem = item.quantidade;
        const resultItem = await Item.findById(item._id);
        if(resultItem.estoque < quantidadeDesseItem) {
            mapResult = true;
        }
        return mapResult;
    });

    const results = await Promise.all(testres);

    //se nao tiver algo no estoque
    if(results.includes(true)){
        return res.json({
            status: 'estoqueFail'
        })
    //se tiver tudo em ordem no estoque
    } else {
        try {
            const decoded = jwt.verify(oldJwt, jwtSecret);
            if (decoded.data._id===form.userId) {
                const result = await User.findById(form.userId);
                const whatToChange = [...result.itensComprados, { detalhes: {valor: form.valorDaCompra, dataDaCompra: form.horarioDeCompra}, itens: form.itensByIdAndItsQuantity } ];
                await User.findByIdAndUpdate(form.userId, { itensComprados: whatToChange });
                //
                const updatedUser = await User.findById(form.userId);
                //checa se tem os itens no estoque pra continuar
                form.itensByIdAndItsQuantity.forEach(async item=>{
                    const quantidadeDesseItem = item.quantidade;
                    const resultItem = await Item.findById(item._id);
                    Item.findByIdAndUpdate(item._id, { estoque: resultItem.estoque-quantidadeDesseItem}, (err, result)=>{})
                    Item.findByIdAndUpdate(item._id, { numDeCompras: resultItem.numDeCompras+quantidadeDesseItem}, (err, result)=>{})
                })
                const newJwt = jwt.sign({
                    exp: Math.floor(Date.now() / 1000) + (30 * 60),
                    data: {
                            _id: updatedUser._id,
                            login: updatedUser.login,
                            nome: updatedUser.nome,
                            endereco: updatedUser.endereco,
                            sexo: updatedUser.sexo,
                            itensComprados: updatedUser.itensComprados
                        }
                }, jwtSecret);
                return res.json({
                    status: 'success',
                    jwt: newJwt
                })
            }
        } catch(err) {
            returnError();
        }
    }
})

//comprar pela página do item
app.post('/efetuarCompraPeloItem', (req, res)=>{
    const form = req.body.formulario;
    const item = form.itensByIdAndItsQuantity;
    const quantidadeDesseItem = form.itensByIdAndItsQuantity.quantidade;
    const oldJwt = form.jwt;

    jwt.verify(oldJwt, jwtSecret, (err, decoded)=>{
        if (err) {
            return res.json({
                status: 'houve algum erro de credenciais'
            })
        } else if (decoded.data._id === form.userId) {
            User.findById(form.userId, (err, result)=>{
                const whatToChange = [...result.itensComprados, { detalhes: {valor: form.valorDaCompra, dataDaCompra: form.horarioDeCompra}, itens: form.itensByIdAndItsQuantity } ];
                    //descontar do estoque quando comprado
                Item.findById(item._id, (err, resultGeral)=>{
                    if (resultGeral.estoque >= quantidadeDesseItem) {
                        Item.findByIdAndUpdate(item._id, { estoque: resultGeral.estoque-quantidadeDesseItem}, (err, result)=>{})
                        Item.findByIdAndUpdate(item._id, { numDeCompras: resultGeral.numDeCompras+quantidadeDesseItem}, (err, result)=>{})
                        User.findByIdAndUpdate(form.userId, { itensComprados: whatToChange }, (err, userResult)=>{
                            if (err) {
                                console.log(err);
                            } else {
                                User.findById(form.userId, (err, updatedUser)=>{
                                    const newJwt = jwt.sign({
                                        exp: Math.floor(Date.now() / 1000) + (30 * 60),
                                        data: {
                                                _id: updatedUser._id,
                                                login: updatedUser.login,
                                                nome: updatedUser.nome,
                                                endereco: updatedUser.endereco,
                                                sexo: updatedUser.sexo,
                                                itensComprados: updatedUser.itensComprados
                                            }
                                    }, jwtSecret);
                                    return res.json({
                                        status: 'success',
                                        jwt: newJwt
                                    })
                                })
                            }
                        });
                    } else {
                        return res.json({
                            status: 'err'
                        })
                    }
                })
            })
        }
    })
})


//registrar usuario
app.post('/registerUser', (req, res)=>{
    //lembrar de logar com o user em minusculo
    const user = {
        login: req.body.toRegister.user.toLowerCase(),
        password: req.body.toRegister.pass,
        repeatPassword: req.body.toRegister.repeatPass
    }
    User.find({login: user.login}, (err, result)=>{
        if (result.length>0) {
            return res.json({
                status: 'err'
            })
        } else {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashedPass = bcrypt.hashSync(user.password, salt);

            const toRegister = {
                login: user.login,
                nome: "User",
                password: hashedPass,
                endereco: "",
                sexo: "Prefiro não informar",
                itensComprados: []
            }
            const userSave = new User(toRegister);
            userSave.save();
            return res.json({
                status: 'success'
            })
        }
    })
})

app.post('/logar', (req, res)=>{
    const loginInfo = {
        user: req.body.toLogin.user.toLowerCase(),
        pass: req.body.toLogin.pass
    }
    User.find({login: loginInfo.user}, (err, result)=>{
        //se tudo estiver certo
        if (result.length>0 && bcrypt.compareSync(loginInfo.pass, result[0].password)){

            const token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (30 * 60),
                data: {
                        _id: result[0]._id,
                        login: result[0].login,
                        nome: result[0].nome,
                        endereco: result[0].endereco,
                        sexo: result[0].sexo,
                        itensComprados: result[0].itensComprados
                    }
                }, jwtSecret);

            return res.json({
                status: 'success',
                jwt: token
            })
        } else if (result.length===0) {
            return res.json({
                status: '404user'
            })
        } else if (!bcrypt.compareSync(loginInfo.pass, result[0].password)) {
            return res.json({
                status: 'wrongPass'
            })
        }
    })
})

app.post('/checkJwt', (req, res)=>{
    const jwtToCheck = req.body.jwt;
    jwt.verify(jwtToCheck, jwtSecret, (err, decoded)=>{
        if (err) {
            return res.json({
                status: 'err'
            })
        } else {
            return res.json({
                status: 'ok',
                user: decoded.data
            })
        }
    })
})

app.post('/editarUser', (req, res)=>{
    const newUser = req.body.dadosComJwt;
    const oldJwt = req.body.dadosComJwt.jwt;
    //checagem pra ver se o id do usuário é o mesmo incluso no JWT
    jwt.verify(oldJwt, jwtSecret, (err, decoded)=>{
        if (err) {
            return res.json({
                status: 'err'
            })
        } else if (decoded.data._id === newUser._id){
            User.findById(newUser._id, (err, result)=>{
                User.findByIdAndUpdate(result._id, { endereco: newUser.endereco, nome: newUser.nome, sexo: newUser.sexo }, (err, updateResult)=>{
                    if (err) {
                        return res.json({
                            status: 'err'
                        })
                    } else {
                        jwt.verify(oldJwt, jwtSecret, (err, decoded)=>{
                            if (err) {
                                return res.json({
                                    status: 'err'
                                })
                            } else {
                                const newJwt = jwt.sign({
                                    exp: Math.floor(Date.now() / 1000) + (30 * 60),
                                    data: {
                                            _id: updateResult._id,
                                            login: newUser.login,
                                            nome: newUser.nome,
                                            endereco: newUser.endereco,
                                            sexo: newUser.sexo,
                                            itensComprados: newUser.itensComprados
                                        }
                                    }, jwtSecret);
        
                                return res.json({
                                    status: 'success',
                                    jwt: newJwt
                                })
                            }
                        })
                    }
                })
            })

        } else {
            return res.json({
                status: 'err'
            })
        }
    })
})

// app.post('/adicionarItem', (req, res)=>{
//     const toAdd = {
//         productImg: req.body.productImg,
//         productTitle: req.body.productTitle,
//         productPrice: req.body.productPrice,
//         class: req.body.class,
//         status: req.body.status,
//         estoque: req.body.estoque,
//         numDeCompras: req.body.numDeCompras
//     }
//     if (req.body.productTitle!==undefined) {
//         const adicionarItem = new Item(toAdd);
//         adicionarItem.save();
//         res.json({
//             status: toAdd.productTitle+' adicionado com sucesso.'
//         })
//     } else {
//         res.json({
//             status: 'erro no preenchimento do body'
//         })
//     }
// })

app.listen(PORT, ()=>{
    console.log('Server conectado, porta: ' + PORT);
});