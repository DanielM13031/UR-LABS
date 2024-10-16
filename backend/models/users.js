import Sequelize from "sequelize";
import db from "../config/database.js";

const users = db.define('users',{
    mail:{
        type: Sequelize.STRING,
        primaryKey: true
    },
    password:{
        type: Sequelize.STRING,
    },
    }, {
        tablename: 'users',
        timestamps: false
    });


//object
export default users;