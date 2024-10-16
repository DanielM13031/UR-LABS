import bcrypt from 'bcryptjs';
import users from '../models/users.js';

const encrypt = async () => {
    try {
        const allUsers = await users.findAll();

        for (const user of allUsers ){
            if(!user.password.startsWith('$2a$')) {
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await users.update({password: hashedPassword}, {where:{mail: user.mail}});
                console.log(`password updated`)
            } else{
                console.log(`ya estaba encripatada`)
            }
        }

        console.log('proceso finalizado');
    } catch(error){
        console.error(`error al ecriptar`, error);
    }
};


encrypt();

