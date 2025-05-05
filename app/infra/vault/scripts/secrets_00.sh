#!/bin/sh

vault secrets enable -path=kv kv-v2

vault kv put kv/elk/elasticsearch username=elasticsearchuser password=elasticsearchpass
vault kv put kv/elk/kibana username=kibanapass password=kibanapass
vault kv put kv/elk/logstash username=logstashuser password=logstashpass

cat > vault policy write agent-policy << EOF
path "kv/elk/*" {
  capabilities = ["read", "list"]
}

path "kv/elk" {
  capabilities = ["create", "update"]
}

path "kv/data/elk/*" {
	capabilities = ["read", "list"]
}

path "kv/data/elk" {
	capabilities = ["create", "update"]
}
EOF
