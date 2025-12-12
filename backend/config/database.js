import Sequelize from "sequelize";

const sequelize = new Sequelize('proyecto_labs', 'postgres', 'laboratorioseci',{
    host: 'localhost',
    dialect: 'postgres'
});

sequelize.authenticate()
    .then(() => {
    console.log('Conexión exitosa a la base de datos.');
    })
    .catch(err => {
    console.error('Error de conexión:', err);
    });

export default sequelize;