import express from 'express';
import cors from 'cors';
import Sequelize from './config/database.js';
import users from './models/users.js'
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



//peticiones
app.get('/api', (req,res) =>{
    res.json({message: 'holiiiii'});
});


app.listen(port, () =>{
    console.log(`running on ${port}`)
})

