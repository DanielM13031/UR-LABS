// src/components/AdminUploadEstudiantes.jsx
import { useState } from 'react';
import axios from 'axios';
import './Import.css';

const AdminUploadEstudiantes = () => {
    const [file, setFile] = useState(null);
    const [fileLabel, setFileLabel] = useState('Ningún archivo seleccionado');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected || null);
        setResult(null);

        if (selected) {
        setFileLabel(selected.name);
        } else {
        setFileLabel('Ningún archivo seleccionado');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
        setLoading(true);
        const res = await axios.post(
            'http://localhost:3001/admin/estudiantes/import', // ajusta si usas proxy
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setResult(res.data);
        } catch (err) {
        console.error(err);
        setResult({ ok: false, msg: 'Error subiendo el archivo' });
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="upload-card">
        <div className="upload-header">
            <h3>Cargar estudiantes desde CSV</h3>
            <p>Actualiza la base de correos institucionales para el sistema de reservas.</p>
        </div>

        <div className="upload-controls">
            <label htmlFor="csvInput" className="upload-file-label">
            <span>Seleccionar archivo</span>
            </label>
            <input
            id="csvInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            hidden
            />

            <span className="upload-file-name">{fileLabel}</span>

            <button
            className="upload-button"
            onClick={handleUpload}
            disabled={!file || loading}
            >
            {loading ? 'Importando…' : 'Importar CSV'}
            </button>
        </div>

        {result && (
            <div className={`upload-result ${result.ok ? 'ok' : 'error'}`}>
            <p className="upload-result-msg">{result.msg}</p>
            {result.ok && (
                <ul>
                <li>Nuevos registros: <strong>{result.insertados}</strong></li>
                <li>Ya existentes: <strong>{result.yaExistian}</strong></li>
                <li>Total filas CSV: <strong>{result.totalCSV}</strong></li>
                </ul>
            )}
            </div>
        )}
        </div>
    );
};

export default AdminUploadEstudiantes;
