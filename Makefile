NAME = ft_transcendence
DOCC = docker compose
DOCC_FILE = ./app/docker-compose.yml

all: build up

build:
	$(DOCC) -f $(DOCC_FILE) build

up:
	$(DOCC) -f $(DOCC_FILE) up

down:
	$(DOCC) -f $(DOCC_FILE) down

stop:
	$(DOCC) -f $(DOCC_FILE) stop

restart:
	$(DOCC) -f $(DOCC_FILE) restart

logs:
	$(DOCC) -f $(DOCC_FILE) logs

logs-f:
	$(DOCC) -f $(DOCC_FILE) logs -f

re:
	$(DOCC) -f $(DOCC_FILE) build --no-cache

.PHONY: all build up down stop restart logs logs-f re
