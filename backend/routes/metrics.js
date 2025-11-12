import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import lockers from '../models/lockers.js';
import reservations from '../models/reservas.js';

const router = Router();

router.get('/lockers/summary', async (_req, res) => {
    try {
        const total = await lockers.count();
        const ocupados = await lockers.count({ where: { isAvailable: false } }); // lockers ocupados
        const libres = Math.max(total - ocupados, 0);
        const tasa = total > 0 ? Number(((ocupados / total) * 100).toFixed(2)) : 0;

        res.json({ totalLockers: total, ocupados, libres, tasa });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'No se pudo calcular el resumen de ocupación' });
    }
});

router.get('/lockers/by-career', async (req, res) => {
    try {
        const { from, to } = req.query || {};
        const where = {};
        if (from || to) {
        where.startTime = {};
        if (from) where.startTime[Op.gte] = new Date(from);
        if (to)   where.startTime[Op.lte] = new Date(to);
        }

        const rows = await reservations.findAll({
        attributes: [
            ['carrera', 'carrera'],
            [fn('COUNT', col('id')), 'reservas']
        ],
        where,
        group: ['carrera'],
        order: [['carrera', 'ASC']],
        raw: true
        });

        const labels = rows.map(r => r.carrera || 'Sin carrera');
        const data   = rows.map(r => Number(r.reservas));

        res.json({ labels, data, rows });
    } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo obtener reservas por carrera' });
    }
});

export default router;