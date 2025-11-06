// ESM y estructura correcta
const app = {
    timezone: 'America/Bogota',
    // MUY IMPORTANTE: solo una máquina con true
    isScheduler: true,

    mail: {
        host: 'smtp.gmail.com',      
        port: 587,
        secure: false,
        user: 'danieljosemorales05@gmail.com',   
        pass: 'pssf luvy nbnx mwqm',
        from: 'Reservas Casilleros <danieljosemorales05@gmail.com>'
    }
};

export default app;
