@echo off
echo ========================================
echo   AutoServe Pro - Starting All Services
echo ========================================

echo [1/4] Seeding Admin account...
cd /d C:\VehicleServiceApp\VehicleService
node seed/adminSeed.js
echo Admin seed done!
timeout /t 2 /nobreak

echo [2/4] Starting Backend...
start "Backend" cmd /k "cd /d C:\VehicleServiceApp\VehicleService && npm run dev"
timeout /t 4 /nobreak

echo [3/4] Starting ngrok tunnel...
start "ngrok" cmd /k "ngrok http --domain=womb-synergy-backpedal.ngrok-free.dev 5000"
timeout /t 4 /nobreak

echo [4/4] Starting Frontend (Android)...
start "Frontend" cmd /k "cd /d C:\VehicleServiceApp && npm run android"

echo ========================================
echo   All services started successfully!
echo   Admin: admin@autoserve.lk / admin123
echo ========================================