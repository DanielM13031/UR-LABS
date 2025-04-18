import express from 'express';
import cors from 'cors';
import Sequelize from './config/database.js';
import users from './models/users.js'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'

const app = express();
const port  = 5000;


app.use(express.json());
app.use(cors());

//Conexiones de la base de datos

Sequelize.sync({alter:true})
.then(()=>{
    console.log(`base sincronizada a los modelos`);
})
.catch((error)=> {
    console.error('error en la sincronizacion:', error)
});

//peticiones para el login

app.post('/Login',async (req,res) => {
    const {mail, password} = req.body;

    try {
        const user = await users.findOne({where:{mail} });// buscar usuario

        if(!user){
            return res.status(401).json({message: 'Usuario no encontrado'})
        }

        const isMatch = await bcrypt.compare(password, user.password); //comparacion de la contraseña con la contraseña encryptada

        if(isMatch){
            const payload = {
                id : user.mail
            };
            const token = jwt.sign(payload, '13031', { expiresIn: '1h' }) 

            const mail_norm = mail.replace(/[@.]/g, '_');
            
            const img_ref = `http://localhost:3000/images/${mail_norm}.jpg`

            return res.json({message: 'inicio correcto', token, img_ref, mail})
        }else{
            res.status(401).json({message: 'contraseña invalida'})
        }
    }catch(error){
        res.status(500).json({message: 'error en el servidor'})
    }
                });

//middleware para el token de login

function checktoken (req,res,next){
    const header = req.headers['authorization'];
    if (!header){
        return res.status(403).json({message: 'Token no proporcionado'})
    }
    const token = header.split(' ')[1];
    jwt.verify(token, '13031', (err, decoded) =>{
        if(err){
            return res.status(401).json({message: 'Token no valido'})
        }

        req.user = decoded;
        next();
    });
}


app.get('/Home', checktoken, (req,res)=>{
    res.json({message: 'Ha ingresado'})
});


//init server
app.listen(port, () =>{
    console.log(`running on ${port}`)
})