require("dotenv").config();

interface IEnv {
  PRIVATE_KEY: string;
  EXPRESS_PORT: number;
  MQTT_PORT: number;
}

const Env:IEnv = {
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  EXPRESS_PORT: 3000,
  MQTT_PORT: 15672
};

export default Env;