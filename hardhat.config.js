require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        // Local development
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337
        },
        
        // Ethereum Mainnet
        mainnet: {
            url: process.env.MAINNET_RPC_URL || "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 20000000000, // 20 gwei
        },
        
        // Ethereum Sepolia Testnet
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 20000000000,
        },
        
        // Polygon Mainnet
        polygon: {
            url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 30000000000, // 30 gwei
        },
        
        // BSC Mainnet
        bsc: {
            url: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 5000000000, // 5 gwei
        }
    },
    
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY,
            sepolia: process.env.ETHERSCAN_API_KEY,
            polygon: process.env.POLYGONSCAN_API_KEY,
            bsc: process.env.BSCSCAN_API_KEY
        }
    },
    
    gasReporter: {
        enabled: true,
        currency: 'USD',
        gasPrice: 20
    }
};