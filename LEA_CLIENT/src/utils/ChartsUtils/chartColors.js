// este componente lo qu ehace es generar colores en graficas con multiples lineas
const basePalette = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#ea580c',
  '#dc2626',
  '#0891b2',
  '#4f46e5',
  '#65a30d',
];

export function getLineColors(count = 8) {
  if (count <= basePalette.length) {
    return basePalette.slice(0, count);
  }

  const extra = [];
  for (let i = basePalette.length; i < count; i++) {
    const hue = (i * 360) / count;
    extra.push(`hsl(${hue}, 70%, 50%)`);
  }

  return [...basePalette, ...extra];
}