#!/bin/sh

set -e

# Wait for Vault to be up
echo "Waiting for Vault to start..."
until curl --silent --fail http://vault-server:8200/v1/sys/health || [ $? -eq 22 ]; do
  sleep 1
done

# Wait for role_id and secret_id to exist
while [ ! -s /vault/role_id ] || [ ! -s /vault/secret_id ]; do
  echo "Waiting for role_id and secret_id files..."
  sleep 1
done


cp /vault/role_id /vault/role_id_removable
cp /vault/secret_id /vault/secret_id_removable
rmdir /vault/.env

vault agent -config=/vault/config/agent.hcl -log-level=debug &
VAULT_PID=$!

wait $VAULT_PID
