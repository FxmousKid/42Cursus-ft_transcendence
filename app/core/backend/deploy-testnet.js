const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployToTestnet() {
  console.log('🚀 DÉPLOIEMENT MANUEL SUR TESTNET');
  console.log('=================================');
  
  try {
    // 1. Configuration
    const rpcUrl = process.env.AVALANCHE_RPC_URL;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
      console.log('❌ Configuration manquante dans .env');
      console.log('Assure-toi que AVALANCHE_RPC_URL et BLOCKCHAIN_PRIVATE_KEY sont définis');
      return;
    }
    
    console.log(`🌐 Réseau: ${rpcUrl}`);
    console.log(`🔐 Clé: ${privateKey.substring(0, 10)}...`);
    
    // 2. Connexion
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log(`📍 Adresse déployeur: ${wallet.address}`);
    
    // Vérifier le solde
    const balance = await provider.getBalance(wallet.address);
    const balanceAvax = ethers.formatEther(balance);
    console.log(`💰 Solde: ${balanceAvax} AVAX`);
    
    if (parseFloat(balanceAvax) < 0.1) {
      console.log('❌ Solde insuffisant ! Va sur https://faucet.avax.network/');
      return;
    }
    
    // 3. Charger le contrat
    const artifactPath = path.join(process.cwd(), 'blockchain/artifacts/blockchain/contracts/TournamentScores.sol/TournamentScores.json');
    
    if (!fs.existsSync(artifactPath)) {
      console.log('❌ Contrat non compilé. Lance: npx hardhat compile');
      return;
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    console.log('✅ Contrat chargé');
    
    // 4. Déployer
    console.log('\n🚀 Déploiement en cours...');
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    // Estimer le gas
    const deployTx = await factory.getDeployTransaction();
    const gasEstimate = await provider.estimateGas(deployTx);
    const gasPrice = await provider.getFeeData();
    
    console.log(`⛽ Gas estimé: ${gasEstimate.toString()}`);
    console.log(`💸 Prix du gas: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
    
    const contract = await factory.deploy();
    console.log(`📤 Transaction envoyée: ${contract.deploymentTransaction().hash}`);
    
    // 5. Attendre la confirmation
    console.log('⏳ Attente de la confirmation...');
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log(`✅ Contrat déployé à: ${contractAddress}`);
    
    // 6. Mettre à jour le .env
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedEnv = envContent.replace(
      /TOURNAMENT_CONTRACT_ADDRESS=.*/,
      `TOURNAMENT_CONTRACT_ADDRESS=${contractAddress}`
    );
    
    fs.writeFileSync('.env', updatedEnv);
    console.log('✅ Fichier .env mis à jour');
    
    // 7. Vérifier le déploiement
    console.log('\n🔍 Vérification du contrat...');
    const code = await provider.getCode(contractAddress);
    console.log(`📊 Taille du code: ${code.length} caractères`);
    
    // Test d'appel
    const testContract = new ethers.Contract(contractAddress, artifact.abi, provider);
    const matchCount = await testContract.getMatchCount(1);
    console.log(`🏆 Matchs du tournoi 1: ${matchCount}`);
    
    console.log('\n🎉 DÉPLOIEMENT RÉUSSI !');
    console.log('======================');
    console.log(`📍 Adresse du contrat: ${contractAddress}`);
    console.log(`🌐 Explorateur: https://testnet.snowtrace.io/address/${contractAddress}`);
    console.log(`🔗 Transaction: https://testnet.snowtrace.io/tx/${contract.deploymentTransaction().hash}`);
    
  } catch (error) {
    console.error('❌ Erreur de déploiement:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 SOLUTION: Récupère plus d\'AVAX sur https://faucet.avax.network/');
    }
  }
}

deployToTestnet(); 