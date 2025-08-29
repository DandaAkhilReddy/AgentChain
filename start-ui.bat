@echo off
echo 🚀 Starting ConsciousAI Blockchain UI...
echo.

echo 1️⃣ Starting Hardhat local blockchain node...
start cmd /k "cd /d %~dp0 && npx hardhat node"

echo.
echo ⏰ Waiting for blockchain to start...
timeout /t 8 /nobreak > nul

echo.
echo 2️⃣ Deploying smart contracts...
npx hardhat run scripts\deploy-basic.js --network localhost

echo.
echo 3️⃣ Installing frontend dependencies...
cd frontend
call npm install

echo.
echo 4️⃣ Starting React frontend...
echo 📱 Opening http://localhost:3000 in your browser...
start http://localhost:3000
npm start

pause