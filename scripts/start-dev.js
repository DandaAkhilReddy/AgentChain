const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Development Environment...\n');

// Start Hardhat node
console.log('1️⃣ Starting Hardhat Local Blockchain...');
const hardhatNode = spawn('npx', ['hardhat', 'node'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

// Wait for Hardhat to start, then deploy contracts
setTimeout(async () => {
  console.log('\n2️⃣ Deploying Smart Contracts...');
  
  const deploy = spawn('npx', ['hardhat', 'run', 'scripts/deploy-basic.js', '--network', 'localhost'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  deploy.on('close', (code) => {
    if (code === 0) {
      console.log('\n3️⃣ Starting React Frontend...');
      
      // Install frontend dependencies if needed
      const installFrontend = spawn('npm', ['install'], {
        cwd: path.join(__dirname, '..', 'frontend'),
        stdio: 'inherit'
      });

      installFrontend.on('close', (installCode) => {
        if (installCode === 0) {
          // Start React app
          const reactApp = spawn('npm', ['start'], {
            cwd: path.join(__dirname, '..', 'frontend'),
            stdio: 'inherit'
          });

          console.log('\n🎉 Development environment is ready!');
          console.log('📱 Frontend: http://localhost:3000');
          console.log('⛓️ Blockchain: http://localhost:8545');
          console.log('\n💡 Make sure to:');
          console.log('1. Add Hardhat network to MetaMask (Chain ID: 31337)');
          console.log('2. Import a test account with private key from Hardhat output');
          console.log('3. Connect your wallet to the frontend');
        }
      });
    }
  });
}, 5000); // Wait 5 seconds for Hardhat to start

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development environment...');
  hardhatNode.kill();
  process.exit();
});