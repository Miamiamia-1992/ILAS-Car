import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  prepare: (sql) => ({
    run: (...params) => pool.query(sql, params),
    get: (...params) => pool.query(sql, params).then(r => r.rows[0]),
    all: (...params) => pool.query(sql, params).then(r => r.rows)
  }),
  exec: (sql) => pool.query(sql)
};

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      plate_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      fuel_type TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      person_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS unavailable_dates (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      UNIQUE(vehicle_id, date)
    );
  `);

  const vehicleCount = await pool.query('SELECT COUNT(*) as count FROM vehicles');
  if (parseInt(vehicleCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO vehicles (name, plate_number, type, fuel_type, description)
      VALUES 
        ('白色大通', '京MGW855', '上汽大通G10', '汽油', ''),
        ('长安汽车', '京ABN2758', '长安新能源', '纯电动', ''),
        ('红旗汽车', '京N3FD76', '红旗H7', '汽油', '限领导使用，约此车请提前与安全保卫处联系')
    `);
  }
}

await initDatabase();

export default db;
