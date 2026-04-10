# 车辆预约系统规范

## 1. 概念与愿景

一个简洁高效的内部车辆预约平台，让员工能快速查看车辆可用情况并提交预约申请。设计风格采用政务蓝+科技感的专业风格，界面清晰易用，操作流畅直观。

## 2. 设计语言

### 视觉方向
政务蓝为主色调，搭配清洁的白色背景，营造专业、可信赖的视觉感受。

### 色彩系统
- 主色（Primary）: #1E40AF (深蓝)
- 次色（Secondary）: #3B82F6 (亮蓝)
- 强调色（Accent）: #10B981 (绿色-已批准)
- 警告色（Warning）: #F59E0B (橙色-未批准)
- 危险色（Danger）: #EF4444 (红色-已拒绝/不可用)
- 背景色: #F8FAFC
- 卡片背景: #FFFFFF
- 文字主色: #1E293B
- 文字次色: #64748B

### 字体
- 主字体: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif
- 标题字重: 600
- 正文字重: 400

### 间距系统
- 基础单位: 4px
- 卡片内边距: 24px
- 组件间距: 16px
- 页面边距: 32px

### 动效
- 过渡时长: 200ms
- 缓动函数: ease-out
- 悬停效果: 轻微上浮 + 阴影加深
- 选中效果: 背景色渐变 + 边框高亮

## 3. 布局与结构

### 页面结构
```
┌─────────────────────────────────────────────┐
│ Header: Logo + 系统名称 + 管理入口按钮        │
├─────────────────────────────────────────────┤
│ 车辆选择卡片区（三辆车横向排列）              │
├─────────────────────────────────────────────┤
│ 日历选择区 + 时间段选择区                    │
├─────────────────────────────────────────────┤
│ 预约表单区（选择时间后显示）                  │
├─────────────────────────────────────────────┤
│ 预约记录展示区（所有车辆的预约状态）          │
└─────────────────────────────────────────────┘
```

### 响应式策略
- 桌面端(>1024px): 三辆车卡片横向排列
- 平板端(768-1024px): 两辆车一行
- 移动端(<768px): 单列显示

## 4. 功能与交互

### 核心功能

#### 4.1 车辆选择
- 三辆车以卡片形式展示
- 每张卡片显示：车牌号、车型、燃油类型、特殊说明
- 点击选中后高亮显示

#### 4.2 日历选择
- 月份日历视图
- 日期状态：
  - 白色：可预约
  - 绿色条纹：已批准预约
  - 橙色条纹：待审批预约
  - 红色/灰色：管理员设置为不可用
- 点击日期展开24小时时间段列表

#### 4.3 时间段选择
- 24小时列表，每半小时一个格子
- 显示格式：08:00、08:30、09:00...
- 点击第一个格子为开始时间（蓝色高亮）
- 点击第二个格子为结束时间（蓝色区间覆盖）
- 灰色区域为不可用时间段
- 可点击已选时间段取消选择

#### 4.4 预约表单
- 必填项：姓名、电话、预约原因
- 显示已选择的时间段（开始-结束）
- 提交后状态为"待审批"

#### 4.5 预约记录展示
- 所有人可见
- 按日期分组显示
- 显示：车牌号、预约时间、申请人、预约原因、状态
- 状态标签：待审批(橙)、已批准(绿)、已拒绝(红)

#### 4.6 管理员功能
- 登录入口（固定密码）
- 预约审批：批准/拒绝按钮
- 撤回功能：已批准可撤回
- 设置不可用日期：选择车辆+日期，标记为不可用

### 交互细节
- 日历切换月份：左右箭头
- 预约提交：表单验证 + 成功提示
- 时间冲突：实时提示不可选

## 5. 组件清单

### 车辆卡片
- 默认：白色背景 + 细边框
- 选中：蓝色边框 + 浅蓝背景
- 包含：车辆图标、车牌号、类型标签、说明文字

### 日期格子
- 默认：白色背景
- 悬停：浅灰背景
- 有预约：顶部条纹指示
- 不可用：灰色背景 + 删除线
- 选中：蓝色背景 + 白色文字

### 时间格子
- 默认：白色背景 + 边框
- 悬停：浅蓝背景
- 选中开始：深蓝背景
- 选中区间：浅蓝背景
- 不可用：灰色背景 + 禁用图标

### 表单输入框
- 默认：灰色边框
- 聚焦：蓝色边框 + 阴影
- 错误：红色边框 + 错误提示

### 按钮
- 主按钮：蓝色背景 + 白色文字
- 次按钮：白色背景 + 蓝色边框
- 危险按钮：红色背景 + 白色文字
- 禁用：灰色背景 + 禁用光标

### 状态标签
- 待审批：橙色背景 + 深橙文字
- 已批准：绿色背景 + 深绿文字
- 已拒绝：红色背景 + 深红文字
- 不可用：灰色背景 + 深灰文字

## 6. 技术方案

### 技术栈
- 前端：React 18 + TypeScript + TailwindCSS + Vite
- 后端：Node.js + Express
- 数据库：SQLite + better-sqlite3
- 日历组件：自定义实现

### 数据模型

#### 车辆表 (vehicles)
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1
);
```

#### 预约表 (reservations)
```sql
CREATE TABLE reservations (
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
```

#### 不可用日期表 (unavailable_dates)
```sql
CREATE TABLE unavailable_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  UNIQUE(vehicle_id, date)
);
```

### API接口

#### 车辆
- GET /api/vehicles - 获取所有车辆
- GET /api/vehicles/:id/unavailable - 获取车辆不可用日期

#### 预约
- GET /api/reservations - 获取所有预约
- GET /api/reservations/:vehicleId/:date - 获取某车辆某日预约
- POST /api/reservations - 创建预约
- PATCH /api/reservations/:id/status - 更新预约状态

#### 管理
- POST /api/auth/login - 管理员登录
- POST /api/unavailable - 设置不可用日期
- DELETE /api/unavailable/:id - 取消不可用日期

### 认证
- 管理员密码固定：ilas_admin_2024
- 使用简单token验证

## 7. 车辆信息

| 名称 | 车牌号 | 类型 | 燃料 | 特殊说明 |
|------|--------|------|------|----------|
| 白色大通 | 京MGW855 | 上汽大通G10 | 汽油 | - |
| 长安汽车 | 京ABN2758 | 长安新能源 | 纯电动 | - |
| 红旗汽车 | 京N3FD76 | 红旗H7 | 汽油 | 限领导使用，约此车请提前与安全保卫处联系 |
