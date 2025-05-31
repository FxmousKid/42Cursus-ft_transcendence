NAME = ft_transcendence
DOCC = docker compose

# Main compose file with includes
MAIN_COMPOSE = ./app/docker-compose.main.yml

all: build up

# Build all services
build:
	@mkdir -p ./app/core/modsec-nginx/logs/nginx
	@touch ./app/core/modsec-nginx/logs/modsec_audit.log
	@touch ./app/core/modsec-nginx/logs/modsec_erorr.log
	$(DOCC) -f $(MAIN_COMPOSE) build


# Start services
up:
	$(DOCC) -f $(MAIN_COMPOSE) up


# Start services in detached mode
up-detached:
	$(DOCC) -f $(MAIN_COMPOSE) up -d

# Stop all services
down:
	$(DOCC) -f $(MAIN_COMPOSE) down

# View logs from all services
logs:
	$(DOCC) -f $(MAIN_COMPOSE) logs -f

# Show running containers
ps:
	$(DOCC) -f $(MAIN_COMPOSE) ps

# Clean up containers, images, and networks
clean:
	$(DOCC) -f $(MAIN_COMPOSE) down --rmi all
	docker volume prune -f

# Complete system cleanup
destroy:
	docker system prune -a
	docker container prune -f
	docker volume prune -f
	docker network prune -f

.PHONY: all setup-compose build up up-detached down logs ps clean destroy
.DEFAULT_GOAL := all
