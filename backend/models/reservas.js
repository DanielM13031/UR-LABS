import Sequelize from 'sequelize';
import db from '../config/database.js';
import lockers from './lockers.js';

const reservations = db.define('reservation', {
id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
},
lockerId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    references: {
        model: lockers,
        key: 'id'
    }
},
userMail: {
    type: Sequelize.STRING,
    allowNull: false
},
startTime: {
    type: Sequelize.DATE,
    allowNull: false
}
}, {
    tableName: 'reservations',
    timestamps: false
});

lockers.hasMany(reservations, { foreignKey: 'lockerId' });
reservations.belongsTo(lockers, { foreignKey: 'lockerId' });

export default reservations;
