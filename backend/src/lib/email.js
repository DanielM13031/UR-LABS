// src/lib/email.js
import nodemailer from 'nodemailer';
import app from '../../config/app.js'; // <-- tu app.js

let transporter;
let verified = false;

function buildTransporter() {
    if (transporter) return transporter;

    const { host, port, secure, user, pass } = app.mail || {};
    if (!host || !port || !user || !pass) {
        console.error('[email] Config incompleta en app.mail');
    }

    transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Boolean(secure),      // true->465 (SSL), false->587 (STARTTLS)
        auth: { user, pass },
        requireTLS: !secure,          // STARTTLS en 587
        logger: true,                 // logs útiles
        debug: true,
        pool: true,                   // pool SMTP (mejor si envías varios)
        maxConnections: 3,
        maxMessages: 50
    });

    return transporter;
}

async function ensureVerified() {
    if (verified) return;
    try {
        await buildTransporter().verify();
        verified = true;
        console.log('[email] SMTP verificado.');
    } catch (e) {
        console.error('[email] Falló verify():', e?.message);
    }
}

/**
 * Envía correo y devuelve { ok, accepted, rejected, messageId }
 */
export async function sendMail({ to, subject, html, text }) {
    await ensureVerified();

    const from = app.mail?.from || app.mail?.user;
    if (!to) {
        console.warn('[email] to vacío, omitido');
        return { ok: false, accepted: [], rejected: [], messageId: null };
    }

    try {
        const info = await buildTransporter().sendMail({
        from,
        to,
        subject,
        html,
        text: text ?? html?.replace(/<[^>]+>/g, '')
        });
        const ok = Array.isArray(info.accepted) && info.accepted.length > 0;
        if (!ok) console.error('[email] Rechazado por servidor:', info);
        else console.log('[email] Enviado OK:', { to, messageId: info.messageId });
        return { ok, accepted: info.accepted || [], rejected: info.rejected || [], messageId: info.messageId || null };
    } catch (err) {
        console.error('[email] Error al enviar:', { to, subject, err: err?.message });
        return { ok: false, accepted: [], rejected: [to], messageId: null };
    }
}
