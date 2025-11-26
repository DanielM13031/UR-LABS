import reservas from '../../models/reservas.js';
import lockers from '../../models/lockers.js';
import db from '../../config/database.js'; 
import { sendMail } from '../lib/email.js';
import {
	loadCutoffs,
	isReminderDay,
	isInGrace,
	isEffectiveCutDay,
	getDates
} from '../lib/config.js';
import { Op } from 'sequelize';

/** Enviar correo y contar solo si el SMTP lo aceptó */
async function sendSafe({ to, subject, html }) {
	const email = (to || '').trim();
	if (!email) return false;
	const { ok } = await sendMail({ to: email, subject, html, text: html.replace(/<[^>]+>/g, '') });
	return ok;
}

/** Recordatorios previos y durante gracia */
export async function runReminderJob() {
	const cutoff = loadCutoffs();
	if (!cutoff) return { ok: true, msg: 'No hay cutoff activo' };

	const now = new Date();
	const { due, effective, graceDays } = getDates(cutoff);

	// 1) Recordatorio X días antes del vencimiento oficial
	if (isReminderDay(now, cutoff)) {
		const rows = await reservas.findAll({
			attributes: ['id', 'lockerId', 'userMail'],
			include: [{
				model: lockers,
				as: 'locker',
				attributes: ['id', 'numero', 'isAvailable'],
				where: { isAvailable: false } 
			}]
		});
		let sent = 0;
		for (const r of rows) {
			const subject = `Recordatorio: tu reserva de casillero vence el ${due.toLocaleDateString('es-CO')}`;

			const html = `
				<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#333;">
					<h2 style="margin:0 0 10px;color:#9d141b;">Recordatorio de Reserva – Casilleros UR</h2>

					<p>Hola,</p>

					<p>
						Te informamos que tu reserva del casillero 
						<b>${r?.locker?.numero ?? r.lockerId}</b> 
						vence el día <b>${due.toLocaleDateString('es-CO')}</b>.
					</p>

					<p>
						Por favor asegúrate de realizar la entrega o renovación correspondiente antes de la fecha indicada
						para evitar inconvenientes.
					</p>

					<p style="margin-top:18px;">
						Si ya realizaste la gestión, puedes ignorar este mensaje.
					</p>

					<p style="margin-top:12px;">
						Atentamente,<br>
						<b>UR-Labs – Sistema de Reservas de Casilleros</b>
					</p>
				</div>
			`;

			if (await sendSafe({ to: r.userMail, subject, html })) sent++;
		}

		return { ok: true, phase: "pre-due", remindersSent: sent, due: due.toISOString().slice(0, 10) };
	}

	// 2) Aviso durante días de gracia (si hay gracia > 0)
	if (graceDays > 0 && isInGrace(now, cutoff)) {
		const rows = await reservas.findAll({
			attributes: ['id', 'lockerId', 'userMail'],
			include: [{
				model: lockers,
				as: 'locker',
				attributes: ['numero', 'isAvailable'],
				where: { isAvailable: false } 
			}]
		});

		let sent = 0;
		const daysLeft = Math.max(0, Math.round((effective - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000));
		for (const r of rows) {
			const subject = `Tu reserva ya venció — tienes ${daysLeft} día(s) de gracia`;
			const html = `
				<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;">
					<h2 style="margin:0 0 8px;color:#9d141b;">Reserva de Casilleros</h2>
					<p>Hola,</p>
					<p>Tu reserva del casillero <b>${r?.locker?.numero ?? r.lockerId}</b> venció el
					<b>${due.toLocaleDateString('es-CO')}</b>, pero tienes <b>${daysLeft} día(s)</b> de gracia.</p>
					<p>El corte final se ejecutará el <b>${effective.toLocaleDateString('es-CO')}</b>.</p>
				</div>`;
			if (await sendSafe({ to: r.userMail, subject, html })) sent++;
		}
		return { ok: true, phase: 'grace', remindersSent: sent, effective: effective.toISOString().slice(0, 10) };
	}

	return { ok: true, msg: 'Hoy no toca recordatorio' };
}

/** Corte efectivo: libera casilleros + envía correo post-corte + borra reservas */
export async function runCutoffJob() {
	const cutoff = loadCutoffs();
	if (!cutoff) return { ok: true, msg: 'No hay cutoff activo' };

	const now = new Date();
	if (!isEffectiveCutDay(now, cutoff)) {
		const { effective } = getDates(cutoff);
		return { ok: true, msg: `Fuera de ventana de corte (efectivo: ${effective.toLocaleDateString('es-CO')})` };
	}

	const { effective } = getDates(cutoff);

	// Trae reservas a cortar: SOLO con lockers ocupados
	const rows = await reservas.findAll({
		attributes: ['id', 'lockerId', 'userMail'],
		include: [{
			model: lockers,
			as: 'locker',
			attributes: ['id', 'numero', 'isAvailable'],
			where: { isAvailable: false } 
		}]
	});

	if (!rows.length) {
		return { ok: true, phase: 'cut', msg: 'No hay reservas para cortar', expiredDeleted: 0, lockersFreed: 0, mailed: 0 };
	}

	const ids       = rows.map(r => r.id);
	const lockerIds = rows.map(r => r.lockerId).filter(Boolean);
	const effStr    = effective.toLocaleDateString('es-CO');

	// Transacción: liberar -> correos -> borrar
	return await db.transaction(async (t) => {
		// 1) Liberar casilleros
		const [aff1] = await lockers.update(
			{ isAvailable: true, usuarioId: null, reservaId: null, assignedTo: null },
			{ where: { id: { [Op.in]: lockerIds } }, transaction: t }
		);
		let freed = aff1;

		let mailed = 0;
		for (const r of rows) {
			const subject = `Corte aplicado – ${effStr}`;

			const html = `
				<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;color:#333;">
					<h2 style="margin:0 0 10px;color:#9d141b;">Reserva de Casilleros – Corte Aplicado</h2>

					<p>Hola,</p>

					<p>
						Te informamos que el corte correspondiente al día <b>${effStr}</b> ha sido ejecutado.  
						Tu reserva del casillero <b>${r?.locker?.numero ?? r.lockerId}</b> ha finalizado y el 
						casillero fue liberado para nuevos usuarios, cualquier objeto que se encuentre en el casillero sera llevado a objetos perdidos.
					</p>

					<p style="margin-top:16px;">
						Si necesitas realizar una nueva reserva, puedes hacerlo a través del sistema de UR-Labs.
					</p>

					<p style="margin-top:14px;">
						Atentamente,<br>
						<b>UR-Labs – Sistema de Reservas de Casilleros</b>
					</p>
				</div>
			`;

			if (await sendSafe({ to: r.userMail, subject, html })) mailed++;
		}


		// 3) Borrar reservas
		const expiredDeleted = await reservas.destroy({
			where: { id: { [Op.in]: ids } },
			transaction: t
		});

		return { ok: true, phase: 'cut', expiredDeleted, lockersFreed: freed, mailed };
	});
}
