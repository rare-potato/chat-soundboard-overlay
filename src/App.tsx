import { useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";
import "./App.css";

function App() {
  const initialized = useRef<boolean>(false);

  const urlParams = new URLSearchParams(window.location.search);

  // Pass required information to the widget with URL parameters.
  const TWITCH_CHANNEL = urlParams.get("channel");
  const PLAY_WORD = urlParams.get("playword");
  const AUDIO_NAME = urlParams.get("audioname");
  const AUDIO_URL = urlParams.get("audiourl");
  const VOLUME = urlParams.get("volume");
  const ENABLED = urlParams.get("enabled");
  const RANDOM_CHANCE = urlParams.get("chance");

  if (!TWITCH_CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="http://localhost:5173/example/?channel=bobross">http://localhost:5173/example/?channel=bobross</a>!
      </>
    );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (ENABLED === "false") return;
    if (!AUDIO_URL) return;

    // Twitch chat connection logic
    const twitchChannel: string = TWITCH_CHANNEL.toLowerCase();
    const twitchClient = tmi.Client({
      connection: {
        reconnect: true,
        maxReconnectAttempts: Infinity,
        maxReconnectInterval: 30000,
        reconnectDecay: 1.4,
        reconnectInterval: 5000,
        timeout: 180000,
      },
      channels: [twitchChannel],
    });

    twitchClient.connect();

    twitchClient.on("connected", () => {
      console.log("Connected to twitch chat!");
    });

    // Code to grab messages from Twitch chat.
    twitchClient.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string) => {
      if (/[\u0020\uDBC0]/.test(message)) {
        message = message.slice(0, -3);
      }

      if (message !== PLAY_WORD) return;

      if (RANDOM_CHANCE) {
        const roll = Math.random() * 100 < Number(RANDOM_CHANCE.replace("%", ""));

        if (!roll) return;
      }

      console.log("Playing");

      const audio = new Audio(decodeURI(AUDIO_URL));
      audio.volume = Number(VOLUME) || 0.5;

      audio.play();
    });
  }, []);

  // The actual page shown.
  return (
    <div
      style={{
        color: `${ENABLED === "true" ? "green" : "red"}`,
      }}
      className="container"
    >
      <h1 style={{ margin: "0", padding: "0" }}>{AUDIO_NAME}</h1>
    </div>
  );
}

export default App;
