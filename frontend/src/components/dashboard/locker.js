import React, { useEffect, useState } from 'react';
import axios from '../auth/axiosconfig';
import { useNavigate } from 'react-router-dom';
import './locker.css';

const Reservas = () => {
    const [lockers, setLockers] = useState([]);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [userMail, setUserMail] = useState('');
    const [startTime, setStartTime] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLockers = async () =>{
            try{
                const response = await axios.get('/lockers');
                setLockers(response.data);
            }catch (error) { 
                console.error( 'Error al obtener casilleros', error);
            }
        };
        fetchLockers();
    }, []);

    const handleSelect = (lockerId) => {
        setSelectedLocker (lockerId === selectedLocker ? null : lockerId);
    };

    const handleReserve = async ()=> {
        if(!selectedLocker || !userMail || !startTime) {
            alert('Por favor llenar los campos.');
            return;
        }
        try{
            await axios.post('/reserve', {
                lockerId: selectedLocker,
                userMail,
                startTime
            });
            alert('Reserva exitosa');
            setSelectedLocker(null);
            setUserMail('');
            setStartTime('');
            const updated = await axios.get('/lockers');
            setLockers(updated.data);
        } catch (err) {
            console.error('Error al reservar', err);
            alert('Error al reservar');
        }
    };

const goToDelete = () => {
    navigate('/reservasd');
}

    return (
        <div className="reservas-container">
        <h2>Reservar casillero para un usuario</h2>

        <div className="formulario">
            <label>Correo institucional:</label>
            <input
                type="email"
                value={userMail}
                onChange={(e) => setUserMail(e.target.value)}
                placeholder="usuario@urosario.edu.co"
            />

            <label>Fecha y hora de inicio:</label>
            <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
            />
            </div>

            <div className="locker-grid">
            {lockers.map(locker => (
            <button
                key={locker.id}
                onClick={() => handleSelect(locker.id)}
                disabled={!locker.isAvailable}
                className={`locker-btn ${
                    !locker.isAvailable
                    ? 'ocupado'
                    : selectedLocker === locker.id
                    ? 'seleccionado'
                    : 'disponible'
                }`}
                >
                {locker.numero}
                </button>
            ))}
            </div>

            {selectedLocker && (
            <button className="btn-reservar" onClick={handleReserve}>
                Confirmar Reserva
            </button>
            )}
            <button className="btn-reservar" onClick={goToDelete}>
                Eliminar reservas
            </button>
        </div>
        );

}
export default Reservas;
