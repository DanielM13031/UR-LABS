import Sequelize from 'sequelize';
import db from '../config/database.js';

const lockers = db.define('locker', {
id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
},
numero: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
},
isAvailable: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
}
}, {
    tableName: 'lockers',
    timestamps: false
});

export default lockers;
