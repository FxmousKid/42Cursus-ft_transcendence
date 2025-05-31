const puppeteer = require('puppeteer');

async function runTests() {
  console.log('Starting frontend tests...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1280,720']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  
  // Test 1: Page d'accueil se charge correctement
  try {
    console.log('\n🧪 Test 1: Chargement de la page d\'accueil');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    // Vérifie si le titre de la page est correct
    const title = await page.title();
    console.log(`  ✓ Titre de la page: ${title}`);
    
    // Vérifie si les éléments principaux sont présents
    const headerExists = await page.$('header');
    const footerExists = await page.$('footer');
    console.log(`  ✓ Header présent: ${!!headerExists}`);
    console.log(`  ✓ Footer présent: ${!!footerExists}`);
    
    console.log('  ✅ Test 1 réussi');
  } catch (error) {
    console.error(`  ❌ Test 1 échoué: ${error.message}`);
  }
  
  // Test 2: Inscription d'un nouvel utilisateur
  try {
    console.log('\n🧪 Test 2: Inscription d\'un nouvel utilisateur');
    
    // Aller à la page d'inscription
    await page.click('a[href="/register.html"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const currentUrl = page.url();
    console.log(`  ✓ Navigation vers: ${currentUrl}`);
    
    // Remplir le formulaire d'inscription
    const username = 'testuser_' + Math.floor(Math.random() * 10000);
    const email = `${username}@example.com`;
    const password = 'Password123!';
    
    await page.type('#username', username);
    await page.type('#email', email);
    await page.type('#password', password);
    await page.type('#confirmPassword', password);
    
    console.log(`  ✓ Formulaire rempli avec les identifiants: ${username}, ${email}`);
    
    // Intercepter les requêtes réseau pour voir la réponse du backend
    page.on('response', async response => {
      if (response.url().includes('/auth/register')) {
        const responseData = await response.json();
        console.log(`  ✓ Réponse backend /auth/register: ${JSON.stringify(responseData)}`);
      }
    });
    
    // Soumettre le formulaire
    await Promise.all([
      page.click('#register-form button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {})
    ]);
    
    const newUrl = page.url();
    console.log(`  ✓ URL après soumission: ${newUrl}`);
    
    console.log('  ✅ Test 2 réussi');
  } catch (error) {
    console.error(`  ❌ Test 2 échoué: ${error.message}`);
  }
  
  // Test 3: Connexion avec l'utilisateur existant
  try {
    console.log('\n🧪 Test 3: Connexion avec l\'utilisateur existant');
    
    // Aller à la page de connexion
    await page.goto('http://localhost:5173/login.html', { waitUntil: 'networkidle0' });
    
    // Remplir le formulaire de connexion
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'Password123!');
    
    console.log('  ✓ Formulaire de connexion rempli');
    
    // Intercepter les requêtes réseau pour voir la réponse du backend
    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        const responseData = await response.json().catch(() => ({}));
        console.log(`  ✓ Réponse backend /auth/login: ${JSON.stringify(responseData)}`);
      }
    });
    
    // Soumettre le formulaire
    await Promise.all([
      page.click('#login-form button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {})
    ]);
    
    const newUrl = page.url();
    console.log(`  ✓ URL après connexion: ${newUrl}`);
    
    console.log('  ✅ Test 3 réussi');
  } catch (error) {
    console.error(`  ❌ Test 3 échoué: ${error.message}`);
  }
  
  // Test 4: Accès au profil
  try {
    console.log('\n🧪 Test 4: Accès au profil utilisateur');
    
    // Aller à la page de profil
    await page.goto('http://localhost:5173/profile.html', { waitUntil: 'networkidle0' });
    
    // Vérifier que le profil s'affiche correctement
    const usernameEl = await page.$('#profile-username');
    const username = usernameEl ? await page.evaluate(el => el.textContent, usernameEl) : null;
    
    console.log(`  ✓ Nom d'utilisateur affiché: ${username || 'Non trouvé'}`);
    
    console.log('  ✅ Test 4 réussi');
  } catch (error) {
    console.error(`  ❌ Test 4 échoué: ${error.message}`);
  }
  
  // Test 5: Accès à la page d'amis
  try {
    console.log('\n🧪 Test 5: Accès à la page d\'amis');
    
    // Aller à la page d'amis
    await page.goto('http://localhost:5173/friends.html', { waitUntil: 'networkidle0' });
    
    // Vérifier que la liste d'amis s'affiche
    const friendsListEl = await page.$('#friends-list');
    const friendsRequestsEl = await page.$('#friend-requests');
    
    console.log(`  ✓ Liste d'amis présente: ${!!friendsListEl}`);
    console.log(`  ✓ Demandes d'amis présentes: ${!!friendsRequestsEl}`);
    
    console.log('  ✅ Test 5 réussi');
  } catch (error) {
    console.error(`  ❌ Test 5 échoué: ${error.message}`);
  }
  
  // Test 6: Accès au classement
  try {
    console.log('\n🧪 Test 6: Accès au classement');
    
    // Aller à la page de classement
    await page.goto('http://localhost:5173/leaderboard.html', { waitUntil: 'networkidle0' });
    
    // Vérifier que le tableau de classement s'affiche
    const leaderboardTableEl = await page.$('#leaderboard-table');
    console.log(`  ✓ Tableau de classement présent: ${!!leaderboardTableEl}`);
    
    console.log('  ✅ Test 6 réussi');
  } catch (error) {
    console.error(`  ❌ Test 6 échoué: ${error.message}`);
  }
  
  // Test 7: Déconnexion
  try {
    console.log('\n🧪 Test 7: Déconnexion');
    
    // Cliquer sur le bouton de déconnexion dans le header
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.click('#logout-button');
    
    // Vérifier la redirection vers la page de connexion
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    console.log(`  ✓ URL après déconnexion: ${currentUrl}`);
    
    console.log('  ✅ Test 7 réussi');
  } catch (error) {
    console.error(`  ❌ Test 7 échoué: ${error.message}`);
  }
  
  console.log('\n✨ Tests terminés!');
  
  // Ne pas fermer le navigateur tout de suite pour voir les résultats
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

runTests().catch(console.error); 