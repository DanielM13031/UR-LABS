import express from 'express';
import cors from 'cors';
import Sequelize from './config/database.js';
import users from './models/users.js'
import bcrypt from 'bcryptjs';
const app = express();
const port  = 5000;
app.use(express.json());
app.use(cors());
//Conecciones de la base de datos

Sequelize.sync({alter:true})
.then(port,()=>{
    console.log(`base sincronizada a los modelos`);
    app.listen(port, () => {
        console.log(`Servidor en ${port}`)
    });
})
.catch((error)=> {
    console.error('error en la sincronizacion:', error)
});

//peticiones para el login

app.post('/login',async (req,res) => {
    const {mail, password} = req.body;

    try {
        const user = await users.findOne({where:{mail} });// buscar usuario

        if(!user){
            return res.status(401).json({message: 'Usuario no encontrado'})
        }

        const ismatch =  bcrypt.compare(password.user.pasword); //comparacion de la contrasela con la contraseña encryptada

        if(ismatch){
            res.json({message: 'inicio ocrrecto'})
        }else{
            res.status(401).json({message: 'contrasela invalida'})
        }
    }catch(error){
        res.json({message: 'error en el servidor'})
    }
                });

















//init server
app.listen(port, () =>{
    console.log(`running on ${port}`)
})