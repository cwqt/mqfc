#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

const char* ssid = "pogfish";
const char* password = "seacows123";
const char* mqtt_server = "192.168.1.100";

WiFiClient espClient;
PubSubClient client(espClient);

int LIGHT_PINS[4] = {27,26,25,33};

void setup() {
  Serial.begin(9600);
  while (!Serial) { delay(50); }

  pinMode(LIGHT_PINS[0], OUTPUT);
  pinMode(LIGHT_PINS[1], OUTPUT);
  pinMode(LIGHT_PINS[2], OUTPUT);
  pinMode(LIGHT_PINS[3], OUTPUT);

  // Flash to show alive
  for(int i=0; i<3; i++) {
    for(int j=0; j<4;  j++) {
        digitalWrite(LIGHT_PINS[j], LOW);
    }
    delay(250);
    for(int j=0; j<4;  j++) {
        digitalWrite(LIGHT_PINS[j], HIGH);
    }
    delay(250);
  }

  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print("WiFi connected, ");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* message, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Parse the JSON body
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, message, length);
  if (err) {
    Serial.print(F("deserializeJson() failed: "));
    Serial.println(err.c_str());
  }
  
  serializeJsonPretty(doc, Serial);

  if (String(topic) == "esp32/state") {
    Serial.println("Setting light states");
    digitalWrite(LIGHT_PINS[0], doc[0].as<String>() == "true" ? LOW : HIGH);
    digitalWrite(LIGHT_PINS[1], doc[1].as<String>() == "true" ? LOW : HIGH);
    digitalWrite(LIGHT_PINS[2], doc[2].as<String>() == "true" ? LOW : HIGH);
    digitalWrite(LIGHT_PINS[3], doc[3].as<String>() == "true" ? LOW : HIGH);
  } else {
    Serial.println("Unknown topic");
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), "guest", "guest")) {
      Serial.println("Connected!");
      // Subscribe
      client.subscribe("esp32/state");
      client.publish("esp32/connected", "true");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) { reconnect(); }
  client.loop();

  long now = millis();
}
