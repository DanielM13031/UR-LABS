// routes/lockers.js
import express from 'express';
import lockers from '../models/lockers.js';
const router = express.Router();

// Edificios 
router.get('/edificios', async (_req, res) => {
    const rows = await lockers.findAll({
    attributes: [[lockers.sequelize.fn('DISTINCT', lockers.sequelize.col('edificio')), 'edificio']],
    raw: true
    });
    res.json(rows.map(r => r.edificio)); 
});

// Pisos por edificio 
router.get('/pisos', async (req, res) => {
    const { edificio } = req.query;
    if (!edificio) return res.status(400).json({ message: 'Falta edificio' });
    const rows = await lockers.findAll({
    attributes: [[lockers.sequelize.fn('DISTINCT', lockers.sequelize.col('piso')), 'piso']],
    where: { edificio },
    order: [['piso','ASC']],
    raw: true
    });
    res.json(rows.map(r => r.piso)); 
});

// Lockers disponibles por edificio y piso
router.get('/disponibles', async (req, res) => {
    const { edificio, piso } = req.query;
    if (!edificio || !piso) return res.status(400).json({ message: 'Faltan filtros: edificio y piso' });

    const disponibles = await lockers.findAll({
    where: { edificio, piso: Number(piso), isAvailable: true },
    attributes: ['id', 'numero', 'edificio', 'piso', 'isAvailable'],
    order: [['numero', 'ASC']]
    });
    res.json(disponibles); 
});

// routes/lockers.js
router.get('/', async (req, res) => {
    try {
        const { edificio, piso } = req.query;
        const where = {};
        if (edificio) where.edificio = edificio;
        if (piso !== undefined && piso !== '') where.piso = Number(piso); // <-- cast

            const rows = await lockers.findAll({ where, order: [['numero','ASC']] });
            const data = rows.map(r => {
            const j = r.toJSON();
        j.isAvailable = !!j.isAvailable; // normaliza boolean
        return j;
        });
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error listando lockers' });
    }
});


export default router;
