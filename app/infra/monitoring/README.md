# Monitoring

## Prometheus

</br>
We're using (Prometheus)[https://prometheus.io/] in order to scrape differents endpoints that are exposing **metrics** 
and then sending all of that towards grafana, where prometheus is a **datasource**
</br>

## Grafana

</br>
Grafana is then sourcing the data from prometheus and able to do all sorts of manipulations with it, most notable using it for dashboards
and viewing alerts, etc..
</br>
