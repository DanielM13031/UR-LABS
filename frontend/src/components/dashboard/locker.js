import React, { useEffect, useState } from 'react';
import axios from '../auth/axiosconfig';
import { useNavigate } from 'react-router-dom';
import './locker.css';

const Reservas = () => {
    const [lockers, setLockers] = useState([]);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [userMail, setUserMail] = useState('');
    const [startTime, setStartTime] = useState('');
    const [edificios, setEdificios] = useState([]);
    const [pisos, setPisos] = useState([]);
    const [edificio, setEdificio] = useState('');
    const [piso, setPiso] = useState('');
    const [Num, setNum] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
    (async () => {
        try {
        const { data } = await axios.get('/lockers/edificios');
        setEdificios((data || []).filter(Boolean));
        } catch (e) {
        console.error('Error cargando edificios', e);
        }
    })();
    }, []);

    useEffect(() => {
    (async () => {
        try {
        setPiso('');
        setSelectedLocker(null);
        setLockers([]);
        if (!edificio) return;

        const { data } = await axios.get('/lockers/pisos', { params: { edificio } });
        const pisosLimpios = (data || []).filter((p) => p !== null && p !== undefined)
            .sort((a,b) => Number(a) - Number(b));
        setPisos(pisosLimpios);
        } catch (e) {
        console.error('Error cargando pisos', e);
        }
    })();
    }, [edificio]);


    useEffect(() => {
    (async () => {
        try {
        setSelectedLocker(null);
        if (!edificio || !piso) { setLockers([]); return; }

        const { data } = await axios.get('/lockers', { params: { edificio, piso: Number(piso) } });
        setLockers(data || []);
        } catch (e) {
            console.error('Error al obtener casilleros', e);
        }
    })();
}, [edificio, piso]);

    const handleSelect = (lockerId) => {
        setSelectedLocker (lockerId === selectedLocker ? null : lockerId);
    };

const handleReserve = async () => {
    if (!selectedLocker || !userMail || !startTime || !Num) {
        alert('Por favor llenar los campos.');
        return;
    }
    const mail = userMail.trim().toLowerCase();
    if (!mail.endsWith('@urosario.edu.co')) {
        alert('Use su correo institucional @urosario.edu.co');
        return;
    }

    try {
        const startISO = new Date(startTime).toISOString();

        const { data } = await axios.post('/reserve', {
        lockerId: selectedLocker,
        userMail: mail,
        startTime: startISO,
        tel: Num
        });

        alert(data?.message || 'Reserva exitosa');

        setSelectedLocker(null);
        setUserMail('');
        setStartTime('');
        setNum('');

        const { data: nuevos } = await axios.get('/lockers', { params: { edificio, piso: Number(piso) } });
        setLockers(nuevos || []);
    } catch (err) {
        console.error('Error al reservar', err);
        alert(err?.response?.data?.message ?? 'Error al reservar');
    }
};

const goToDelete = () => {
    navigate('/reservasd');
}

const asBool = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v === 1;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    return false;
};

return (
    <div className="reservas-container">
        <h2>Reserva de Casilleros</h2>

      {/* Filtros */}
        <div className="filtros">
        <div className="campo">
            <label>Edificio:</label>
            <select value={edificio} onChange={(e) => setEdificio(e.target.value)}>
            <option value="">-- Selecciona --</option>
            {edificios.map((ed, i) => (
                <option key={`ed-${ed}-${i}`} value={ed}>{ed}</option>
            ))}
            </select>
        </div>

        <div className="campo">
            <label>Piso:</label>
            <select
            value={piso}
            onChange={(e) => setPiso(e.target.value)}
            disabled={!edificio}
            >
            <option value="">-- Selecciona --</option>
            {pisos.map((p, i) => (
                <option key={`piso-${p}-${i}`} value={String(p)}>{p}</option>
            ))}
            </select>
        </div>
        </div>

      {/* Form datos de reserva */}
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

        <label>Numero Celular:</label>
        <input
            type="tel"
            value={Num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="+57"
        />
        </div>

        {/* Grilla de lockers filtrados */}
        <div   className={`locker-grid ${
            edificio === 'El Tiempo'
            ? 'grid-11'
            : edificio === 'Calatrava (Torre 2)'
            ? 'grid-12'
            : ''
        }`}
        >
        {lockers.map((locker, i) => {
            const disponible = asBool(locker?.isAvailable);
            return (
            <button
                key={locker.id ?? `locker-${locker.numero ?? i}`}
                onClick={() => handleSelect(locker.id)}
                disabled={!disponible}
                className={`locker-btn ${
                !disponible
                    ? 'ocupado'
                    : selectedLocker === locker.id
                    ? 'seleccionado'
                    : 'disponible'
                }`}
            >
                {locker.numero}
            </button>
            );
        })}
        {edificio && piso && lockers.length === 0 && (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            No hay lockers disponibles en {edificio}, piso {piso}.
            </p>
        )}
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
};

export default Reservas;
