// ESM y estructura correcta
const app = {
    timezone: 'America/Bogota',
    // MUY IMPORTANTE: solo una máquina con true
    isScheduler: true,

    mail: {
        host: 'smtp.gmail.com',      
        port: 587,
        secure: false,
        user: 'laboratorioseci6@gmail.com',   
        pass: 'akbr nusy zcxr ecaa',
        from: 'Reservas Casilleros <laboratorioseci6@gmail.com>'
    }
};

export default app;
