import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import log, { stream } from "./common/logger";
import http, { ClientRequest } from "http";
import helmet from "helmet";
import mqtt from "async-mqtt";
import "reflect-metadata";

import { HTTP } from "./common/http";
import { handleError, ErrorHandler } from "./common/errors";
import logger from "./common/logger";
import config from "./config";
import { AsyncRouter } from "express-async-router";

let server: http.Server;
const app = express();
app.set("trust proxy", 1);
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny", { stream }));

logger.info('Started node process');

interface IStateCache {
  _id: number;
  last_recieved: number;
  data: any;
}

(async () => {
  let espConnected: boolean = false;
  let lastStateCache: IStateCache;

  try {
    let client: mqtt.AsyncMqttClient;
    try {
      logger.info(`Connecting to RabbitMQ...`)
      client = mqtt.connect({
          username: "guest",
          password: "guest"
        }
      );
    } catch (error) {
      gracefulExit(error);
    }

    client.on('error', err => {
      logger.error(err);
    })

    client.on("connect", async packet => {
      logger.info("Connected!")
      await client.subscribe("esp32/connected");
      await client.subscribe("esp32/state");
    });

    client.on("message", (topic, payload) => {
      console.log(topic)

      console.log(espConnected, lastStateCache)

      switch (topic) {
        case "esp32/connected":
          return (espConnected = payload.toString() == "true");
        case "esp32/state":
          return (lastStateCache = {
            last_recieved: new Date().getTime(),
            _id: lastStateCache ? lastStateCache._id + 1 : 0,
            data: JSON.parse(payload.toString()),
          });
      }

      logger.error(`No handler for topic ${topic}`);
    });

    // Routes ---------------------------------------------------------------------------
    const router = AsyncRouter();
    // Getting the state from storage
    router.get("/state", async (req, res) =>
      res.json({
        esp_is_connected: espConnected,
        most_recent_state: lastStateCache,
      })
    );

    // Setting the state
    router.post("/state", async (req, res) => {
      await client.publish(
        "esp32/state",
        JSON.stringify({
          0: req.body[0] || false,
          1: req.body[1] || false,
          2: req.body[2] || false,
          3: req.body[3] || false,
        })
      );
    });

    app.use(router);

    // Catch 404 errors
    app.all("*", (req: any, res: any, next: any) => {
      handleError(req, res, next, new ErrorHandler(HTTP.NotFound, "No such route exists"));
    });

    // Global error handler
    app.use((err: any, req: any, res: any, next: any) => handleError(req, res, next, err));

    // Handle closing connections on failure
    process.on("SIGTERM", gracefulExit(client));
    process.on("SIGINT", gracefulExit(client));
    process.on("uncaughtException", gracefulExit(client));

    // Start listening for requests
    server = app.listen(config.EXPRESS_PORT, () => {
      log.info(`\x1b[1mExpress listening on ${config.EXPRESS_PORT}\x1b[0m`);
    });
  } catch (err) {
    log.error(err);
  }
})();

function gracefulExit(client?:mqtt.AsyncMqttClient, error?:any) {
  return (err:any) => {
    log.info(`Termination requested, closing all connections`);
    logger.error(error || err);
    client?.end();
    server.close();
    process.exit(1);
  }
}

export default {
  app,
  gracefulExit,
};
