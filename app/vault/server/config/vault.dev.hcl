# Development configuration - UNSAFE FOR PRODUCTION
storage "file" {
	path = "/vault/file"
}

listener "tcp" {
	address     = "0.0.0.0:8200"
	tls_disable = "true"  # No TLS in dev
}

ui = true

# Dev-specific settings
disable_mlock         = true  # Only for dev/testing
default_lease_ttl     = "24h"
max_lease_ttl         = "72h"
log_level             = "debug"
