vault {
  address = "http://vault:8200"
}

auto_auth {
  method "approle" {
    mount_path = "auth/approle"
    config = {
      role_id_file_path = "/vault/role_id_removable"
      secret_id_file_path = "/vault/secret_id_removable"
    }
  }
  sink "file" {
	config = {
	  path = "/vault/tokens/agent-token"
	}
  }
}

template {
  source      = "/vault/env-template.tmpl"
  destination = "/vault/.env"
}

# cache {
#   use_auto_auth_token = true
# }

