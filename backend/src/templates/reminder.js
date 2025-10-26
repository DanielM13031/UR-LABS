module.exports = function reminderTemplate({cutoffDate}) {
    const subject = `Recordatorio: entrega de llave – vence el ${cutoffDate}`;
    const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;">
        <h2 style="margin:0 0 8px;color:#9d141b;">Reserva de Casilleros</h2>
        <p>Hola,</p>
        <p>Recuerda que tu reserva del casillero finaliza el <b>${cutoffDate}</b>.</p>
        <p>Por favor entrega la llave en la fecha indicada para evitar sanciones.</p>
        <p>Gracias,<br>Equipo de Laboratiorios</p>
    </div>`;
    const text =
`Hola,
Recuerda que tu reserva del casillero finaliza el ${cutoffDate}.
Por favor entrega la llave en la fecha indicada para evitar sanciones.
Gracias, de Laboratiorios`;
    return { subject, html, text };
};
