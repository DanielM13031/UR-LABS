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

    return (
        <div className="admin-reservas">
            <h2>Reservas activas</h2>
            <table>
                <thead>
                    <tr>
                        <th>Casillero</th>
                        <th>Correo</th>
                        <th>Fecha Inicio</th>
                        <th>Celular</th>
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
