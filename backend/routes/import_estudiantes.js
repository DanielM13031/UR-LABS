import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import Estudiante from '../models/estudiantes.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/estudiantes/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ ok: false, msg: 'No se envió archivo' });
    }

    const filePath = req.file.path;
    const resultados = [];

    try {
        // Leer CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({
                    separator: ',',
                    mapHeaders: ({ header }) => header.trim().toLowerCase()
                }))
                .on('data', (row) => resultados.push(row))
                .on('end', resolve)
                .on('error', reject);
        });

        let insertados = 0;
        let yaExistian = 0;

        for (const row of resultados) {

            const nombres = row.nombres?.trim();
            const telefono = row.telefono?.trim();
            const celular = row.celular?.trim();
            const email = row.email?.trim();
            const carrera = row.carrera?.trim();

            // Si faltan datos esenciales, lo ignoramos
            if (!nombres || !email) continue;

            // buscar por email (lo más lógico)
            const [estudiante, creado] = await Estudiante.findOrCreate({
                where: { email },
                defaults: { nombres, telefono, celular, carrera }
            });

            if (creado) insertados++;
            else yaExistian++;
        }

        fs.unlinkSync(filePath);

        return res.json({
            ok: true,
            msg: 'Importación completada',
            insertados,
            yaExistian,
            totalCSV: resultados.length
        });

    } catch (err) {
        console.error(err);
        try { fs.unlinkSync(filePath); } catch (_) {}
        return res.status(500).json({ ok: false, msg: 'Error procesando el archivo' });
    }
});

export default router;
