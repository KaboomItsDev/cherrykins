/**
 * Real-time Admin ↔ Player sync via Trystero (MQTT).
 * Works on GitHub Pages across PC + phone — no self-hosted server.
 */
(function (global) {
  const DEFAULT_STATE = {
    characterId: null,
    characterVisible: false,
    expressionId: "neutral",
    characterName: "",
    hearts: 3,
    tix: 0,
    clock: "0X:XX",
    dialogue: "",
    mix: [],
  };

  const APP_ID = "cherry-kins-bar-v1";

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

  function isGameState(msg) {
    return msg && typeof msg === "object" && msg._type === "state" && msg.state;
  }

  function createSync(role, opts) {
    const listeners = new Set();
    let state = { ...DEFAULT_STATE };
    let code = normalizeCode(opts && opts.code);
    let status = "idle";
    let room = null;
    let sendMsg = null;
    let leaveRoom = null;
    let peerCount = 0;

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
      emit("state", state);
    }

    function broadcastState() {
      if (sendMsg) sendMsg({ _type: "state", state: state });
    }

    function setState(partial) {
      applyLocal(partial);
      if (role === "admin") {
        broadcastState();
      } else if (sendMsg) {
        sendMsg({ _type: "patch", patch: partial });
      }
    }

    function refreshPeerStatus() {
      if (peerCount > 0) setStatus("connected");
      else setStatus(role === "admin" ? "waiting" : "disconnected");
    }

    async function start() {
      if (role === "player") {
        code = normalizeCode(code);
        if (code.length !== 4) {
          setStatus("error");
          emit("error", "Type the 4-letter sync code from the Admin screen (not falacias).");
          return;
        }
      } else {
        code = roomCode();
      }

      setStatus("connecting");
      emit("code", code);

      try {
        const trystero = await import("https://esm.sh/trystero@0.20.1/mqtt");
        room = trystero.joinRoom({ appId: APP_ID }, "room-" + code);
        leaveRoom = () => room.leave();

        const actions = room.makeAction("ck");
        sendMsg = actions[0];
        const onMsg = actions[1];

        onMsg((msg) => {
          if (!msg || typeof msg !== "object") return;

          if (msg._type === "hello" && role === "admin") {
            broadcastState();
            return;
          }

          if (msg._type === "patch" && msg.patch) {
            applyLocal(msg.patch);
            if (role === "admin") broadcastState();
            return;
          }

          if (isGameState(msg)) {
            // Player accepts full state from Admin; Admin ignores Player full-state
            if (role === "player") {
              applyLocal(msg.state);
              setStatus("connected");
            }
          }
        });

        room.onPeerJoin(() => {
          peerCount += 1;
          setStatus("connected");
          if (role === "admin") broadcastState();
          if (role === "player" && sendMsg) {
            sendMsg({ _type: "hello" });
          }
        });

        room.onPeerLeave(() => {
          peerCount = Math.max(0, peerCount - 1);
          refreshPeerStatus();
        });

        // Flush any state set while connecting
        broadcastState();
        if (role === "player") sendMsg({ _type: "hello" });

        setTimeout(() => {
          if (status === "connecting") {
            setStatus(role === "admin" ? "waiting" : "connecting");
          }
          broadcastState();
          if (role === "player") sendMsg({ _type: "hello" });
        }, 700);

        if (role === "player") {
          setTimeout(() => {
            if (status !== "connected") {
              emit(
                "error",
                "No Admin found yet. On the PC: stay on Admin, status should say waiting/live, and the code must match letter-for-letter."
              );
            }
          }, 10000);
        }

        emit("ready");
      } catch (err) {
        setStatus("error");
        emit(
          "error",
          (err && err.message) ||
            "Could not connect. Check internet and try again."
        );
      }
    }

    function destroy() {
      try {
        if (leaveRoom) leaveRoom();
      } catch (_) {}
      room = null;
      sendMsg = null;
      leaveRoom = null;
      peerCount = 0;
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
