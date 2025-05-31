const puppeteer = require('puppeteer');

async function runPerformanceTests() {
  console.log('🚀 Démarrage des tests de performance...\n');
  
  const browser = await puppeteer.launch({
    headless: true, // Mode headless pour de meilleures performances
    defaultViewport: {
      width: 1280,
      height: 720
    }
  });
  
  const page = await browser.newPage();
  
  // Activer les métriques de performance dans Puppeteer
  await page.setCacheEnabled(false);
  
  // Collection des métriques pour chaque page
  const metrics = {};
  
  // Fonction pour mesurer les performances d'une page
  async function measurePage(name, url) {
    console.log(`\n🧪 Test de performance: ${name} (${url})`);
    
    // Commencer à collecter la couverture
    await Promise.all([
      page.coverage.startJSCoverage(),
      page.coverage.startCSSCoverage()
    ]);
    
    // Naviguer vers la page
    const navigationStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle0' });
    const navigationDuration = Date.now() - navigationStart;
    
    // Obtenir les métriques après chargement
    const performanceMetrics = await page.metrics();
    const performanceTiming = JSON.parse(
      await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    
    // Arrêter de collecter la couverture
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ]);
    
    // Calculer la couverture de code
    let jsUsedBytes = 0;
    let jsTotalBytes = 0;
    let cssUsedBytes = 0;
    let cssTotalBytes = 0;
    
    for (const entry of jsCoverage) {
      jsTotalBytes += entry.text.length;
      for (const range of entry.ranges) {
        jsUsedBytes += range.end - range.start;
      }
    }
    
    for (const entry of cssCoverage) {
      cssTotalBytes += entry.text.length;
      for (const range of entry.ranges) {
        cssUsedBytes += range.end - range.start;
      }
    }
    
    // Calculer le FCP (First Contentful Paint)
    const fcpMetric = await page.evaluate(() => {
      const performanceEntries = performance.getEntriesByType('paint');
      return performanceEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime;
    });
    
    // Calculer le DOMContentLoaded
    const domContentLoaded = performanceTiming.domContentLoadedEventEnd - performanceTiming.navigationStart;
    
    // Calculer les ressources chargées
    const resourcesInfo = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        count: resources.length,
        totalSize: resources.reduce((total, resource) => total + resource.transferSize, 0),
        types: {
          script: resources.filter(r => r.initiatorType === 'script').length,
          css: resources.filter(r => r.initiatorType === 'css').length,
          img: resources.filter(r => r.initiatorType === 'img').length,
          xhr: resources.filter(r => r.initiatorType === 'xmlhttprequest').length,
          other: resources.filter(r => !['script', 'css', 'img', 'xmlhttprequest'].includes(r.initiatorType)).length,
        }
      };
    });
    
    // Collecter toutes les métriques
    metrics[name] = {
      navigationDuration,
      domContentLoaded,
      fcpTime: fcpMetric || 'Non disponible',
      jsCode: {
        totalBytes: jsTotalBytes,
        usedBytes: jsUsedBytes,
        utilization: (jsUsedBytes / jsTotalBytes * 100).toFixed(2) + '%'
      },
      cssCode: {
        totalBytes: cssTotalBytes,
        usedBytes: cssUsedBytes,
        utilization: (cssUsedBytes / cssTotalBytes * 100).toFixed(2) + '%'
      },
      memoryInfo: {
        jsHeapSizeLimit: Math.round(performanceMetrics.JSHeapUsedSize / 1024 / 1024),
        totalJSHeapSize: Math.round(performanceMetrics.JSHeapTotalSize / 1024 / 1024),
        usedJSHeapSize: Math.round(performanceMetrics.JSHeapUsedSize / 1024 / 1024)
      },
      resources: resourcesInfo
    };
    
    // Afficher les résultats
    console.log(`  ✓ Temps de navigation: ${navigationDuration}ms`);
    console.log(`  ✓ DOMContentLoaded: ${domContentLoaded}ms`);
    console.log(`  ✓ First Contentful Paint: ${fcpMetric || 'Non disponible'}ms`);
    console.log(`  ✓ JS utilisé: ${jsUsedBytes} / ${jsTotalBytes} bytes (${metrics[name].jsCode.utilization})`);
    console.log(`  ✓ CSS utilisé: ${cssUsedBytes} / ${cssTotalBytes} bytes (${metrics[name].cssCode.utilization})`);
    console.log(`  ✓ Mémoire JS utilisée: ${metrics[name].memoryInfo.usedJSHeapSize}MB / ${metrics[name].memoryInfo.totalJSHeapSize}MB`);
    console.log(`  ✓ Ressources chargées: ${resourcesInfo.count} (JS: ${resourcesInfo.types.script}, CSS: ${resourcesInfo.types.css}, Images: ${resourcesInfo.types.img}, XHR: ${resourcesInfo.types.xhr}, Autres: ${resourcesInfo.types.other})`);
    console.log(`  ✓ Taille totale des ressources: ${Math.round(resourcesInfo.totalSize / 1024)}KB`);
    
    console.log('  ✅ Test terminé');
  }
  
  // Tester toutes les pages principales
  try {
    await measurePage('Page d\'accueil', 'http://localhost:5173');
    await measurePage('Page de connexion', 'http://localhost:5173/login.html');
    await measurePage('Page d\'inscription', 'http://localhost:5173/register.html');
    await measurePage('Page de profil', 'http://localhost:5173/profile.html');
    await measurePage('Page d\'amis', 'http://localhost:5173/friends.html');
    await measurePage('Page de classement', 'http://localhost:5173/leaderboard.html');
  } catch (error) {
    console.error(`❌ Erreur lors des tests: ${error.message}`);
  }
  
  // Afficher le rapport complet
  console.log('\n📊 RAPPORT COMPLET DE PERFORMANCE:');
  console.log('-----------------------------');
  
  for (const [pageName, pageMetrics] of Object.entries(metrics)) {
    console.log(`\n${pageName}:`);
    console.log(`  - Temps de chargement: ${pageMetrics.navigationDuration}ms`);
    console.log(`  - DOMContentLoaded: ${pageMetrics.domContentLoaded}ms`);
    console.log(`  - First Contentful Paint: ${pageMetrics.fcpTime}ms`);
    console.log(`  - Utilisation JS: ${pageMetrics.jsCode.utilization}`);
    console.log(`  - Utilisation CSS: ${pageMetrics.cssCode.utilization}`);
    console.log(`  - Ressources: ${pageMetrics.resources.count} (${Math.round(pageMetrics.resources.totalSize / 1024)}KB)`);
  }
  
  console.log('\n✨ Tests de performance terminés!');
  
  await browser.close();
}

// Exécuter les tests
runPerformanceTests().catch(console.error); 