require("dotenv").config();

interface IEnv {
  PASSWORD: string;
  PRIVATE_KEY: string;
  EXPRESS_PORT: number;
  MQTT_PORT: number;
  TUNNEL_HOST:string;
}

const Env:IEnv = {
  PASSWORD: process.env.PASSWORD,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  TUNNEL_HOST: process.env.TUNNEL_HOST,
  EXPRESS_PORT: 3000,
  MQTT_PORT: 15672
};

export default Env;