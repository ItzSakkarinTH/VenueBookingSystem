export const ZONES = [
    { id: 'A', name: 'Zone A (โซนโชติพันธ์ 1)', price: 500, rows: 2, cols: 5, color: '#ef4444' }, // Red
    { id: 'B', name: 'Zone B (โซนคนเดิน)', price: 400, rows: 2, cols: 5, color: '#eab308' }, // Yellow
    { id: 'C', name: 'Zone C (โซนจุ่มแซบ)', price: 300, rows: 2, cols: 5, color: '#22c55e' }, // Green
    { id: 'D', name: 'Zone D (โซนหนองแคน)', price: 300, rows: 2, cols: 5, color: '#3b82f6' }, // Blue
    { id: 'E', name: 'Zone E (โซนวิจิตร)', price: 200, rows: 2, cols: 5, color: '#f97316' }, // Orange
];

// Mock Layout: Generate locks based on configuration
export const GENERATE_LOCKS = (day: 'Saturday' | 'Sunday') => {
    const locks: { id: string; label: string; zone: string; price: number }[] = [];

    // For simplicity, all zones active every day for now, or customize as needed
    // The user previously had logic: Saturday A&B only. 
    // I will keep all zones active for now as the user asked for this specific layout.
    const activeZones = ZONES;

    activeZones.forEach(zone => {
        for (let r = 1; r <= zone.rows; r++) {
            for (let c = 1; c <= zone.cols; c++) {
                // Pad numbers for sorting, e.g. A01, A02
                const num = ((r - 1) * zone.cols) + c;
                const paddedNum = num < 10 ? `0${num}` : `${num}`;
                locks.push({
                    id: `${zone.id}${paddedNum}`,
                    label: `${zone.id}${paddedNum}`,
                    zone: zone.id,
                    price: zone.price,
                });
            }
        }
    });
    return locks;
};
