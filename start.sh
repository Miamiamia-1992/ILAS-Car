#!/bin/bash

echo "启动 ILAS 车辆预约系统"
echo "====================="

# 启动后端
echo "启动后端服务..."
cd server
npm start &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "启动前端服务..."
cd ../client
npm run dev &
CLIENT_PID=$!

echo ""
echo "服务已启动:"
echo "  后端: http://localhost:3001"
echo "  前端: http://localhost:5173"
echo ""
echo "管理员密码: ilas_admin_2024"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待信号
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
