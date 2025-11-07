import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const CUT_PATH   = path.join(__dirname, '../../config/cutoffs.json');

/* ----------------- utils de fecha (sin UTC-shift) ----------------- */
function toYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function fromYMD(ymd) {
    // crea Date local a medianoche
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function addDays(d, n) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() + n);
    return x;
}
export function daysDiffLocal(a, b) {
    const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((B - A) / (24 * 60 * 60 * 1000));
}

/* ----------------- I/O seguro del archivo ----------------- */
function ensureCutFile() {
    if (!fs.existsSync(CUT_PATH)) fs.writeFileSync(CUT_PATH, '[]', 'utf8');
}

export function loadAllCutoffs() {
    ensureCutFile();
    try {
        const raw = fs.readFileSync(CUT_PATH, 'utf8');
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

export function loadCutoffs() {
  // último marcado como activo
    const arr = loadAllCutoffs();
    const lastActive = [...arr].reverse().find(x => x?.is_active);
    return lastActive || null;
}

/* ----------------- guardar/activar ventanas ----------------- */
export function saveActiveCutoff(cw) {
    const arr = loadAllCutoffs().map(x => ({ ...x, is_active: false }));

  // Acepta cutoff_at como YYYY-MM-DD o Date/string equivalente
    const cutoffAt =
        typeof cw.cutoff_at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cw.cutoff_at)
        ? cw.cutoff_at
        : toYMD(new Date(cw.cutoff_at));

    const clean = {
        name: (cw.name || 'Ventana de corte').trim(),
        cutoff_at: cutoffAt,                              // guardamos Y-M-D, no ISO UTC
        remind_days_before: Number(cw.remind_days_before ?? 7),
        grace_days: Number(cw.grace_days ?? 2),
        is_active: true,
        saved_at: new Date().toISOString()
    };

    arr.push(clean);
    fs.writeFileSync(CUT_PATH, JSON.stringify(arr, null, 2), 'utf8');
    return clean;
}

/* ----------------- helpers de negocio (gracia/ventanas) ----------------- */
export function getDates(cutoff) {
    if (!cutoff) return null;
    const due = fromYMD(cutoff.cutoff_at);                        // vencimiento oficial (local)
    const graceDays = Number(cutoff.grace_days || 0);
    const effective = addDays(due, graceDays);                    // día del corte efectivo
    const remindDays = Number(cutoff.remind_days_before || 0);
    const remindDay = addDays(due, -remindDays);                  // día del recordatorio previo
    return { due, effective, remindDay, graceDays, remindDays };
}

/** ¿Hoy es el día de recordatorio previo? */
export function isReminderDay(now = new Date(), cutoff) {
    const d = getDates(cutoff);
    if (!d) return false;
    return toYMD(now) === toYMD(d.remindDay);
}

/** ¿Estamos dentro de los días de gracia (después de due y antes de effective)? */
export function isInGrace(now = new Date(), cutoff) {
    const d = getDates(cutoff);
    if (!d) return false;
    return toYMD(now) > toYMD(d.due) && toYMD(now) < toYMD(d.effective);
}

/** ¿Hoy es el día de corte efectivo? */
export function isEffectiveCutDay(now = new Date(), cutoff) {
    const d = getDates(cutoff);
    if (!d) return false;
    return toYMD(now) === toYMD(d.effective);
}
