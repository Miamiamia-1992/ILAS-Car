import express from 'express';
import cors from 'cors';
import pg from 'pg';
const { Pool } = pg;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ilas_admin_2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        plate_number TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        fuel_type TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS unavailable_dates (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        UNIQUE(vehicle_id, date)
      )
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
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

initDatabase();

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: '未授权' });
  }
};

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: '密码错误' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE is_active = 1');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: '获取车辆列表失败' });
  }
});

app.get('/api/vehicles/:id/unavailable', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM unavailable_dates WHERE vehicle_id = $1',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败' });
  }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, v.name as vehicle_name, v.plate_number, v.type, v.fuel_type
      FROM reservations r
      JOIN vehicles v ON r.vehicle_id = v.id
      ORDER BY r.date DESC, r.start_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: '获取预约列表失败' });
  }
});

app.get('/api/reservations/:vehicleId/:date', async (req, res) => {
  try {
    const { vehicleId, date } = req.params;
    const result = await pool.query(
      'SELECT * FROM reservations WHERE vehicle_id = $1 AND date = $2 ORDER BY start_time',
      [vehicleId, date]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: '获取预约失败' });
  }
});

app.post('/api/reservations', async (req, res) => {
  const { vehicleId, date, startTime, endTime, personName, phone, reason } = req.body;
  
  if (!vehicleId || !date || !startTime || !endTime || !personName || !phone || !reason) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  try {
    const unavailable = await pool.query(
      'SELECT * FROM unavailable_dates WHERE vehicle_id = $1 AND date = $2',
      [vehicleId, date]
    );

    if (unavailable.rows.length > 0) {
      return res.status(400).json({ message: '该日期车辆不可用' });
    }

    const conflicting = await pool.query(`
      SELECT * FROM reservations 
      WHERE vehicle_id = $1 AND date = $2 AND status != 'rejected'
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `, [vehicleId, date, startTime, endTime]);

    if (conflicting.rows.length > 0) {
      return res.status(400).json({ message: '该时间段已被预约' });
    }

    const result = await pool.query(`
      INSERT INTO reservations (vehicle_id, date, start_time, end_time, person_name, phone, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [vehicleId, date, startTime, endTime, personName, phone, reason]);
    
    res.json({ 
      success: true, 
      id: result.rows[0].id,
      message: '预约提交成功，等待审批'
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: '预约失败' });
  }
});

app.patch('/api/reservations/:id/status', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: '无效状态' });
  }

  try {
    await pool.query('UPDATE reservations SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '更新失败' });
  }
});

app.delete('/api/reservations/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

app.post('/api/unavailable', verifyAdmin, async (req, res) => {
  const { vehicleId, date, reason } = req.body;
  
  if (!vehicleId || !date) {
    return res.status(400).json({ message: '请选择车辆和日期' });
  }

  try {
    await pool.query(`
      INSERT INTO unavailable_dates (vehicle_id, date, reason)
      VALUES ($1, $2, $3)
      ON CONFLICT (vehicle_id, date) DO UPDATE SET reason = $3
    `, [vehicleId, date, reason || '']);
    
    res.json({ success: true, message: '已设置该日期不可用' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: '设置失败' });
  }
});

app.get('/api/unavailable', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ud.*, v.plate_number, v.name as vehicle_name
      FROM unavailable_dates ud
      JOIN vehicles v ON ud.vehicle_id = v.id
      ORDER BY ud.date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败' });
  }
});

app.delete('/api/unavailable/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM unavailable_dates WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
