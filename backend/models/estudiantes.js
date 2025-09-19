import Sequelize from 'sequelize';
import db from '../config/database.js';

const estudiantes = db.define('estudiantes', {
    id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
    },

    nombres: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    telefono: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    celular: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
    },

    email: {
    type: Sequelize.STRING,
    allowNull: false,
    }
}, {
    tableName: 'estudiantes',
    timestamps: false
});

export default estudiantes;
