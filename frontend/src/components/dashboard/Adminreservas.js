import React, { useEffect, useState } from 'react';
import axios from '../auth/axiosconfig';
import './Adminreservas.css';

const Adminreservas = () => {
	const [reservas, setReservas] = useState([]);
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState('');

	// --- Panel de corte ---
	const [cw, setCw] = useState({
		name: 'Fin de semestre',
		cutoff_at: '',			// YYYY-MM-DD
		remind_days_before: 7,
		grace_days: 0
	});

	useEffect(() => {
		fetchReservas();
		fetchCutoff();
	}, []);

	const fetchReservas = async () => {
		try {
			const res = await axios.get('/reservas');
			setReservas(res.data || []);
		} catch (err) {
			console.error('Error al obtener reservas', err);
			setMsg('Error al cargar reservas');
		}
	};

	const handleEliminar = async (id) => {
		if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) return;
		setLoading(true);
		setMsg('');
		try {
			await axios.delete(`/reservas/${id}`);
			await fetchReservas();
			setMsg('Reserva eliminada');
		} catch (err) {
			console.error('Error al eliminar reserva', err);
			setMsg('Error al eliminar reserva');
		} finally {
			setLoading(false);
		}
	};

	// ====== CORTE: GET/PUT estado actual ======
	const fetchCutoff = async () => {
		try {
			const { data } = await axios.get('/admin/cutoff');
			if (!data) return;
			setCw({
				name: data.name || 'Fin de semestre',
				// Backend guarda YYYY-MM-DD; úsalo tal cual en <input type="date">
				cutoff_at: (data.cutoff_at || '').slice(0, 10),
				remind_days_before: Number(data.remind_days_before ?? 7),
				grace_days: Number(data.grace_days ?? 0),
			});
		} catch (err) {
			// si no hay activo, no pasa nada
		}
	};

	const onChangeCut = (e) =>
		setCw((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	const guardarCorte = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMsg('');
		try {
			// Enviamos cutoff_at como YYYY-MM-DD (sin hora)
			const payload = {
				name: cw.name,
				cutoff_at: cw.cutoff_at, // YYYY-MM-DD
				remind_days_before: Number(cw.remind_days_before),
				grace_days: Number(cw.grace_days),
			};
			const { data } = await axios.put('/admin/cutoff', payload);
			if (data?.ok) {
				setMsg('Fecha de corte guardada');
			} else {
				setMsg('Error guardando la fecha de corte');
			}
		} catch (err) {
			console.error('Error guardando corte', err);
			setMsg('Error guardando la fecha de corte');
		} finally {
			setLoading(false);
		}
	};

	const enviarRecordatoriosAhora = async () => {
		setLoading(true);
		setMsg('');
		try {
			const { data } = await axios.post('/admin/cutoff/remind/run');
			setMsg(`[Recordatorios] ${JSON.stringify(data)}`);
		} catch (err) {
			console.error('Error enviando recordatorios', err);
			setMsg('Error enviando recordatorios');
		} finally {
			setLoading(false);
		}
	};

	const aplicarCorteAhora = async () => {
		if (!window.confirm('Esto aplicará el corte efectivo y liberará casilleros. ¿Continuar?')) return;
		setLoading(true);
		setMsg('');
		try {
			const { data } = await axios.post('/admin/cutoff/apply/run');
			setMsg(`[Aplicar corte] ${JSON.stringify(data)}`);
			// refresca reservas por si se eliminaron
			await fetchReservas();
		} catch (err) {
			console.error('Error aplicando corte', err);
			setMsg('Error aplicando corte');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="admin-reservas">
			<h2>Reservas activas</h2>

			<div className="panel-corte" style={{ marginBottom: 16, padding: 12, border: '1px solid #2a3441', borderRadius: 12 }}>
				<h3 style={{ margin: '0 0 8px' }}>Fecha de corte y avisos</h3>

				<form onSubmit={guardarCorte} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
					<label style={{ display: 'grid', gap: 4 }}>
						Nombre
						<input
							name="name"
							value={cw.name}
							onChange={onChangeCut}
							placeholder="p.ej. Fin de semestre"
						/>
					</label>

					<label style={{ display: 'grid', gap: 4 }}>
						Fecha de corte (YYYY-MM-DD)
						<input
							type="date"
							name="cutoff_at"
							value={cw.cutoff_at}
							onChange={onChangeCut}
							required
						/>
					</label>

					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
						<label style={{ display: 'grid', gap: 4 }}>
							Días antes (recordatorio)
							<input
								type="number"
								min="0"
								name="remind_days_before"
								value={cw.remind_days_before}
								onChange={onChangeCut}
							/>
						</label>

						<label style={{ display: 'grid', gap: 4 }}>
							Días de gracia (0 = cortar el mismo día)
							<input
								type="number"
								min="0"
								name="grace_days"
								value={cw.grace_days}
								onChange={onChangeCut}
							/>
						</label>
					</div>

					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						<button type="submit" disabled={loading}>
							{loading ? 'Guardando...' : 'Guardar fecha de corte'}
						</button>
						<button type="button" onClick={enviarRecordatoriosAhora} disabled={loading}>
							{loading ? 'Enviando...' : 'Enviar recordatorios ahora'}
						</button>
						<button type="button" onClick={aplicarCorteAhora} disabled={loading}>
							{loading ? 'Aplicando...' : 'Aplicar corte ahora'}
						</button>
					</div>
				</form>

				{msg && <p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{msg}</p>}
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
					{(reservas || []).map((r) => (
						<tr key={r.id}>
							<td>{r.locker?.numero ?? r.lockerId}</td>
							<td>{r.userMail}</td>
							<td>{r.startTime ? new Date(r.startTime).toLocaleString() : '-'}</td>
							<td>{r.tel ?? '-'}</td>
							<td>{r.carrera ?? '-'}</td>
							<td>
								<button onClick={() => handleEliminar(r.id)} disabled={loading}>
									Eliminar
								</button>
							</td>
						</tr>
					))}
					{(!reservas || reservas.length === 0) && (
						<tr>
							<td colSpan="6" style={{ textAlign: 'center', padding: 16 }}>
								No hay reservas activas
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default Adminreservas;
