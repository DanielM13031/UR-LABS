import React, { useEffect, useState } from 'react';
import axios from '../auth/axiosconfig';
import './Adminreservas.css';

const Adminreservas = () => {
    const [reservas, setReservas] = useState([]);

    useEffect(() => {
        fetchReservas();
    }, []);

    const fetchReservas = async () => {
        try {
            const res = await axios.get('/reservas');
            setReservas(res.data);
        } catch (err) {
            console.error('Error al obtener reservas', err);
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) return;

        try {
            await axios.delete(`/reservas/${id}`);
            fetchReservas();
        } catch (err) {
            console.error('Error al eliminar reserva', err);
        }
    };

// 👇 pega este bloque dentro del componente Adminreservas, antes del return de la tabla:

    const [cw, setCw] = useState({
        name: 'Fin de semestre',
        cutoff_at: '',
        remind_days_before: 7,
        grace_days: 0   // si borras inmediatamente, deja 0
    });
    const [msg, setMsg] = useState('');

    function toLocalInputValue(isoString) {
        if (!isoString) return '';
        const dt = new Date(isoString);
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
    }

    // cargar ventana activa
    useEffect(() => {
    fetch('/admin/cutoff')
        .then(r => r.json())
        .then(v => {
            if (!v) return;
            setCw({
                name: v.name || 'Fin de semestre',
                cutoff_at: toLocalInputValue(v.cutoff_at),
                remind_days_before: v.remind_days_before ?? 7,
                grace_days: v.grace_days ?? 0
            });
        })
        .catch(() => {});
    }, []);

    const onChangeCut = e => setCw(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const guardarCorte = async (e) => {
        e.preventDefault();
        setMsg('');
        const dt = new Date(cw.cutoff_at);
        const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString();
        const res = await fetch('/admin/cutoff', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: cw.name,
                cutoff_at: iso,
                remind_days_before: Number(cw.remind_days_before),
                grace_days: Number(cw.grace_days)
            })
        }).then(r => r.json());
        setMsg(res.ok ? 'Fecha de corte guardada' : 'Error guardando');
    };

    const enviarRecordatoriosAhora = async () => {
        const r = await fetch('/admin/cutoff/remind/run', { method: 'POST' }).then(r=>r.json());
        setMsg(`[Recordatorios] ${JSON.stringify(r)}`);
    };
    const aplicarCorteAhora = async () => {
        const r = await fetch('/admin/cutoff/apply/run', { method: 'POST' }).then(r=>r.json());
        setMsg(`[Aplicar corte] ${JSON.stringify(r)}`);
    };


    return (
        <div className="admin-reservas">
            <h2>Reservas activas</h2>
            <div className="panel-corte" style={{marginBottom:16, padding:12, border:'1px solid #2a3441', borderRadius:12}}>
            <h3 style={{margin:'0 0 8px'}}>Fecha de corte y avisos</h3>
            <form onSubmit={guardarCorte} style={{display:'grid', gap:8, maxWidth:420}}>
                <label>
                Nombre
                <input name="name" value={cw.name} onChange={onChangeCut} />
                </label>
                <label>
                Fecha/hora de corte
                <input type="datetime-local" name="cutoff_at" value={cw.cutoff_at} onChange={onChangeCut} required />
                </label>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                <label>
                    Días antes (recordatorio)
                    <input type="number" min="0" name="remind_days_before" value={cw.remind_days_before} onChange={onChangeCut}/>
                </label>
                <label>
                    Días de gracia (0 = borrar al instante)
                    <input type="number" min="0" name="grace_days" value={cw.grace_days} onChange={onChangeCut}/>
                </label>
                </div>
                <div style={{display:'flex', gap:8}}>
                <button type="submit">Guardar fecha de corte</button>
                <button type="button" onClick={enviarRecordatoriosAhora}>Enviar recordatorios ahora</button>
                <button type="button" onClick={aplicarCorteAhora}>Aplicar corte ahora</button>
                </div>
            </form>
            {msg && <p style={{marginTop:8}}>{msg}</p>}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Casillero</th>
                        <th>Correo</th>
                        <th>Fecha Inicio</th>
                        <th>Celular</th>
                        <th>Carrera</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reservas.map((r) => (
                        <tr key={r.id}>
                            <td>{r.locker?.numero}</td>
                            <td>{r.userMail}</td>
                            <td>{new Date(r.startTime).toLocaleString()}</td>
                            <td>{r.tel}</td>
                            <td>{r.carrera}</td>
                            <td>
                                <button onClick={() => handleEliminar(r.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Adminreservas;
