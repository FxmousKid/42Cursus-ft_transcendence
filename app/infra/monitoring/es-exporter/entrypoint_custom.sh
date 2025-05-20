#!/bin/sh

while [ ! -f /tmp/env/.env ]; do
  echo "Waiting for /tmp/env/.env to be created..."
  sleep 1
done

echo "Found /tmp/env/.env, proceeding with the script..."
# Load environment variables from the .env file
if [ -f /tmp/env/.env ]; then
  set -o allexport;
  set -a
  source /tmp/env/.env;
  set +o allexport;
  set +a
fi;

/bin/elasticsearch_exporter \
	--es.uri=https://$ELASTIC_USER:$ELASTIC_PASSWORD@es01:9200 \
	--es.ca=/tmp/certs/ca/ca.crt \
	--es.all

# sleep 10000

exec "$@"
