/**
 * Admin ↔ Player sync over public MQTT (no WebRTC).
 */
(function (global) {
  const DEFAULT_STATE = {
    characterId: null,
    characterVisible: false,
    expressionId: "neutral",
    characterName: "",
    hearts: 3,
    tix: 0,
    tixPopup: null,
    clock: "0X:XX",
    mix: [],
  };

  const BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://test.mosquitto.org:8081",
  ];

  function roomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function normalizeCode(raw) {
    return String(raw || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
  }

  function loadMqtt() {
    return new Promise((resolve, reject) => {
      if (global.mqtt) {
        resolve(global.mqtt);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js";
      s.onload = () =>
        global.mqtt ? resolve(global.mqtt) : reject(new Error("MQTT failed to load"));
      s.onerror = () => reject(new Error("Could not load MQTT library"));
      document.head.appendChild(s);
    });
  }

  function connectBroker(mqttLib) {
    return new Promise((resolve, reject) => {
      let i = 0;
      let lastErr = null;

      function tryNext() {
        if (i >= BROKERS.length) {
          reject(lastErr || new Error("All MQTT brokers failed"));
          return;
        }
        const url = BROKERS[i++];
        const client = mqttLib.connect(url, {
          clientId: "ck_" + Math.random().toString(16).slice(2, 10),
          clean: true,
          connectTimeout: 10000,
          reconnectPeriod: 2500,
        });

        const onConnect = () => {
          cleanup();
          resolve(client);
        };
        const onError = (err) => {
          lastErr = err;
        };
        const timer = setTimeout(() => {
          cleanup();
          try {
            client.end(true);
          } catch (_) {}
          tryNext();
        }, 11000);

        function cleanup() {
          clearTimeout(timer);
          client.off("connect", onConnect);
          client.off("error", onError);
        }

        client.on("connect", onConnect);
        client.on("error", onError);
      }

      tryNext();
    });
  }

  function createSync(role, opts) {
    const listeners = new Set();
    let state = { ...DEFAULT_STATE };
    let code = normalizeCode(opts && opts.code);
    let status = "idle";
    let client = null;
    let heartbeat = null;
    let topicState = "";
    let topicHello = "";
    let lastPeerAt = 0;

    function emit(type, detail) {
      listeners.forEach((fn) => {
        try {
          fn(type, detail);
        } catch (_) {}
      });
    }

    function setStatus(next) {
      if (status === next) return;
      status = next;
      emit("status", status);
    }

    function applyLocal(partial) {
      state = { ...state, ...partial };
      emit("state", { ...state });
    }

    function publish(topic, payload, retain) {
      if (!client || !client.connected) return;
      client.publish(topic, JSON.stringify(payload), {
        qos: 1,
        retain: !!retain,
      });
    }

    function broadcastState() {
      publish(
        topicState,
        { _type: "state", from: role, state: { ...state }, t: Date.now() },
        true
      );
    }

    function sendHello() {
      publish(topicHello, { _type: "hello", from: "player", t: Date.now() }, false);
    }

    function setState(partial) {
      applyLocal(partial);
      if (role === "admin") {
        broadcastState();
      } else {
        publish(
          topicHello,
          { _type: "patch", from: "player", patch: partial, t: Date.now() },
          false
        );
      }
    }

    function onMessage(topic, buf) {
      let msg;
      try {
        msg = JSON.parse(String(buf));
      } catch (_) {
        return;
      }
      if (!msg || typeof msg !== "object") return;
      if (msg.from === role) return;

      lastPeerAt = Date.now();

      if (msg._type === "hello" && role === "admin") {
        setStatus("connected");
        broadcastState();
        return;
      }

      if (msg._type === "patch" && msg.patch && role === "admin") {
        applyLocal(msg.patch);
        setStatus("connected");
        broadcastState();
        return;
      }

      if (msg._type === "state" && msg.state && role === "player") {
        applyLocal(msg.state);
        setStatus("connected");
      }
    }

    function subscribeReady() {
      return new Promise((resolve, reject) => {
        client.subscribe([topicState, topicHello], { qos: 1 }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    async function start() {
      if (role === "player") {
        code = normalizeCode(code);
        if (code.length !== 4) {
          setStatus("error");
          emit("error", "Type the 4-letter sync code from the Admin screen.");
          return;
        }
      } else {
        code = roomCode();
      }

      topicState = "cherrykins/v5/" + code + "/state";
      topicHello = "cherrykins/v5/" + code + "/hello";

      setStatus("connecting");
      emit("code", code);

      try {
        const mqttLib = await loadMqtt();
        client = await connectBroker(mqttLib);
        client.on("message", onMessage);

        // Wait until subscribed BEFORE hello — otherwise phone misses Admin's reply
        await subscribeReady();

        client.on("close", () => {
          if (status !== "idle") setStatus("disconnected");
        });
        client.on("offline", () => {
          if (status !== "idle") setStatus("connecting");
        });
        client.on("reconnect", () => setStatus("connecting"));
        client.on("connect", async () => {
          try {
            await subscribeReady();
          } catch (_) {}
          if (role === "admin") {
            setStatus(lastPeerAt ? "connected" : "waiting");
            broadcastState();
          } else {
            sendHello();
          }
        });

        if (role === "admin") {
          setStatus("waiting");
          broadcastState();
        } else {
          sendHello();
          // Keep pinging until we actually get state
          let tries = 0;
          const boot = setInterval(() => {
            if (status === "connected" || tries++ > 20) {
              clearInterval(boot);
              return;
            }
            sendHello();
          }, 1000);
        }

        if (heartbeat) clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          if (!client || !client.connected) return;
          if (role === "admin") {
            broadcastState();
            if (lastPeerAt && Date.now() - lastPeerAt > 15000) setStatus("waiting");
          } else {
            sendHello();
            if (status === "connected" && lastPeerAt && Date.now() - lastPeerAt > 15000) {
              setStatus("disconnected");
            }
          }
        }, 2000);

        emit("ready");
      } catch (err) {
        setStatus("error");
        emit("error", (err && err.message) || "Could not connect. Check internet.");
      }
    }

    function destroy() {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
      try {
        if (client) client.end(true);
      } catch (_) {}
      client = null;
      setStatus("idle");
    }

    return {
      role,
      getState: () => state,
      getStatus: () => status,
      getCode: () => code,
      on: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      setState,
      start,
      destroy,
      DEFAULT_STATE,
    };
  }

  global.CherrySync = { createSync, DEFAULT_STATE, roomCode, normalizeCode };
})(window);
