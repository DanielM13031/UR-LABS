import Sequelize from 'sequelize';
import db from '../config/database.js';

const lockers = db.define('lockers', {
    id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
    },

    numero: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true
    },

    isAvailable: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
    },

    piso: {
    type: Sequelize.INTEGER,
    allowNull: false
    },
    
    edificio: {
    type: Sequelize.STRING,
    allowNull: false
    }
}, {
    tableName: 'lockers',
    timestamps: false
});

export default lockers;
