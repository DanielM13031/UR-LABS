import Sequelize from 'sequelize';
import db from '../config/database.js';

const estudiantes = db.define('estudiantes', {
    id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
    },

    Nombres: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    Telefono: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    Celular: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    Email: {
    type: Sequelize.STRING,
    allowNull: false
    }
}, {
    tableName: 'estudiantes',
    timestamps: false
});

export default estudiantes;
