import reservas from '../../models/reservas.js';
import lockers from '../../models/lockers.js';
import { sendMail } from '../lib/email.js';
import { loadCutoffs } from '../lib/config.js';
import { Op } from 'sequelize';

function daysDiff(now, target) {
    const MS = 24 * 60 * 60 * 1000;
    return Math.ceil((target - now) / MS);
}

export async function runReminderJob() {
    const cutoff = loadCutoffs();
    if (!cutoff) return { ok: true, msg: 'No hay cutoff activo' };

    const now = new Date();
    const cutoffDate = new Date(cutoff.cutoff_at);
    const diff = daysDiff(now, cutoffDate);

    if (diff !== Number(cutoff.remind_days_before)) {
        return { ok: true, msg: `Hoy no toca recordatorio (faltan ${diff} días)` };
    }

    // Todas las reservas vigentes (las que existan en la tabla)
    const rows = await reservas.findAll({
        include: [{ model: lockers, attributes: ['numero'] }]
    });

    let sent = 0;
    for (const r of rows) {
        const email = r.userMail || r.mail;
        if (!email) continue;

        const subject = `Recordatorio: entrega de llave – vence el ${cutoffDate.toLocaleDateString('es-CO')}`;
        const html = `
        <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;">
            <h2 style="margin:0 0 8px;color:#9d141b;">Reserva de Casilleros</h2>
            <p>Hola,</p>
            <p>Recuerda que tu reserva del casillero <b>${r?.locker?.numero ?? r.lockerId}</b>
            finaliza el <b>${cutoffDate.toLocaleDateString('es-CO')}</b>.</p>
            <p>Por favor entrega la llave en la fecha indicada.</p>
        </div>`;
        await sendMail({ to: email, subject, html, text: html.replace(/<[^>]+>/g,'') });
        sent++;
    }

    return { ok: true, remindersSent: sent };
}

export async function runCutoffJob() {
    const cutoff = loadCutoffs();
    if (!cutoff) return { ok: true, msg: 'No hay cutoff activo' };

    const now = new Date();
    const start = new Date(cutoff.cutoff_at);
    const end   = new Date(start.getTime() + 24*60*60*1000);
    if (!(now >= start && now < end)) {
        return { ok: true, msg: 'Aún no es la ventana de corte' };
    }


    return { ok: true, expiredDeleted: rows.length, mailed };
}
