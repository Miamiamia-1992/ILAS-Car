import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ilas_admin_2024';

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

const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  if (token === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ message: '未授权' });
  }
};

app.get('/api/vehicles', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE is_active = 1').all();
  res.json(vehicles);
});

app.get('/api/vehicles/:id/unavailable', (req, res) => {
  const unavailable = db.prepare(
    'SELECT * FROM unavailable_dates WHERE vehicle_id = ?'
  ).all(req.params.id);
  res.json(unavailable);
});

app.get('/api/reservations', (req, res) => {
  const reservations = db.prepare(`
    SELECT r.*, v.name as vehicle_name, v.plate_number, v.type, v.fuel_type
    FROM reservations r
    JOIN vehicles v ON r.vehicle_id = v.id
    ORDER BY r.date DESC, r.start_time DESC
  `).all();
  res.json(reservations);
});

app.get('/api/reservations/:vehicleId/:date', (req, res) => {
  const { vehicleId, date } = req.params;
  const reservations = db.prepare(`
    SELECT * FROM reservations 
    WHERE vehicle_id = ? AND date = ?
    ORDER BY start_time
  `).all(vehicleId, date);
  res.json(reservations);
});

app.post('/api/reservations', (req, res) => {
  const { vehicleId, date, startTime, endTime, personName, phone, reason } = req.body;
  
  if (!vehicleId || !date || !startTime || !endTime || !personName || !phone || !reason) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  const unavailable = db.prepare(
    'SELECT * FROM unavailable_dates WHERE vehicle_id = ? AND date = ?'
  ).get(vehicleId, date);

  if (unavailable) {
    return res.status(400).json({ message: '该日期车辆不可用' });
  }

  const conflicting = db.prepare(`
    SELECT * FROM reservations 
    WHERE vehicle_id = ? AND date = ? AND status != 'rejected'
    AND (
      (start_time <= ? AND end_time > ?) OR
      (start_time < ? AND end_time >= ?) OR
      (start_time >= ? AND end_time <= ?)
    )
  `).all(vehicleId, date, startTime, startTime, endTime, endTime, startTime, endTime);

  if (conflicting.length > 0) {
    return res.status(400).json({ message: '该时间段已被预约' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO reservations (vehicle_id, date, start_time, end_time, person_name, phone, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(vehicleId, date, startTime, endTime, personName, phone, reason);
    
    res.json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: '预约提交成功，等待审批'
    });
  } catch (error) {
    res.status(500).json({ message: '预约失败' });
  }
});

app.patch('/api/reservations/:id/status', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: '无效状态' });
  }

  try {
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '更新失败' });
  }
});

app.delete('/api/reservations/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

app.post('/api/unavailable', verifyAdmin, (req, res) => {
  const { vehicleId, date, reason } = req.body;
  
  if (!vehicleId || !date) {
    return res.status(400).json({ message: '请选择车辆和日期' });
  }

  try {
    db.prepare(`
      INSERT OR REPLACE INTO unavailable_dates (vehicle_id, date, reason)
      VALUES (?, ?, ?)
    `).run(vehicleId, date, reason || '');
    
    res.json({ success: true, message: '已设置该日期不可用' });
  } catch (error) {
    res.status(500).json({ message: '设置失败' });
  }
});

app.get('/api/unavailable', verifyAdmin, (req, res) => {
  const unavailable = db.prepare(`
    SELECT ud.*, v.plate_number, v.name as vehicle_name
    FROM unavailable_dates ud
    JOIN vehicles v ON ud.vehicle_id = v.id
    ORDER BY ud.date DESC
  `).all();
  res.json(unavailable);
});

app.delete('/api/unavailable/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM unavailable_dates WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '删除失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
