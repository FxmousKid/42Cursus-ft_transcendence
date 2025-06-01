const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const API_TESTS = 'api-tests.js';
const FRONTEND_TESTS = 'tests.js';
const WEBSOCKET_TESTS = 'websocket-tests.js';
const PERFORMANCE_TESTS = 'perf-tests.js';

// Fonction pour exécuter un script de test
function runTest(testScript, testName) {
  return new Promise((resolve, reject) => {
    console.log(`\n========================================`);
    console.log(`🧪 DÉMARRAGE DES TESTS: ${testName}`);
    console.log(`========================================\n`);
    
    const testProcess = spawn('node', [testScript]);
    
    testProcess.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    testProcess.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    
    testProcess.on('close', (code) => {
      console.log(`\n========================================`);
      console.log(`${code === 0 ? '✅' : '❌'} FIN DES TESTS: ${testName} (Code: ${code})`);
      console.log(`========================================\n`);
      
      resolve({
        name: testName,
        success: code === 0,
        code
      });
    });
    
    testProcess.on('error', (error) => {
      console.error(`Erreur lors de l'exécution des tests ${testName}:`, error);
      reject(error);
    });
  });
}

// Fonction principale pour exécuter tous les tests
async function runAllTests() {
  console.log('\n🚀 DÉMARRAGE DE LA SUITE DE TESTS COMPLÈTE\n');
  
  const startTime = Date.now();
  const results = [];
  
  try {
    // Test 1: Tests API
    const apiTestResult = await runTest(API_TESTS, 'Tests API');
    results.push(apiTestResult);
    
    // Test 2: Tests Frontend
    const frontendTestResult = await runTest(FRONTEND_TESTS, 'Tests Frontend');
    results.push(frontendTestResult);
    
    // Test 3: Tests WebSocket
    const websocketTestResult = await runTest(WEBSOCKET_TESTS, 'Tests WebSocket');
    results.push(websocketTestResult);
    
    // Test 4: Tests de Performance
    const perfTestResult = await runTest(PERFORMANCE_TESTS, 'Tests de Performance');
    results.push(perfTestResult);
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests:', error);
  }
  
  // Afficher le rapport final
  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000;
  
  console.log('\n\n=========================================');
  console.log('📊 RAPPORT FINAL DE TESTS');
  console.log('=========================================');
  console.log(`⏱️  Durée totale: ${totalDuration.toFixed(2)} secondes`);
  console.log('');
  
  // Tableau récapitulatif
  console.log('Test                 | Statut    | Code');
  console.log('---------------------|-----------|------');
  
  let totalSuccess = 0;
  let totalTests = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅ SUCCÈS' : '❌ ÉCHEC';
    if (result.success) totalSuccess++;
    
    console.log(`${result.name.padEnd(20)} | ${status.padEnd(10)} | ${result.code}`);
  });
  
  console.log('');
  console.log(`Résumé: ${totalSuccess}/${totalTests} tests réussis (${(totalSuccess/totalTests*100).toFixed(2)}%)`);
  console.log('=========================================');
  
  // Sortir avec un code d'erreur si au moins un test a échoué
  process.exit(totalSuccess === totalTests ? 0 : 1);
}

// Exécuter tous les tests
runAllTests().catch(console.error); 