# mqfc &nbsp; [![Netlify Status](https://api.netlify.com/api/v1/badges/e58e065e-471e-4935-b1db-dcab165bb39d/deploy-status)](https://app.netlify.com/sites/mqfc-fe/deploys)


Message Queuing Farm Controller  
Quick & dirty way of controlling my farms' four lights using MQTT

Angular frontend deployed to Netlify which redirects requests to a localtunnel address & then to my Raspberry Pi 3b+  
RPi hosting an Express server & a Dockerized RabbitMQ broker

## API

* `GET /state`: Get most recent recorded state
```json
{
    "esp_is_connected": true,
    "most_recent_state": {
        "last_recieved": 1610890311998,
        "data": {
            "0": false,
            "1": true,
            "2": false,
            "3": true
        }
    }
}
```


* `POST /state`: Set the lights state
```json
[true, true, false, true]
```

---

![](https://ftp.cass.si/c2k2pk50O.png)
