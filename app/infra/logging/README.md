# Logging Stack

## Elasticsearch

[!TIP]
To check the status of the Elasticsearch node, run :
```bash
docker cp es01:/usr/share/elasticsearch/config/certs/ca/ca.crt /tmp/.
curl --cacert /tmp/ca.crt -u elastic:$ELASTICSEARCH_PASSWORD https://localhost:9200
```



## Kibana
