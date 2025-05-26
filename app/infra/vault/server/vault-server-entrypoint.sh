#!/bin/sh

set -e

# export VAULT_TOKEN="root"

# Start Vault server in the background
vault server -config=/vault/config/vault.dev.hcl &
VAULT_PID=$!

# Initialize Vault if not already initialized
if vault status | grep -q 'Initialized.*false'; then
    echo "Initializing Vault..."
    vault operator init -key-shares=1 -key-threshold=1 > /vault/init.txt
    UNSEAL_KEY=$(grep 'Unseal Key 1:' /vault/init.txt | awk '{print $NF}')
    ROOT_TOKEN=$(grep 'Initial Root Token:' /vault/init.txt | awk '{print $NF}')
    export VAULT_TOKEN="$ROOT_TOKEN"
    echo "$UNSEAL_KEY" > /vault/tokens/unseal.key
    echo "$ROOT_TOKEN" > /vault/tokens/root.token
else
    echo "Vault already initialized."
    ROOT_TOKEN=$(cat /vault/tokens/root.token)
    export VAULT_TOKEN="$ROOT_TOKEN"
fi

# Unseal Vault if sealed
if vault status | grep -q 'Sealed.*true'; then
    echo "Unsealing Vault..."
    vault operator unseal $(cat /vault/tokens/unseal.key)
fi

# Enable AppRole auth method if not already enabled
if ! vault auth list | grep -q approle; then
    echo "Enabling AppRole auth method..."
    vault auth enable approle
fi

# Check if agent policy exists
if ! vault policy list | grep -q agent-policy; then
	echo "Creating agent policy..."
	vault policy write agent-policy - << EOF

path "kv/+/elk/*" {
	capabilities = ["read", "list"]
}

path "kv/+/frontend/*" {
	capabilities = ["read", "list"]
}
path "kv/+/backend/*" {
	capabilities = ["read", "list"]
}
path "kv/+/server/*" {
	capabilities = ["read", "list"]
}
path "kv/+/database/*" {
	capabilities = ["read", "list"]
}
path "kv/+/google_oauth/*" {
	capabilities = ["read", "list"]
}
path "kv/+/session/*" {
	capabilities = ["read", "list"]
}

EOF
fi

# Enable KV secrets engine if not already enabled
if ! vault secrets list | grep -q 'kv/'; then
	echo "Enabling KV secrets engine..."
	vault secrets enable -path=kv kv-v2
fi

# Check if secrets exist
if ! vault kv get -field=username kv/elk/elasticsearch >/dev/null 2>&1; then
	echo "Creating secrets..."

	# ELK secrets
	vault kv put kv/elk/elasticsearch username=elastic password=changeme
	vault kv put kv/elk/kibana username=kibana_system password=changeme
	vault kv put kv/elk/stack_version version='8.18.0'
	vault kv put kv/elk/elastic_cluster_name name='docker-cluster'
	vault kv put kv/elk/es_port port=9200
	vault kv put kv/elk/kibana_port port=5601
	vault kv put kv/elk/encryption_key key='c34d38b3a14956121ff2170e5030b471551370178f43e5626eec58b04a30fae2'

	# Frontend secrets
	vault kv put kv/frontend/app_name name=Transcendence
	vault kv put kv/frontend/port port=5173
	vault kv put kv/frontend/url url='http://localhost:5173'

	# Backend secrets
	vault kv put kv/backend/port port=3000
	vault kv put kv/backend/url url='http://localhost:3000'
	vault kv put kv/backend/api_url url='http://localhost:3000'
	vault kv put kv/backend/vite_api_url url='http://backend:3000'
	vault kv put kv/backend/jwt_secret secret='supersecretkey'
	vault kv put kv/backend/jwt_expiration expiration='1d'
	vault kv put kv/backend/node_env env='development'
	vault kv put kv/backend/cors_origin origin='http://localhost:5173'
	
	# Server configuration
	vault kv put kv/server/host host='0.0.0.0'

	# Database
	vault kv put kv/database/url url='sqlite:./database.sqlite'
	vault kv put kv/database/path path='./database.sqlite'

	# Google OAuth
	vault kv put kv/google_oauth/client_id id='1083014390405-g5dbj1ac072b42ed7jejr47v6r1ruei2.apps.googleusercontent.com'
	vault kv put kv/google_oauth/client_secret secret='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'
	vault kv put kv/google_oauth/callback_url url='http://localhost:3000/auth/google/callback'

	# Session
	vault kv put kv/session/secret secret='42-transcendence-session-secret-must-be-at-least-32-characters-long'




fi

# deleting approle
vault delete auth/approle/role/agent

# Create AppRole if not exists
if ! vault read auth/approle/role/agent/role-id >/dev/null 2>&1; then
    echo "Creating AppRole 'agent'..."
    vault write auth/approle/role/agent token_policies="default, agent-policy"
fi

# Get RoleID and SecretID
# check if role_id and secret_id exist as directory to then delete it

if [ -d /vault/tokens/role_id ]; then
	echo "Deleting existing role_id..."
	rm -rf /vault/tokens/role_id
fi

if [ -d /vault/tokens/secret_id ]; then
	echo "Deleting existing secret_id..."
	rm -rf /vault/tokens/secret_id
fi

vault read -field=role_id auth/approle/role/agent/role-id > /vault/tokens/role_id
vault write -f -field=secret_id auth/approle/role/agent/secret-id > /vault/tokens/secret_id

echo "Vault setup complete."

# Bring Vault server to foreground
wait $VAULT_PID
