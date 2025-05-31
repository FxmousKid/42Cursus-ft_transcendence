import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("🚀 Déploiement du smart contract TournamentScores sur Avalanche...");

  // 1. Récupérer le compte qui déploie
  const [deployer] = await ethers.getSigners();
  console.log("📝 Déploiement avec le compte:", deployer.address);

  // 2. Vérifier le solde (pour payer les gas fees)
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Solde du compte:", ethers.formatEther(balance), "AVAX");

  if (balance === 0n) {
    console.log("⚠️  ATTENTION: Solde insuffisant!");
    console.log("🔗 Pour obtenir des AVAX de test:");
    console.log("   1. Allez sur https://faucet.avax.network/");
    console.log("   2. Sélectionnez 'Fuji Testnet'");
    console.log("   3. Entrez votre adresse:", deployer.address);
    console.log("   4. Demandez des tokens de test");
    return;
  }

  // 3. Déployer le contrat
  console.log("📦 Compilation et déploiement du contrat...");
  const TournamentScores = await ethers.getContractFactory("TournamentScores");
  const tournamentScores = await TournamentScores.deploy();

  // 4. Attendre la confirmation
  await tournamentScores.waitForDeployment();
  const contractAddress = await tournamentScores.getAddress();

  console.log("✅ Contrat déployé avec succès!");
  console.log("📍 Adresse du contrat:", contractAddress);
  console.log("🔗 Voir sur l'explorateur:", `https://testnet.snowtrace.io/address/${contractAddress}`);

  // 5. Vérifier que le déployeur est autorisé
  const isAuthorized = await tournamentScores.authorizedRecorders(deployer.address);
  console.log("🔐 Déployeur autorisé:", isAuthorized);

  // 6. Sauvegarder les informations de déploiement
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: await deployer.provider.getNetwork(),
    deploymentTime: new Date().toISOString(),
    transactionHash: tournamentScores.deploymentTransaction()?.hash
  };

  // Créer le dossier deployments s'il n'existe pas
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Sauvegarder les infos
  const deploymentFile = path.join(deploymentsDir, 'tournament-scores.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Informations sauvegardées dans:", deploymentFile);

  // 7. Instructions pour la suite
  console.log("\n🎯 PROCHAINES ÉTAPES:");
  console.log("1. Copiez cette adresse dans votre .env:");
  console.log(`   TOURNAMENT_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. Ajoutez votre clé privée dans .env:");
  console.log(`   BLOCKCHAIN_PRIVATE_KEY=votre_clé_privée`);
  console.log("\n3. Redémarrez votre backend pour activer la blockchain");
  console.log("\n4. Testez avec un match de tournoi!");

  // 8. Test rapide du contrat
  console.log("\n🧪 Test rapide du contrat...");
  try {
    const matchCount = await tournamentScores.getTournamentMatchCount(1);
    console.log("✅ Contrat fonctionnel! Matchs dans tournoi 1:", matchCount.toString());
  } catch (error) {
    console.log("❌ Erreur lors du test:", error);
  }
}

// Gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement:", error);
    process.exit(1);
  }); 