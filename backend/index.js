import express from 'express';
import cors from 'cors';
import Sequelize from './config/database.js';
import users from './models/users.js'
import lockers from './models/lockers.js';
import reservations from './models/reservas.js';
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

// peticiones para las reservas

app.get('/lockers', async (req, res) =>{
    try{
        const casilleros = await lockers.findAll({
            attributes: ['id', 'numero', 'isAvailable'],
            order: [['id', 'ASC']]
        });
        res.json(casilleros);
    } catch(err){
        console.error('Error al obtener los casilleros', err);
        res.status(500).json({ message: 'Error  al obtener los casilleros'})
    }
})

app.post('/reserve', async (req, res) => {
    const { lockerId, userMail, startTime} = req.body;
    try {

        const reservaActiva = await reservations.findOne({ where: {userMail} });
        if(reservaActiva) {
            return res.status(400).json({ message: 'El usuario ya tiene una reserva'})
        }

        const locker = await lockers.findByPk(lockerId);
        if (!locker || !locker.isAvailable) {
        return res.status(400).json({ message: 'El casillero no está disponible o no existe.' });
    }

    const nuevaReserva = await reservations.create({
        lockerId,
        userMail,
        startTime
    });

    locker.isAvailable = false;
    await locker.save();

    return res.status(201).json({
        message: 'Reserva registrada correctamente',
        reserva: nuevaReserva
    });
    } catch (error) {
        console.error('Error al registrar la reserva:', error);
        res.status(500).json({ message: 'Error al registrar la reserva' });
    }
});


app.delete('/reservations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const reserva = await reservations.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const locker = await lockers.findByPk(reserva.lockerId);
        if (locker) {
            locker.isAvailable = true;
            await locker.save();
        }

        await reserva.destroy();
        return res.json({ message: 'Reserva cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar la reserva:', error);
        res.status(500).json({ message: 'Error al cancelar la reserva' });
    }
});


app.get('/reservas', async (req, res) => {
    try {
        const reservas = await reservations.findAll({
            include: [{
                model: lockers,
                attributes: ['numero']
            }],
            order: [['startTime', 'DESC']]
        });
        res.json(reservas);
    } catch (error) {
        console.error('Error al obtener las reservas:', error);
        res.status(500).json({ message: 'Error al obtener las reservas' });
    }
});

app.delete('/reservas/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const reserva = await reservations.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: 'Reserva no encontrada' });
        }

        const locker = await lockers.findByPk(reserva.lockerId);
        if (locker) {
            locker.isAvailable = true;
            await locker.save();
        }

        await reserva.destroy();
        return res.json({ message: 'Reserva cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar la reserva:', error);
        res.status(500).json({ message: 'Error al cancelar la reserva' });
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