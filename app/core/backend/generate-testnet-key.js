const { ethers } = require('ethers');
const fs = require('fs');

console.log('🔐 GÉNÉRATION D\'UNE CLÉ TESTNET SÉCURISÉE');
console.log('==========================================');

// Générer un wallet aléatoire
const wallet = ethers.Wallet.createRandom();

console.log('\n✅ NOUVELLE CLÉ GÉNÉRÉE:');
console.log('========================');
console.log(`🔐 Clé privée: ${wallet.privateKey}`);
console.log(`📍 Adresse publique: ${wallet.address}`);
console.log(`🎲 Phrase mnémotechnique: ${wallet.mnemonic.phrase}`);

console.log('\n🛡️  SÉCURITÉ:');
console.log('=============');
console.log('✅ Cette clé est unique et sécurisée');
console.log('✅ Elle n\'est connue que de toi');
console.log('⚠️  Garde-la secrète (même pour le testnet)');
console.log('💡 Sauvegarde la phrase mnémotechnique');

console.log('\n📋 ÉTAPES SUIVANTES:');
console.log('====================');
console.log('1. 📝 Copie la clé privée ci-dessus');
console.log('2. 📁 Remplace BLOCKCHAIN_PRIVATE_KEY dans .env.testnet');
console.log('3. 🌐 Va sur https://faucet.avax.network/');
console.log('4. 💰 Demande des AVAX de test avec ton adresse publique');
console.log('5. 🚀 Lance le backend en mode testnet');

console.log('\n💡 COMMANDES UTILES:');
console.log('===================');
console.log('# Copier la configuration testnet');
console.log('cp .env.testnet .env');
console.log('');
console.log('# Vérifier la clé');
console.log('node check-keys.js');
console.log('');
console.log('# Démarrer en mode testnet');
console.log('npm run dev');

// Optionnel : sauvegarder dans un fichier
const keyInfo = {
  privateKey: wallet.privateKey,
  address: wallet.address,
  mnemonic: wallet.mnemonic.phrase,
  network: 'Avalanche Fuji Testnet',
  rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
  faucet: 'https://faucet.avax.network/',
  generated: new Date().toISOString()
};

fs.writeFileSync('testnet-key-backup.json', JSON.stringify(keyInfo, null, 2));
console.log('\n💾 Clé sauvegardée dans: testnet-key-backup.json');
console.log('⚠️  ATTENTION: Ce fichier contient ta clé privée !');
console.log('🗑️  Supprime-le après avoir copié la clé dans .env.testnet');

console.log('\n🎯 RÉSUMÉ:');
console.log('==========');
console.log(`Clé à copier: ${wallet.privateKey}`);
console.log(`Adresse pour le faucet: ${wallet.address}`); 