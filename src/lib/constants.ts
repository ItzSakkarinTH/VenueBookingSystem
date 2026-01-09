export const ZONES = [
    { id: 'A', name: 'Zone A (ทำเลทอง)', price: 500, rows: 3, cols: 3, color: '#FFD700' },
    { id: 'B', name: 'Zone B (ทั่วไป)', price: 300, rows: 3, cols: 3, color: '#0099FF' },
    { id: 'C', name: 'Zone C (ประหยัด)', price: 150, rows: 3, cols: 3, color: '#48BB78' },
];

// Mock Layout: 3x3 blocks for each zone
export const GENERATE_LOCKS = (day: 'Saturday' | 'Sunday') => {
    const locks: { id: string; label: string; zone: string; price: number }[] = [];

    // Saturday: Only A and B
    // Sunday: All Zones
    const activeZones = day === 'Saturday' ? ZONES.slice(0, 2) : ZONES;

    activeZones.forEach(zone => {
        for (let r = 1; r <= zone.rows; r++) {
            for (let c = 1; c <= zone.cols; c++) {
                locks.push({
                    id: `${zone.id}${r}${c}`, // e.g., A11 (Row 1 Col 1)
                    label: `${zone.id}-${r}-${c}`,
                    zone: zone.id,
                    price: zone.price,
                });
            }
        }
    });
    return locks;
};
