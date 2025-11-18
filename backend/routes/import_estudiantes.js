// routes/admin.js (por ejemplo)
import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import Estudiante  from '../models/estudiantes.js';

const router = express.Router();

// almacenamiento temporal en /uploads
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
            .pipe(csv({ separator: ',', mapHeaders: ({ header }) => header.trim() }))
            .on('data', (row) => resultados.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    let insertados = 0;
    let yaExistian = 0;

    // Suponiendo que tu CSV tiene columnas: codigo, nombre, correo
    for (const row of resultados) {
        const codigo = row.codigo?.trim();
        const nombre = row.nombre?.trim();
        const correo = row.correo?.trim();

        if (!codigo) continue; // sin clave, saltamos

        // Busca por código (ajusta según tu modelo)
        const [estudiante, creado] = await Estudiante.findOrCreate({
            where: { codigo },
            defaults: { nombre, correo }
        });

        if (creado) insertados++;
        else yaExistian++;
        }

        // Borrar archivo temporal
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
        // limpiar archivo si falla
        try { fs.unlinkSync(filePath); } catch (_) {}
        return res.status(500).json({ ok: false, msg: 'Error procesando el archivo' });
    }
});

export default router;
