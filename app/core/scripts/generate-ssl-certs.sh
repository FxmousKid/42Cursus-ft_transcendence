#!/bin/bash

# Script pour générer des certificats SSL pour le projet Transcendence
# Usage: ./generate-ssl-certs.sh [domain]

DOMAIN=${1:-localhost}
CERT_DIR="./certs"
KEY_FILE="$CERT_DIR/server.key"
CERT_FILE="$CERT_DIR/server.crt"
CSR_FILE="$CERT_DIR/server.csr"

echo "🔐 Génération des certificats SSL pour $DOMAIN"

# Créer le répertoire des certificats
mkdir -p $CERT_DIR

# Générer la clé privée
echo "📋 Génération de la clé privée..."
openssl genrsa -out $KEY_FILE 2048

# Créer un fichier de configuration pour le certificat
cat > $CERT_DIR/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=FR
ST=Paris
L=Paris
O=42School
OU=Transcendence
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Générer la demande de certificat
echo "📋 Génération de la demande de certificat..."
openssl req -new -key $KEY_FILE -out $CSR_FILE -config $CERT_DIR/openssl.cnf

# Générer le certificat auto-signé valide pour 1 an
echo "📋 Génération du certificat auto-signé..."
openssl x509 -req -in $CSR_FILE -signkey $KEY_FILE -out $CERT_FILE -days 365 -extensions v3_req -extfile $CERT_DIR/openssl.cnf

# Afficher les informations du certificat
echo "✅ Certificats générés avec succès!"
echo "📁 Clé privée: $KEY_FILE"
echo "📁 Certificat: $CERT_FILE"
echo ""
echo "🔍 Informations du certificat:"
openssl x509 -in $CERT_FILE -text -noout | grep -A 1 "Subject:"
openssl x509 -in $CERT_FILE -text -noout | grep -A 3 "Subject Alternative Name"

# Permissions sécurisées
chmod 600 $KEY_FILE
chmod 644 $CERT_FILE

echo ""
echo "⚠️  Note: Ce certificat est auto-signé et déclenchera un avertissement de sécurité dans le navigateur."
echo "   Pour un environnement de production, utilisez un certificat signé par une AC reconnue."
echo ""
echo "🚀 Pour utiliser ces certificats avec Docker:"
echo "   docker run -v $(pwd)/$CERT_DIR:/etc/nginx/ssl ..."

# Nettoyer les fichiers temporaires
rm -f $CSR_FILE $CERT_DIR/openssl.cnf 