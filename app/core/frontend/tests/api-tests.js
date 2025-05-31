const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
let authToken = null;
let userId = null;

// Fonction utilitaire pour les appels API
async function callApi(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Erreur lors de l'appel API à ${endpoint}:`, error);
    return { status: 500, data: { success: false, message: error.message } };
  }
}

// Tests des fonctionnalités API
async function runApiTests() {
  console.log('🔍 Démarrage des tests API...\n');
  
  // Test 1: Inscription d'un utilisateur
  try {
    console.log('🧪 Test 1: Inscription d\'un utilisateur');
    
    const username = `testapi_${Math.floor(Math.random() * 10000)}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';
    
    const registerResponse = await callApi('/auth/register', 'POST', {
      username,
      email,
      password
    });
    
    console.log(`  ✓ Statut de la réponse: ${registerResponse.status}`);
    console.log(`  ✓ Succès: ${registerResponse.data.success}`);
    console.log(`  ✓ Compte créé pour: ${registerResponse.data.data?.username}`);
    
    if (registerResponse.data.success) {
      authToken = registerResponse.data.data.token;
      userId = registerResponse.data.data.id;
      console.log(`  ✓ Token obtenu: ${authToken.substring(0, 15)}...`);
      console.log(`  ✓ ID utilisateur: ${userId}`);
    }
    
    console.log('  ✅ Test 1 réussi');
  } catch (error) {
    console.error(`  ❌ Test 1 échoué: ${error.message}`);
  }
  
  // Test 2: Connexion
  try {
    console.log('\n🧪 Test 2: Connexion avec un compte existant');
    
    const loginResponse = await callApi('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    console.log(`  ✓ Statut de la réponse: ${loginResponse.status}`);
    console.log(`  ✓ Succès: ${loginResponse.data.success}`);
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      userId = loginResponse.data.data.id;
      console.log(`  ✓ Token obtenu: ${authToken.substring(0, 15)}...`);
      console.log(`  ✓ ID utilisateur: ${userId}`);
    }
    
    console.log('  ✅ Test 2 réussi');
  } catch (error) {
    console.error(`  ❌ Test 2 échoué: ${error.message}`);
  }
  
  // Test 3: Récupération du profil
  try {
    console.log('\n🧪 Test 3: Récupération du profil utilisateur');
    
    const profileResponse = await callApi('/users/profile', 'GET', null, authToken);
    
    console.log(`  ✓ Statut de la réponse: ${profileResponse.status}`);
    console.log(`  ✓ Succès: ${profileResponse.data.success}`);
    
    if (profileResponse.data.success) {
      console.log(`  ✓ Profil récupéré pour: ${profileResponse.data.data.username}`);
      console.log(`  ✓ Email: ${profileResponse.data.data.email}`);
      console.log(`  ✓ Statut: ${profileResponse.data.data.status}`);
    }
    
    console.log('  ✅ Test 3 réussi');
  } catch (error) {
    console.error(`  ❌ Test 3 échoué: ${error.message}`);
  }
  
  // Test 4: Mise à jour du profil
  try {
    console.log('\n🧪 Test 4: Mise à jour du profil utilisateur');
    
    const updateResponse = await callApi('/users/profile', 'PUT', {
      username: `updated_${Math.floor(Math.random() * 1000)}`,
      avatar_url: 'https://example.com/avatar.jpg'
    }, authToken);
    
    console.log(`  ✓ Statut de la réponse: ${updateResponse.status}`);
    console.log(`  ✓ Succès: ${updateResponse.data.success}`);
    
    if (updateResponse.data.success) {
      console.log(`  ✓ Profil mis à jour pour: ${updateResponse.data.data.username}`);
      console.log(`  ✓ Nouvelle URL avatar: ${updateResponse.data.data.avatar_url}`);
    }
    
    console.log('  ✅ Test 4 réussi');
  } catch (error) {
    console.error(`  ❌ Test 4 échoué: ${error.message}`);
  }
  
  // Test 5: Liste des utilisateurs
  try {
    console.log('\n🧪 Test 5: Récupération de la liste des utilisateurs');
    
    const usersResponse = await callApi('/users', 'GET', null, authToken);
    
    console.log(`  ✓ Statut de la réponse: ${usersResponse.status}`);
    console.log(`  ✓ Succès: ${usersResponse.data.success}`);
    
    if (usersResponse.data.success) {
      console.log(`  ✓ Nombre d'utilisateurs: ${usersResponse.data.data.length}`);
      const usernames = usersResponse.data.data.map(user => user.username).join(', ');
      console.log(`  ✓ Utilisateurs: ${usernames}`);
    }
    
    console.log('  ✅ Test 5 réussi');
  } catch (error) {
    console.error(`  ❌ Test 5 échoué: ${error.message}`);
  }
  
  // Test 6: Liste des amis et demandes d'amitié
  try {
    console.log('\n🧪 Test 6: Récupération des amis et demandes d\'amitié');
    
    const friendsResponse = await callApi('/friendships', 'GET', null, authToken);
    
    console.log(`  ✓ Statut de la réponse: ${friendsResponse.status}`);
    console.log(`  ✓ Succès: ${friendsResponse.data.success}`);
    
    if (friendsResponse.data.success) {
      console.log(`  ✓ Nombre d'amis: ${friendsResponse.data.data.length}`);
      
      if (friendsResponse.data.data.length > 0) {
        const friendUsernames = friendsResponse.data.data.map(friend => friend.username).join(', ');
        console.log(`  ✓ Amis: ${friendUsernames}`);
      }
    }
    
    // Vérifier les demandes d'amitié
    const requestsResponse = await callApi('/friendships/requests', 'GET', null, authToken);
    
    console.log(`  ✓ Statut de la réponse des demandes: ${requestsResponse.status}`);
    console.log(`  ✓ Succès des demandes: ${requestsResponse.data.success}`);
    
    if (requestsResponse.data.success) {
      console.log(`  ✓ Nombre de demandes: ${requestsResponse.data.data.length}`);
    }
    
    console.log('  ✅ Test 6 réussi');
  } catch (error) {
    console.error(`  ❌ Test 6 échoué: ${error.message}`);
  }
  
  // Test 7: Déconnexion
  try {
    console.log('\n🧪 Test 7: Déconnexion');
    
    const logoutResponse = await callApi('/auth/logout', 'POST', null, authToken);
    
    console.log(`  ✓ Statut de la réponse: ${logoutResponse.status}`);
    console.log(`  ✓ Succès: ${logoutResponse.data.success}`);
    
    if (logoutResponse.data.success) {
      console.log(`  ✓ Message: ${logoutResponse.data.message}`);
      // Réinitialiser le token
      authToken = null;
    }
    
    console.log('  ✅ Test 7 réussi');
  } catch (error) {
    console.error(`  ❌ Test 7 échoué: ${error.message}`);
  }
  
  console.log('\n✨ Tests API terminés!');
}

// Exécuter les tests
runApiTests().catch(console.error); 