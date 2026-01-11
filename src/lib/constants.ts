export const ZONES = [
    { id: 'A', name: 'Zone A (โซนโชติพันธ์ 1)', price: 43, rows: 3, cols: 9, color: '#ef4444' }, // Red
    { id: 'B', name: 'Zone B (โซนคนเดิน)', price: 43, rows: 3, cols: 9, color: '#f97316' }, // Orange
    { id: 'C', name: 'Zone C (โซนจุ่มแซบ)', price: 43, rows: 3, cols: 9, color: '#eab308' }, // Yellow
    { id: 'D', name: 'Zone D (โซนหนองแคน)', price: 43, rows: 3, cols: 9, color: '#22c55e' }, // Green
    { id: 'E', name: 'Zone E (โซนวิจิตร)', price: 43, rows: 3, cols: 9, color: '#3b82f6' }, // Blue
];

// Generate locks based on configuration
export const GENERATE_LOCKS = (day: 'Saturday' | 'Sunday') => {
    const locks: { id: string; label: string; zone: string; price: number }[] = [];

    // Saturday: Open only 3 zones (A, B, C)
    // Sunday: Open all zones (A, B, C, D, E)
    let activeZones = ZONES;
    if (day === 'Saturday') {
        activeZones = ZONES.slice(0, 3); // Zones A, B, C
    }

    activeZones.forEach(zone => {
        // Create 27 locks (3 rows * 9 cols) per zone
        // Modeled as a simple list for now
        // If we want to strictly mimic 3 groups of 3x3, we might need more complex UI logic,
        // but for data generation, a flat list A01-A27 is standard.
        const totalLocks = zone.rows * zone.cols; // 27

        for (let i = 1; i <= totalLocks; i++) {
            // Zero pad: A01, A02 ... A27
            const paddedNum = i < 10 ? `0${i}` : `${i}`;
            locks.push({
                id: `${zone.id}${paddedNum}`,
                label: `${zone.id}${paddedNum}`,
                zone: zone.id,
                price: zone.price,
            });
        }
    });
    return locks;
};
