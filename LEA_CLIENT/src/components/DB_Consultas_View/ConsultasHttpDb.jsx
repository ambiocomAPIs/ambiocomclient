import React, { useState, useMemo } from 'react';

const endpoints = {
  'Tabla De Colores': '
https://ambiocomserver.onrender.com/api/tableColors/dataColors',
  'Cierre de Mes': '
https://ambiocomserver.onrender.com/api/cierreMes/data',
  'Horas Extras': '
https://ambiocomserver.onrender.com/api/usuarios/obtenerUsuarioHorasExtras',
  'Niveles Tanques Jornaleros': '
https://ambiocomserver.onrender.com/api/tanquesjornaleros/nivelesdiariostanquesjornaleros',
  'SGMRC Data': '
https://ambiocomserver.onrender.com/api/table/data',
  'bitacora Supervisores': '
https://ambiocomserver.onrender.com/api/notasbitacora',
  'Movimientos Insumos': '
https://ambiocomserver.onrender.com/api/registro/movimientos',
  'Operaciones de Tanques': '
https://ambiocomserver.onrender.com/api/reportar/veroperacionesdetanques',
};

const colors = [
    '#FFD93D', // amarillo
    '#4ECDC4', // turquesa
    '#FF9F1C', // naranja
    '#1982C4', // azul
    '#6A4C93', // morado
    '#FF6B6B', // rojo claro
];

// Parsear filtros múltiples
function parseFiltersMultiple(filter) {
  if (!filter) return [];
  return filter
    .split(';')
    .map(f => {
      const trimmed = f.trim();
      const match = trimmed.match(/^(\w+)\s*:\s*"(.*)"$/);
      if (match) {
        return { key: match[1], value: match[2].toLowerCase() };
      } else if (trimmed.length > 0) {
        return { text: trimmed.toLowerCase() };
      }
      return null;
    })
    .filter(Boolean);
}

// Función para escapar caracteres especiales para RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función para resaltar coincidencias múltiples con colores diferentes
function highlightText(text, filters) {
  if (!filters.length) return text;

  let result = text;
  filters.forEach((filter, idx) => {
    let pattern;
    if (filter.key && filter.value !== undefined) {
      pattern = escapeRegExp(filter.value);
    } else if (filter.text) {
      pattern = escapeRegExp(filter.text);
    } else {
      return;
    }

    const regex = new RegExp(pattern, 'gi');
    const color = colors[idx % colors.length];
    
    // Reemplazar coincidencias con span color
    result = result.replace(regex, match => `<span style="background-color: ${color}; color: black;">${match}</span>`);
  });

  return result;
}

const ConsultasHttpDb = () => {
  const [selected, setSelected] = useState('');
  const [dataCache, setDataCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');

  const handleSelect = async (endpointKey) => {
    setSelected(endpointKey);
    setFilterText(''); // Limpiar filtro al cambiar endpoint

    if (dataCache[endpointKey]) return;

    setLoading(true);
    try {
      const res = await fetch(endpoints[endpointKey]);
      const data = await res.json();
      setDataCache(prev => ({ ...prev, [endpointKey]: data }));
    } catch (err) {
      setDataCache(prev => ({ ...prev, [endpointKey]: { error: 'Error al obtener datos' } }));
    }
    setLoading(false);
  };

  const filters = useMemo(() => parseFiltersMultiple(filterText), [filterText]);

  // Filtrado de datos
  const filteredData = useMemo(() => {
    if (!selected || !dataCache[selected]) return null;
    const data = dataCache[selected];

    if (!filters.length) return data;

    if (Array.isArray(data)) {
      return data.filter(item =>
        filters.every(f => {
          if (f.key && f.value !== undefined) {
            const v = item[f.key];
            return v != null && String(v).toLowerCase().includes(f.value);
          }
          if (f.text) {
            return JSON.stringify(item).toLowerCase().includes(f.text);
          }
          return true;
        })
      );
    }
    return data;
  }, [selected, dataCache, filters]);

  // Función para renderizar JSON con highlights
  const renderHighlightedJSON = (data) => {
    if (!data) return null;
    const jsonString = JSON.stringify(data, null, 2);

    // Se reemplazan las coincidencias en todo el string JSON
    const highlighted = highlightText(jsonString, filters);

    return (
      <pre
        style={{ backgroundColor: '#f0f0f0', padding: '10px',height:'75vh',  overflow: 'auto', whiteSpace: 'pre-wrap' }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  };

  return (
    <div>
      <h2>Visualizador de GETs</h2>
      {Object.keys(endpoints).map(key => (
        <button key={key} onClick={() => handleSelect(key)} style={{ margin: '5px' }}>
          {key}
        </button>
      ))}

      {selected && (
        <div style={{ marginTop: '20px' }}>
          <input
            type="text"
            placeholder='Buscar (ej: fechaRegistro: "2025"; tk803)'
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          {loading && <p>Cargando...</p>}
          {!loading && renderHighlightedJSON(filteredData)}
        </div>
      )}
    </div>
  );
};

export default ConsultasHttpDb;
