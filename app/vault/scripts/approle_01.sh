#!/bin/sh

vault auth enable approle
cat > "agent-policy.hcl" << EOF
path "secret/data/dbinfo" {
  capabilities = ["read"]
}
EOF

vault policy write agent-policy agent-policy.hcl
vault write auth/approle/role/vault-agent-role policies="agent-policy"
vault read auth/approle/role/vault-agent-role/role-id
vault write -f auth/approle/role/vault-agent-role/secret-id
