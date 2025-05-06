vault {
  address = "http://vault:8200"
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/vault/tokens/role_id"
      secret_id_file_path = "/vault/tokens/secret_id"
    }
  }
  sink "file" {
	config = {
	  path = "/vault/tokens/agent-token"
	}
  }
}

template {
  source      = "/vault/env/env-template.tmpl"
  destination = "/vault/env/.env"
}

# Do not uncomment, this doesn't do what you think it does
# cache {
#   use_auto_auth_token = true
# }

