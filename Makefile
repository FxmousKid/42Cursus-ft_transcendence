NAME = ft_transcendence
DOCC = docker compose
DEV_DOCC_FILE = ./app/docker-compose.dev.yml
PROD_DOCC_FILE = ./app/docker-compose.prod.yml


all-dev: build-dev up-dev
all-prod: build-prod up-prod

# Development

build-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) build 

up-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) up

down-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) down

logs-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) logs

ps-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) ps

clean-dev:
	$(DOCC) -f $(DEV_DOCC_FILE) down --rmi all
	$(DOCC) -f $(DEV_DOCC_FILE) rm -f
	$(DOCC) -f $(DEV_DOCC_FILE) volume rm -f
	$(DOCC) -f $(DEV_DOCC_FILE) network rm -f


# Production

build-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) build

up-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) up

down-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) down

logs-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) logs

ps-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) ps

clean-prod:
	$(DOCC) -f $(PROD_DOCC_FILE) down --rmi all
	$(DOCC) -f $(PROD_DOCC_FILE) rm -f
	$(DOCC) -f $(PROD_DOCC_FILE) volume rm -f
	$(DOCC) -f $(PROD_DOCC_FILE) network rm -f
	

.PHONY: all-dev all-prod build-dev up-dev down-dev logs-dev build-prod up-prod down-prod logs-prod
.PHONY: clean-dev clean-prod ps-dev ps-prod
.DEFAULT_GOAL := all-dev
