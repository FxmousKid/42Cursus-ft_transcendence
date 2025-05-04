#!/bin/sh

vault auth enable approle

vault write auth/approle/role/vault-agent-role policies="agent-policy"

vault read auth/approle/role/vault-agent-role/role-id
vault write -f auth/approle/role/vault-agent-role/secret-id
