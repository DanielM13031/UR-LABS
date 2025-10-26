import nodemailer from 'nodemailer';
import { app } from './config.js';

const transporter = nodemailer.createTransport({
    host: app.mail.host,
    port: app.mail.port,
    secure: app.mail.secure,
    auth: { user: app.mail.user, pass: app.mail.pass }
});

export async function sendMail({ to, subject, html, text }) {
    return transporter.sendMail({ from: app.mail.from, to, subject, html, text });
}
