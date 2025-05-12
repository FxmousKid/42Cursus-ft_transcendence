# Logging Stack

## Filebeat

Filebeat is the log ingestion service of our stack, usually paired with logstash, it's replacing it here, due to this project not needing a complex log aggregation / processing via filters and processors.

Filebeat is configured via the filebeat.yml file, where you'll find that we forward different indices based on which container they're coming from for example.

</br>

## Elasticsearch

</br>

> [!TIP]
> To check the status of the Elasticsearch node, run :
>```bash
>docker cp es01:/usr/share/elasticsearch/config/certs/ca/ca.crt /tmp/.
>curl --cacert /tmp/ca.crt -u elastic:$ELASTICSEARCH_PASSWORD https://localhost:9200
>```
</br>

By default, elastic runs on port **9200** in our config, to be able to communicate, only HTTPS works, so each request has to be authed, either via using the certificate like the example above, or via using username and password :

```bash
# assuming all containers are running and healty
curl -X GET -k -u $Elastic_user:$Elastic_pass "https://localhost:9200/_cluster/health/?pretty"
```
The **-k** stands for insecure, in the case the cert is auto generated</br>
The **-u** stands for provide user and password for access elastic

</br>

Please note that no [ilm](https://www.elastic.co/docs/manage-data/lifecycle/index-lifecycle-management) has been implemeneted yet, this is probably **not** gonna happen for the scope of this project

</br>

## Kibana

Kibana is running on port **5601**

