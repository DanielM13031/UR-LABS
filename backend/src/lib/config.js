import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../../config/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const CUT_PATH   = path.join(__dirname, '../../config/cutoffs.json');

export function loadAllCutoffs() {
    const raw = fs.readFileSync(CUT_PATH, 'utf8');
    return JSON.parse(raw);
    }
    export function loadCutoffs() {
    const arr = loadAllCutoffs();
    return arr.find(x => x.is_active) || null;
    }
    export function saveActiveCutoff(cw) {
    const arr = loadAllCutoffs().map(x => ({ ...x, is_active: false }));
    const clean = {
        name: (cw.name || 'Ventana de corte').trim(),
        cutoff_at: new Date(cw.cutoff_at).toISOString(),
        remind_days_before: Number(cw.remind_days_before ?? 7),
        grace_days: Number(cw.grace_days ?? 2),
        is_active: true
    };
    arr.push(clean);
    fs.writeFileSync(CUT_PATH, JSON.stringify(arr, null, 2), 'utf8');
    return clean;
}

export { app };
