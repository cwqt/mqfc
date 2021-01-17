import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import log, { stream } from "./common/logger";
import http from "http";
import helmet from "helmet";
import jsonwebtoken from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import localtunnel from "localtunnel";

import jwt from "express-jwt";
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
// app.use(cors());
app.use(helmet());
app.use(morgan("tiny", { stream }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

logger.info("Started node process");

interface IStateCache {
  _id: number;
  last_recieved: number;
  data: any;
}

(async () => {
  let espConnected: boolean = true;
  let lastStateCache: IStateCache;

  try {
    // MQTT ---------------------------------------------------------------------------------------
    let client: mqtt.AsyncMqttClient;
    try {
      logger.info(`Connecting to RabbitMQ...`);
      client = mqtt.connect({
        username: "guest",
        password: "guest",
      });
    } catch (error) {
      gracefulExit(error);
    }

    client.on("error", (err) => {
      logger.error(err);
    });

    client.on("connect", async (packet) => {
      logger.info("Connected to RabbitMQ");
      await client.subscribe("esp32/connected");
      await client.subscribe("esp32/state");
    });

    client.on("message", (topic, payload) => {
      logger.info(`Recieved topic message: ${topic}`, payload);
      switch (topic) {
        case "esp32/connected": {
          (espConnected = payload.toString() == "true");
          if(lastStateCache) client.publish("esp32/state", JSON.stringify(lastStateCache.data));
          return;
        }
        case "esp32/state":
          return (lastStateCache = {
            last_recieved: new Date().getTime(),
            _id: lastStateCache ? lastStateCache._id + 1 : 0,
            data: JSON.parse(payload.toString()),
          });
      }

      logger.error(`No handler for topic ${topic}`);
    });

    // ESP Should publish connected state every 10 minutes
    setInterval(() => {
      if (lastStateCache.last_recieved) {
        const now = new Date();
        const difference = (now.getTime() - new Date(lastStateCache.last_recieved).getTime()) / 1000;
        if (difference > 600) {
          espConnected = false;
        }
      } else {
        espConnected = false;
      }
    }, 600000);

    // HTTP Tunneling -----------------------------------------------------------------------------
    const lt = await localtunnel({
      port: config.EXPRESS_PORT,
      subdomain: config.TUNNEL_HOST,
      allow_invalid_cert: true,
    });

    logger.info(`HTTP Tunnelling active at: ${lt.url}`);

    // Routes -------------------------------------------------------------------------------------
    const router = AsyncRouter();
    router.get(`/`, (req, res) => res.send(`mqfc - Message Queuing Farm Controller`));

    router.post(
      "/token",
      rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 5, // 5 attempts / hour
        message: JSON.stringify({ error: "Please fuck off" }),
      }),
      async (req, res) => {
        const password = req.body.password;
        if (!password) return res.status(401).json({ error: "No password provided" });
        if (password !== config.PASSWORD) return res.status(401).json({ error: "Incorrect password " });

        return res.status(200).json({
          data: jsonwebtoken.sign({ created: new Date().getTime() }, config.PRIVATE_KEY, { algorithm: "HS256" }),
        });
      }
    );

    // Getting the state from storage
    router.get("/state", async (req, res) =>
      res.json({
        esp_is_connected: espConnected,
        most_recent_state: lastStateCache,
      })
    );

    // Setting the state
    router.post("/state", jwt({ secret: config.PRIVATE_KEY, algorithms: ["HS256"] }), async (req, res) => {
      await client.publish(
        "esp32/state",
        JSON.stringify([req.body[0] || false, req.body[1] || false, req.body[2] || false, req.body[3] || false])
      );
    });

    app.use(router);

    // Aggressively rate limit
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // limit each IP to 100 requests per windowMs
        message: JSON.stringify({ error: "Too many requests" }),
      })
    );

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

function gracefulExit(client?: mqtt.AsyncMqttClient, error?: any) {
  return (err: any) => {
    log.info(`Termination requested, closing all connections`);
    logger.error(error || err);
    client?.end();
    server.close();
    process.exit(1);
  };
}

export default {
  app,
  gracefulExit,
};
