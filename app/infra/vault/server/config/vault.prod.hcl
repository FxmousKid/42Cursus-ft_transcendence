# Production configuration - SECURE SETTINGS
storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_cert_file = "/vault/ssl/vault.crt"
  tls_key_file  = "/vault/ssl/vault.key"
}

ui = true

# Production hardening
disable_mlock         = false  # Requires CAP_IPC_LOCK
default_lease_ttl     = "168h"  # 7 days
max_lease_ttl         = "720h"  # 30 days
log_level             = "info"
cluster_addr          = "https://vault:8201"
api_addr              = "https://vault:8200"
