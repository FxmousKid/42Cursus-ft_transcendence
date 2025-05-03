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
    echo "$UNSEAL_KEY" > /vault/unseal.key
    echo "$ROOT_TOKEN" > /vault/root.token
else
    echo "Vault already initialized."
    ROOT_TOKEN=$(cat /vault/root.token)
    export VAULT_TOKEN="$ROOT_TOKEN"
fi

# Unseal Vault if sealed
if vault status | grep -q 'Sealed.*true'; then
    echo "Unsealing Vault..."
    vault operator unseal $(cat /vault/unseal.key)
fi

# Enable AppRole auth method if not already enabled
if ! vault auth list | grep -q approle; then
    echo "Enabling AppRole auth method..."
    vault auth enable approle
fi

# Create AppRole if not exists
if ! vault read auth/approle/role/agent/role-id >/dev/null 2>&1; then
    echo "Creating AppRole 'agent'..."
    vault write auth/approle/role/agent token_policies="default"
fi

# Get RoleID and SecretID
# check if role_id and secret_id exist as directory to then delete it

if [ -d /vault/role_id ]; then
	echo "Deleting existing role_id..."
	rm -rf /vault/role_id
fi

if [ -d /vault/secret_id ]; then
	echo "Deleting existing secret_id..."
	rm -rf /vault/secret_id
fi

vault read -field=role_id auth/approle/role/agent/role-id > /vault/role_id
vault write -f -field=secret_id auth/approle/role/agent/secret-id > /vault/secret_id

echo "Vault setup complete."

# Bring Vault server to foreground
wait $VAULT_PID
