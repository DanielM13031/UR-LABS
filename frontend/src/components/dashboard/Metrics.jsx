import React, { useEffect, useState, useMemo } from 'react';
import {
    PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

const COLORS = {
    bg: '#0f1115',
    text: '#e5e7eb',
    sub: '#9ca3af',
    grid: '#2a2f3a',
    red: '#b91c1c',
    redLight: '#ef4444',
    gray: '#9ca3af',
    grayDark: '#6b7280',
    green: '#10b981'
};

const CAREER_ABBR = {
    'INGENIERÍA ELECTRÓNICA': 'IE',
    'MATEMÁTICAS APLICADAS Y CIENCIAS DE LA COMPUTACIÓN': 'MACC',
    'INGENIERÍA INDUSTRIAL': 'II',
    'INGENIERÍA DE SISTEMAS ENERGÉTICOS': 'ISE',
};

// Paleta para la dona (libres/ocupados)
const PIE_COLORS = [COLORS.grayDark, COLORS.red];

function KPI({ title, value, suffix }) {
    return (
        <div className="card">
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">
            {value}
            {suffix ? <span className="kpi-suffix">{suffix}</span> : null}
        </div>
        </div>
    );
}

// Etiqueta de porcentaje en el centro de la dona
function CenterLabel({ viewBox, tasa }) {
    const { cx, cy } = viewBox;
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            style={{ fill: COLORS.text, fontSize: 18, fontWeight: 600 }}>
        {tasa}%
        </text>
    );
}

export default function Metrics() {
    const [summary, setSummary] = useState({ totalLockers: 0, ocupados: 0, libres: 0, tasa: 0 });
    const [byCareer, setByCareer] = useState({ labels: [], data: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
        try {
            const [sRes, cRes] = await Promise.all([
            fetch('/metrics/lockers/summary'),
            fetch('/metrics/lockers/by-career'),
            ]);
            const sJson = await sRes.json();
            const cJson = await cRes.json();
            setSummary(sJson);
            setByCareer(cJson);
        } catch (e) {
            console.error(e);
            setError('No se pudieron cargar las métricas');
        } finally {
            setLoading(false);
        }
        })();
    }, []);

    const pieData = useMemo(() => ([
        { name: 'Libres', value: summary.libres },
        { name: 'Ocupados', value: summary.ocupados },
    ]), [summary]);

    const barData = useMemo(() =>
    (byCareer.labels || []).map((label, i) => ({
        carreraFull: label,
        abbr: CAREER_ABBR[label] || label,
        reservas: byCareer.data?.[i] || 0
    })), [byCareer]
    );


    const exportMetricsCSV = () => {
        try {
            const lines = [];

            lines.push('Resumen general');
            lines.push('Total casilleros;Ocupados;Libres;Tasa ocupación (%)');
            lines.push(
                `${summary.totalLockers};${summary.ocupados};${summary.libres};${summary.tasa}`
            );
            lines.push('');

            // Sección reservas por carrera
            lines.push('Reservas por carrera');
            lines.push('Carrera;Reservas');

            barData.forEach(row => {
                const carrera = (row.carreraFull || '').replace(/"/g, '""');
                lines.push(`"${carrera}";${row.reservas}`);
            });

            const csvString = lines.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute(
                'download',
                `metricas_labs_ur_${new Date().toISOString().slice(0, 10)}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('[ExportMetrics][ERROR]', e);
            alert('Ocurrió un error al exportar las métricas.');
        }
    };

    if (loading) return <div className="metrics-loading">Cargando métricas…</div>;
    if (error) return <div className="metrics-error">{error}</div>;

    return (
        <div className="metrics-grid">

            {/* Toolbar + botón de exportar */}
            <div className="metrics-toolbar">
                <h2 className="metrics-title">Métricas de casilleros</h2>
                <button className="btn-export-metrics" onClick={exportMetricsCSV}>
                    Exportar métricas (CSV)
                </button>
            </div>


        {/* KPIs */}
        <div className="kpi-grid">
            <KPI title="Casilleros ocupados" value={summary.ocupados} />
            <KPI title="Casilleros libres" value={summary.libres} />
            <KPI title="Tasa de ocupación" value={summary.tasa} suffix="%" />
        </div>

      {/* Dona Ocupación */}
        <div className="card">
            <h3 className="card-title">Ocupación actual</h3>
            <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    dataKey="value"
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    stroke={COLORS.bg}
                    strokeWidth={2}
                    labelLine={false}
                >
                    {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                </Pie>
                {/* Porcentaje en el centro */}
                <CenterLabel tasa={summary.tasa} viewBox={{ cx: '50%', cy: '50%' }} />
                <Tooltip
                    contentStyle={{ background: '#151924', border: '1px solid #2a2f3a', color: COLORS.text }}
                    itemStyle={{ color: COLORS.text }}
                    formatter={(v, n) => [v, n]}
                />
                <Legend
                    wrapperStyle={{ color: COLORS.sub, fontSize: 12 }}
                    verticalAlign="bottom"
                />
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Barras por carrera */}
        <div className="card">
            <h3 className="card-title">Reservas por carrera</h3>
            <div className="chart-box tall">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                <XAxis
                    dataKey="abbr"
                    tick={{ fill: COLORS.sub, fontSize: 12 }}
                    angle={-35}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tickMargin={10}
                />
                <YAxis
                    allowDecimals={false}
                    tick={{ fill: COLORS.sub, fontSize: 12 }}
                    axisLine={{ stroke: COLORS.grid }}
                />
                <Tooltip
                    contentStyle={{ background: '#151924', border: '1px solid #2a2f3a', color: COLORS.text }}
                    itemStyle={{ color: COLORS.text }}
                    formatter={(v) => [v, 'Reservas']}
                />
                <Legend wrapperStyle={{ color: COLORS.sub, fontSize: 12 }} />
                <Bar dataKey="reservas" fill={COLORS.red} radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
        </div>
    );
}
