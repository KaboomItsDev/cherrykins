/**
 * Real-time sync between Admin and Player via PeerJS (no Node required).
 * Admin hosts a room code; Player joins with that code.
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

  function roomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 4; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function createSync(role, opts) {
    const listeners = new Set();
    let state = { ...DEFAULT_STATE };
    let peer = null;
    let conn = null;
    let code = (opts && opts.code) || "";
    let status = "idle";

    function emit(type, detail) {
      listeners.forEach((fn) => fn(type, detail));
    }

    function setStatus(next) {
      status = next;
      emit("status", status);
    }

    function applyState(partial, broadcast) {
      state = { ...state, ...partial };
      emit("state", state);
      if (broadcast && conn && conn.open) {
        conn.send({ type: "state", state });
      }
    }

    function wireConnection(c) {
      conn = c;
      c.on("open", () => {
        setStatus("connected");
        if (role === "admin") {
          c.send({ type: "state", state });
        }
      });
      c.on("data", (data) => {
        if (!data || typeof data !== "object") return;
        if (data.type === "state" && data.state) {
          state = { ...state, ...data.state };
          emit("state", state);
        }
        if (data.type === "hello" && role === "admin") {
          c.send({ type: "state", state });
        }
      });
      c.on("close", () => {
        conn = null;
        setStatus(role === "admin" ? "waiting" : "disconnected");
      });
      c.on("error", () => {
        setStatus("error");
      });
    }

    function start() {
      if (typeof Peer === "undefined") {
        setStatus("error");
        emit("error", "PeerJS failed to load. Check your internet connection.");
        return;
      }

      if (role === "admin") {
        code = roomCode();
        peer = new Peer("cherrykins-" + code, { debug: 0 });
        setStatus("connecting");
        peer.on("open", () => {
          setStatus("waiting");
          emit("code", code);
        });
        peer.on("connection", (c) => {
          if (conn && conn.open) {
            c.close();
            return;
          }
          wireConnection(c);
        });
        peer.on("error", (err) => {
          if (err && err.type === "unavailable-id") {
            start();
            return;
          }
          setStatus("error");
          emit("error", err && err.message ? err.message : "Peer error");
        });
      } else {
        const join = (code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (join.length < 4) {
          setStatus("error");
          emit("error", "Enter the 4-character room code from Admin.");
          return;
        }
        code = join;
        peer = new Peer({ debug: 0 });
        setStatus("connecting");
        peer.on("open", () => {
          const c = peer.connect("cherrykins-" + code, { reliable: true });
          wireConnection(c);
          c.on("open", () => c.send({ type: "hello" }));
        });
        peer.on("error", (err) => {
          setStatus("error");
          emit("error", err && err.message ? err.message : "Could not join room");
        });
      }
    }

    function destroy() {
      if (conn) conn.close();
      if (peer) peer.destroy();
      conn = null;
      peer = null;
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
      setState: (partial) => applyState(partial, true),
      start,
      destroy,
      DEFAULT_STATE,
    };
  }

  global.CherrySync = { createSync, DEFAULT_STATE, roomCode };
})(window);
