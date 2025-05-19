const puppeteer = require('puppeteer');

// Liste des pages à tester
const pages = [
  { name: 'Accueil', url: 'http://localhost:5173' },
  { name: 'Connexion', url: 'http://localhost:5173/login.html' },
  { name: 'Inscription', url: 'http://localhost:5173/register.html' },
  { name: 'Profil', url: 'http://localhost:5173/profile.html' },
  { name: 'Amis', url: 'http://localhost:5173/friends.html' },
  { name: 'Classement', url: 'http://localhost:5173/leaderboard.html' },
  { name: 'Jeu', url: 'http://localhost:5173/game.html' }
];

// Types de messages console à surveiller
const CONSOLE_TYPES = {
  LOG: 'log',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

async function checkConsoleErrors() {
  console.log('🔍 Vérification des erreurs de console...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 720
    }
  });
  
  const page = await browser.newPage();
  const results = {};
  let hasErrors = false;
  
  // Fonction pour collecter les logs de console
  for (const pageInfo of pages) {
    console.log(`\n🧪 Vérification de la page: ${pageInfo.name} (${pageInfo.url})`);
    
    // Initialiser les compteurs pour cette page
    results[pageInfo.name] = {
      logs: 0,
      infos: 0,
      warnings: 0,
      errors: 0,
      messages: []
    };
    
    // Écouter les événements de console
    page.on('console', (message) => {
      const type = message.type();
      const text = message.text();
      
      // Incrémenter le compteur approprié
      switch (type) {
        case CONSOLE_TYPES.LOG:
          results[pageInfo.name].logs++;
          break;
        case CONSOLE_TYPES.INFO:
          results[pageInfo.name].infos++;
          break;
        case CONSOLE_TYPES.WARNING:
          results[pageInfo.name].warnings++;
          results[pageInfo.name].messages.push({ type: 'warning', text });
          break;
        case CONSOLE_TYPES.ERROR:
          results[pageInfo.name].errors++;
          results[pageInfo.name].messages.push({ type: 'error', text });
          hasErrors = true;
          break;
      }
    });
    
    // Écouter les erreurs de requête réseau
    page.on('pageerror', (error) => {
      results[pageInfo.name].errors++;
      results[pageInfo.name].messages.push({ type: 'error', text: error.message });
      hasErrors = true;
    });
    
    // Charger la page
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle0', timeout: 10000 });
      
      // Interactions de base avec la page
      await page.evaluate(() => {
        // Simuler quelques interactions utilisateur
        document.body.click();
        window.scrollTo(0, document.body.scrollHeight / 2);
        window.scrollTo(0, document.body.scrollHeight);
        window.scrollTo(0, 0);
      });
      
      // Attendre un peu plus pour les éventuels logs tardifs
      await page.waitForTimeout(1000);
      
      // Afficher les résultats pour cette page
      console.log(`  ✓ Logs: ${results[pageInfo.name].logs}`);
      console.log(`  ✓ Infos: ${results[pageInfo.name].infos}`);
      console.log(`  ✓ Avertissements: ${results[pageInfo.name].warnings}`);
      console.log(`  ✓ Erreurs: ${results[pageInfo.name].errors}`);
      
      if (results[pageInfo.name].warnings > 0 || results[pageInfo.name].errors > 0) {
        console.log('\n  Messages d\'avertissement et d\'erreur:');
        results[pageInfo.name].messages.forEach((msg, i) => {
          console.log(`  ${msg.type === 'error' ? '❌' : '⚠️'} ${i+1}. ${msg.text}`);
        });
      }
      
      // Réinitialiser les écouteurs d'événements pour la prochaine page
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      
    } catch (error) {
      console.error(`  ❌ Erreur lors du chargement de la page: ${error.message}`);
      results[pageInfo.name].errors++;
      results[pageInfo.name].messages.push({ type: 'error', text: error.message });
      hasErrors = true;
    }
  }
  
  // Afficher un résumé global
  console.log('\n\n=========================================');
  console.log('📊 RÉSUMÉ DES ERREURS DE CONSOLE');
  console.log('=========================================');
  
  let totalWarnings = 0;
  let totalErrors = 0;
  
  for (const [pageName, result] of Object.entries(results)) {
    totalWarnings += result.warnings;
    totalErrors += result.errors;
    
    console.log(`\n${pageName}:`);
    console.log(`  - Avertissements: ${result.warnings}`);
    console.log(`  - Erreurs: ${result.errors}`);
  }
  
  console.log('\n----------------------------------------');
  console.log(`Total des avertissements: ${totalWarnings}`);
  console.log(`Total des erreurs: ${totalErrors}`);
  console.log('=========================================');
  
  if (totalErrors > 0) {
    console.log('\n❌ DES ERREURS ONT ÉTÉ DÉTECTÉES! Veuillez les corriger avant de continuer.');
  } else if (totalWarnings > 0) {
    console.log('\n⚠️ DES AVERTISSEMENTS ONT ÉTÉ DÉTECTÉS. Il est recommandé de les vérifier.');
  } else {
    console.log('\n✅ AUCUNE ERREUR NI AVERTISSEMENT DÉTECTÉ. Tout semble fonctionner correctement!');
  }
  
  await browser.close();
  
  // Retourner un code d'erreur si des erreurs ont été trouvées
  return totalErrors > 0 ? 1 : 0;
}

// Exécuter la vérification
checkConsoleErrors()
  .then((exitCode) => {
    console.log('\n✨ Vérification terminée!');
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Erreur lors de la vérification:', error);
    process.exit(1);
  }); 