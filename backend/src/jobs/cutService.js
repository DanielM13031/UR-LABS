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

    const rows = await reservas.findAll({
        include: [{ model: lockers, as: 'locker', attributes: ['numero'] }] // alias consistente
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
    await sendMail({ to: email, subject, html, text: html.replace(/<[^>]+>/g, '') });
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

  // 1) Traer las reservas vigentes a cortar (aquí estoy cortando TODAS; ajusta el where si quieres una condición)
    const rows = await reservas.findAll({
        attributes: ['id','lockerId','userMail'],
        include: [{ model: lockers, as: 'locker', attributes: ['id','numero'] }]
    });

  // 2) Enviar correos de aviso de corte (opcional)
    let mailed = 0;
    const cutoffDateStr = start.toLocaleDateString('es-CO');
    for (const r of rows) {
        const email = r.userMail || r.mail;
        if (!email) continue;
        try {
        const subject = `Corte de reservas – ${cutoffDateStr}`;
        const html = `
            <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;">
            <h2 style="margin:0 0 8px;color:#9d141b;">Reserva de Casilleros</h2>
            <p>Hola,</p>
            <p>Se ha ejecutado el corte de reservas correspondiente al <b>${cutoffDateStr}</b>.
            Tu reserva del casillero <b>${r?.locker?.numero ?? r.lockerId}</b> ha sido finalizada.</p>
            </div>`;
        await sendMail({ to: email, subject, html, text: html.replace(/<[^>]+>/g, '') });
        mailed++;
        } catch (e) {
        console.error('[runCutoffJob] Error enviando correo:', r.id, e);
        }
    }

  // 3) Liberar lockers (opcional; ajusta campos a tu esquema)
    const lockerIds = rows.map(r => r.lockerId).filter(Boolean);
    let freed = 0;
    if (lockerIds.length) {
        const [affected] = await lockers.update(
        { isAvailable: true },                   
        { where: { id: { [Op.in]: lockerIds } } }
        );
        freed = affected;
    }

  // 4) Borrar reservas cortadas
    const ids = rows.map(r => r.id);
    const expiredDeleted = ids.length
    ? await reservas.destroy({ where: { id: { [Op.in]: ids } } })
    : 0;

    return { ok: true, expiredDeleted, mailed, lockersFreed: freed };
}
