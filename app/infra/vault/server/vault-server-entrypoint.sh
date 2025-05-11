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
	vault kv put kv/elk/elasticsearch username=elastic password=changeme
	vault kv put kv/elk/kibana username=kibana_system password=changeme
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
