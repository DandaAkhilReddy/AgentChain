@echo off
echo Starting Hardhat Network with deployed contracts...
echo.
echo ===============================================
echo     AgentChains Local Development Network
echo ===============================================
echo.
echo Network: http://localhost:8545
echo Chain ID: 31337
echo.
echo Contract Addresses:
echo MIND Token (BasicToken): 0xc9205abC4A4fceC25E15446A8c2DD19ab60e1149
echo AI Agent NFT (BasicNFT): 0xA38062F23cbF30680De009e59E62B62F6c95a35A
echo Marketplace: 0xefBa1032bB5f9bEC79e022f52D89C2cc9090D1B8
echo.
echo Test Account:
echo Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo Balance: 10,000 ETH
echo.
echo Add this network to MetaMask:
echo - Network Name: AgentChains Local
echo - New RPC URL: http://localhost:8545
echo - Chain ID: 31337
echo - Currency Symbol: ETH
echo.
echo Press Ctrl+C to stop the network
echo.

npx hardhat node