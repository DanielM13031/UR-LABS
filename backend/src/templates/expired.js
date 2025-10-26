module.exports = function expiredTemplate({cutoffDate }) {
    const subject = `Reserva finalizada – ${cutoffDate}`;
    const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;">
        <h2 style="margin:0 0 8px;color:#9d141b;">Reserva de Casilleros</h2>
        <p>Hola,</p>
        <p>Tu reserva del casillero finalizó el <b>${cutoffDate}</b> y ha sido liberada.</p>
        <p>Si aún no entregaste la llave, por favor hazlo a la mayor brevedad.</p>
        <p>Gracias,<br>Equipo de Reservas</p>
    </div>`;
    const text =
`Hola,
Tu reserva del casillero finalizó el ${cutoffDate} y ha sido liberada.
Si aún no entregaste la llave, por favor hazlo pronto.
Gracias, Equipo de Reservas`;
    return { subject, html, text };
};
