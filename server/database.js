import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'ilas_car.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    plate_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    UNIQUE(vehicle_id, date)
  );
`);

const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
if (vehicleCount.count === 0) {
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (name, plate_number, type, fuel_type, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertVehicle.run('白色大通', '京MGW855', '上汽大通G10', '汽油', '');
  insertVehicle.run('长安汽车', '京ABN2758', '长安新能源', '纯电动', '');
  insertVehicle.run('红旗汽车', '京N3FD76', '红旗H7', '汽油', '限领导使用，约此车请提前与安全保卫处联系');
}

export default db;
