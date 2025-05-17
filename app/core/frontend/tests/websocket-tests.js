const WebSocket = require('ws');
const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws';
let authToken = null;
let userId = null;

// Test de la connexion WebSocket
async function testWebSocketConnection() {
  console.log('🔌 Démarrage des tests WebSocket...\n');
  
  // D'abord obtenir un token d'authentification
  try {
    console.log('🧪 Authentification préalable');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.data.token;
      userId = data.data.id;
      console.log(`  ✓ Token obtenu: ${authToken.substring(0, 15)}...`);
      console.log(`  ✓ ID utilisateur: ${userId}`);
    } else {
      throw new Error('Échec de l\'authentification');
    }
  } catch (error) {
    console.error(`  ❌ Échec de l'authentification: ${error.message}`);
    return;
  }
  
  // Test 1: Établir une connexion WebSocket
  try {
    console.log('\n🧪 Test 1: Établissement d\'une connexion WebSocket');
    
    const ws = new WebSocket(WS_URL, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    let connectionOpened = false;
    
    // Événement d'ouverture de connexion
    ws.on('open', () => {
      connectionOpened = true;
      console.log('  ✓ Connexion WebSocket établie');
      
      // Envoi d'un message de ping
      ws.send(JSON.stringify({
        type: 'ping',
        data: {
          message: 'Ping test'
        }
      }));
      
      console.log('  ✓ Message ping envoyé');
    });
    
    // Événement de réception de message
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`  ✓ Message reçu: ${message}`);
        console.log(`  ✓ Type: ${data.type}`);
        
        // Déconnexion après avoir reçu un message
        setTimeout(() => {
          ws.close();
          console.log('  ✓ Connexion WebSocket fermée');
        }, 1000);
      } catch (error) {
        console.error(`  ❌ Erreur de parsing du message: ${error.message}`);
      }
    });
    
    // Événement d'erreur
    ws.on('error', (error) => {
      console.error(`  ❌ Erreur WebSocket: ${error.message}`);
    });
    
    // Événement de fermeture
    ws.on('close', (code, reason) => {
      console.log(`  ✓ Connexion fermée avec le code: ${code}, raison: ${reason || 'Aucune'}`);
      
      if (connectionOpened) {
        console.log('  ✅ Test 1 réussi');
      } else {
        console.error('  ❌ Test 1 échoué: La connexion n\'a pas pu être établie');
      }
      
      // Fin du test global
      console.log('\n✨ Tests WebSocket terminés!');
    });
    
    // Timeout pour s'assurer que le test ne reste pas bloqué
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('  ⚠️ Fermeture de la connexion après timeout');
        ws.close();
      }
    }, 10000);
    
  } catch (error) {
    console.error(`  ❌ Test 1 échoué: ${error.message}`);
  }
}

// Exécuter le test
testWebSocketConnection().catch(console.error); 