import { useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";
import "./App.css";
import { useGetSoundList } from "./useGetSoundList";
import { SoundType } from "./SoundType";

function App() {
  const initialized = useRef<boolean>(false);

  const urlParams = new URLSearchParams(window.location.search);

  // Pass required information to the widget with URL parameters.
  const TWITCH_CHANNEL = urlParams.get("channel");
  const MESSAGE_CONTAINS = urlParams.get("messagecontains");
  const ENABLED = urlParams.get("enabled");

  if (!TWITCH_CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="https//repo.pogly.gg/chatsoundboard/?channel=bobross">
          https//repo.pogly.gg/chatsoundboard/?channel=bobross
        </a>
        !
      </>
    );

  const [soundList, setSoundList] = useState<SoundType[]>([]);
  const listOfTriggerWords = new Set<string>();

  useGetSoundList(setSoundList, soundList);

  useEffect(() => {
    if (initialized.current || soundList.length === 0) return;
    initialized.current = true;

    if (ENABLED === "false") return;

    soundList.forEach((sound: SoundType) => listOfTriggerWords.add(sound.trigger_word));

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
      if (!tags) return;

      if (/[\u0020\uDBC0]/.test(message)) {
        message = message.slice(0, -3);
      }

      let triggerWord: string | null = null;

      if (MESSAGE_CONTAINS === "true") {
        const words = message.split(/\s+/);

        words.some((word: string) => {
          if (listOfTriggerWords.has(word)) {
            triggerWord = word;
          }
        });
      } else {
        if (listOfTriggerWords.has(message)) {
          triggerWord = message;
        }
      }

      if (!triggerWord) return;

      const sound: SoundType = soundList.find((s: SoundType) => s.trigger_word === triggerWord)!;

      if (!sound || sound.enabled === "false") return;

      const roll = Math.random() * 100 < Number(sound.chance.replace("%", ""));

      if (!roll) return;

      const audio = new Audio(decodeURI(sound.sound));
      audio.volume = Number(sound.volume) || 0.5;

      audio.play();
    });
  }, [soundList]);

  if (soundList.length === 0) {
    return (
      <div
        style={{
          color: `${ENABLED === "true" ? "green" : "red"}`,
        }}
        className="container"
      >
        <h1 style={{ margin: "0", padding: "0" }}>No sounds loaded</h1>
      </div>
    );
  }

  // The actual page shown.
  return (
    <div
      style={{
        color: `${ENABLED === "true" ? "green" : "red"}`,
      }}
      className="container"
    >
      {soundList.length > 1 ? (
        <h1 style={{ margin: "0", padding: "0" }}>
          {soundList.filter((sound: SoundType) => sound.enabled === "true").length} sounds enabled
        </h1>
      ) : (
        <h1 style={{ margin: "0", padding: "0" }}>{soundList[0].name}</h1>
      )}
    </div>
  );
}

export default App;
