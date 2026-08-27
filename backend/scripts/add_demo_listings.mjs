import db from '../db.js';

const demo = [
  { crop_name: 'Plantain', category: 'Fruits', quantity: 500, unit: 'kg', price_per_unit: 3.2, negotiable: 1, organic: 0, harvest_date: '2026-08-05', region: 'Greater Accra', description: 'Ripe plantain bunches for wholesale.' },
  { crop_name: 'Ginger', category: 'Roots', quantity: 120, unit: 'kg', price_per_unit: 8.0, negotiable: 0, organic: 0, harvest_date: '2026-08-03', region: 'Eastern', description: 'Cleaned and graded ginger roots.' },
  { crop_name: 'SweetPotato', category: 'Tubers', quantity: 300, unit: 'kg', price_per_unit: 2.5, negotiable: 1, organic: 0, harvest_date: '2026-08-01', region: 'Volta', description: 'Sweet potato, good for roasting and processing.' },
  { crop_name: 'Eggplant', category: 'Vegetables', quantity: 180, unit: 'kg', price_per_unit: 4.3, negotiable: 0, organic: 0, harvest_date: '2026-08-02', region: 'Bono', description: 'Fresh eggplants, locally grown.' },
];

for (const d of demo) {
  const exists = db.prepare('SELECT COUNT(*) c FROM listings WHERE crop_name = ?').get(d.crop_name).c;
  if (exists) {
    console.log(`${d.crop_name} already exists, skipping.`);
    continue;
  }
  // pick a farmer id
  const farmer = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('farmer');
  if (!farmer) {
    console.error('No farmer account found; aborting.');
    process.exit(1);
  }
  db.prepare(`INSERT INTO listings (farmer_id, crop_name, category, quantity, unit, price_per_unit, negotiable, organic, harvest_date, region, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`)
    .run(farmer.id, d.crop_name, d.category, d.quantity, d.unit, d.price_per_unit, d.negotiable ? 1 : 0, d.organic ? 1 : 0, d.harvest_date, d.region, d.description);
  console.log(`Inserted ${d.crop_name}`);
}

console.log('Done.');
