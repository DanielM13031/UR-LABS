import { Router } from 'express';
import { loadCutoffs, saveActiveCutoff } from '../src/lib/config.js';
import { runReminderJob, runCutoffJob } from '../src/jobs/cutService.js';

const router = Router();

// GET ventana activa
router.get('/cutoff', (_req, res) => res.json(loadCutoffs()));

// PUT (guardar desde el selector)
router.put('/cutoff', (req, res) => {
    try {
        const { name, cutoff_at, remind_days_before, grace_days } = req.body || {};
        if (!cutoff_at) return res.status(400).json({ ok:false, error:'cutoff_at requerido' });
        const saved = saveActiveCutoff({ name, cutoff_at, remind_days_before, grace_days });
        res.json({ ok:true, cutoff:saved });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok:false, error:'No se pudo guardar la ventana' });
    }
});

// Forzar jobs
router.post('/cutoff/remind/run', async (_req, res) => res.json(await runReminderJob()));
router.post('/cutoff/apply/run',  async (_req, res) => res.json(await runCutoffJob()));

export default router;
