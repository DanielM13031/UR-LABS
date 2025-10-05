import express from 'express';
import cors from 'cors';
import Sequelize from './config/database.js';
import users from './models/users.js'
import lockers from './models/lockers.js';
import reservations from './models/reservas.js';
import estudiantes from './models/estudiantes.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import lockersRouter from './routes/lockers.js';

const app = express();
const port  = 5000;



app.use(express.json());
app.use(cors());
app.use('/lockers', lockersRouter);
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

app.get('/lockers', async (req, res) => {
    try {
        const { edificio, piso } = req.query;
        const where = {};
        if (edificio) where.edificio = edificio;
        if (piso !== undefined && piso !== '') where.piso = Number(piso);

        const rows = await lockers.findAll({
            where,
            attributes: ['id', 'numero', 'isAvailable', 'edificio', 'piso'],
            order: [['numero', 'ASC']]
        });

        const data = rows.map(r => {
            const j = r.toJSON();
            j.isAvailable = !!j.isAvailable; // normaliza booleano
            return j;
        });

        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error listando lockers' });
    }
});


app.post('/reserve', async (req, res) => {
    const { lockerId, userMail, startTime, tel } = req.body;

    // Validaciones rápidas de payload (evitan 500 por nulls o tipos)
    if (!lockerId) return res.status(400).json({ message: 'Falta lockerId' });
    if (!userMail) return res.status(400).json({ message: 'Falta userMail' });
    if (!startTime) return res.status(400).json({ message: 'Falta startTime' });
    if (!tel) return res.status(400).json({ message: 'Falta tel' });

    try {
        const mail = String(userMail).trim().toLowerCase();

        if (!mail.endsWith('@urosario.edu.co')) {
        return res.status(400).json({ message: 'El correo debe ser institucional (@urosario.edu.co)' });
        }

        const existe = await estudiantes.findOne({ where: { email: mail } });
        if (!existe) {
        return res.status(400).json({ message: 'El correo no pertenece a estudiantes activos' });
        }

        const yaTiene = await reservations.findOne({ where: { userMail: mail } });
        if (yaTiene) {
        return res.status(400).json({ message: 'El usuario ya tiene una reserva' });
        }

        const locker = await lockers.findByPk(lockerId);
        if (!locker) return res.status(400).json({ message: 'El casillero no existe' });
        if (!locker.isAvailable) return res.status(400).json({ message: 'El casillero no está disponible' });

        const startISO = new Date(startTime);
        if (isNaN(startISO)) {
        return res.status(400).json({ message: 'Fecha/hora inválida' });
        }

        const carreraestudiante = existe.carrera;
        if (!carreraestudiante) {
        return res.status(400).json({ message: 'El estudiante no tiene una carrera asignada' });
        }

        const nueva = await reservations.create({
        lockerId,
        userMail: mail,          
        startTime: startISO,     
        tel: String(tel).trim(),
        carrera: existe.carrera
        });

        locker.isAvailable = false;
        await locker.save();

        return res.status(201).json({ message: 'Reserva registrada correctamente', reserva: nueva });
    } catch (error) {
        console.error('[RESERVE][ERROR]', {
        message: error?.message,
        name: error?.name,
        parent: error?.parent?.message,
        stack: error?.stack,
        });
        return res.status(500).json({ message: 'Error al registrar la reserva' });
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
        attributes: ['id', 'userMail', 'startTime', 'tel', 'carrera', 'lockerId'],
        include: [{
            model: lockers,
            as: 'locker',                 
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