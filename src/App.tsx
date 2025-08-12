import { useEffect, useRef, useState } from "react";
import * as tmi from "tmi.js";
import "./App.css";
import { useGetSoundList } from "./useGetSoundList";
import { SoundType } from "./SoundType";

function App() {
  const initialized = useRef<boolean>(false);

  const urlParams = new URLSearchParams(window.location.search);

  // Pass required information to the widget with URL parameters.
  const CHANNEL = urlParams.get("channel");
  const WEBSITE = urlParams.get("site");
  const [enabled, setEnabled] = useState(urlParams.get("enabled") !== "false");

  if (!CHANNEL)
    return (
      <>
        You need to put the twitch channel in the url! example:{" "}
        <a href="https://repo.pogly.gg/chatsoundboard/?channel=bobross&site=twitch">
          https://repo.pogly.gg/chatsoundboard/?channel=bobross&site=twitch
        </a>
        !
      </>
    );
  if (!WEBSITE)
    return (
      <>
        You need to put the website channel in the url! (Kick or Twitch) example:{" "}
        <a href="https://repo.pogly.gg/chatsoundboard/?channel=bobross&site=twitch">
          https://repo.pogly.gg/chatsoundboard/?channel=bobross&site=twitch
        </a>
        !
      </>
    );

  if (WEBSITE.toLowerCase() !== "twitch" && WEBSITE.toLowerCase() !== "kick") {
    return (
      <>
        <b>Error:</b> The <code>site</code> parameter must be either <code>twitch</code> or <code>kick</code>.<br />
        You provided: <code>{WEBSITE}</code>
      </>
    );
  }

  const [soundList, setSoundList] = useState<SoundType[]>([]);
  const soundCooldown = useRef<string[]>([]);
  const listOfTriggerWords = new Set<string>();
  // Keep Kick WebSocket alive
  const socketRef = useRef<WebSocket | null>(null);

  useGetSoundList(setSoundList, soundList);

  useEffect(() => {

  if (initialized.current || soundList.length === 0) return;
  initialized.current = true;

  if (!enabled) return;

    soundList.forEach((sound: SoundType) => listOfTriggerWords.add(sound.trigger_word));

    if (WEBSITE.toLowerCase() === "twitch") {
      // Twitch chat connection logic
      const twitchChannel: string = CHANNEL.toLowerCase();
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

      twitchClient.on("message", (_channel: string, tags: tmi.ChatUserstate, message: string) => {
        if (!tags) return;
        // Remove trailing special characters if present (legacy logic)
        if (message.charCodeAt(message.length - 1) === 55360) {
          message = message.slice(0, -3);
        }

        let triggerWord: string | null = null;
        // Looser matching: match trigger word as a whole word anywhere in the message
        const lowerMessage = message.toLowerCase();
        for (const word of listOfTriggerWords) {
          const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
          if (pattern.test(lowerMessage)) {
            triggerWord = word;
            break;
          }
        }

        if (!triggerWord || soundCooldown.current.includes(triggerWord)) return;

        const sound: SoundType = soundList.find((s: SoundType) => s.trigger_word === triggerWord)!;
        if (!sound || sound.enabled === "false") return;

        const roll = Math.random() * 100 < Number(sound.chance.replace("%", ""));
        if (!roll) return;

        const audio = new Audio(decodeURI(sound.sound));
        audio.volume = Number(sound.volume) || 0.5;

        audio.play();

        if (!sound.trigger_cooldown) return;

        soundCooldown.current.push(sound.trigger_word);

        setTimeout(() => {
          soundCooldown.current = soundCooldown.current.filter((word) => word !== triggerWord);
        }, sound.trigger_cooldown * 1000);
      });
    } else if (WEBSITE.toLowerCase() === "kick") {
      // Kick chat connection logic (from App.kickref.tsx)
      const channel = CHANNEL.toLowerCase();
      const wsURL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0-rc2&flash=false";

      async function getKickChatroomID(): Promise<string> {
        const url = `https://kick.com/api/v2/channels/${channel}/chatroom`;
        const response = await fetch(url);
        const data = await response.json();
        return `chatrooms.${data.id}.v2`;
      }

      async function startKickChat() {
        const chatroom_id = await getKickChatroomID();
        const socket = new WebSocket(wsURL);
        socketRef.current = socket;

        socket.onopen = () => {
          const subscribeMsg = JSON.stringify({
            event: "pusher:subscribe",
            data: { auth: "", channel: chatroom_id }
          });
          // console.log("[Kick] WebSocket opened, subscribing to chatroom:", chatroom_id);
          socket.send(subscribeMsg);
        };

        socket.onmessage = (event) => {
          // Add debug log for all incoming messages
          // console.log("[Kick] Raw message:", event.data);
          let parsed;
          try {
            parsed = JSON.parse(event.data);
          } catch (err) {
            console.error("[Kick] Failed to parse incoming message as JSON:", event.data);
            return;
          }
          if (parsed && parsed.event === "App\\Events\\ChatMessageEvent") {
            let data;
            try {
              data = JSON.parse(parsed.data);
            } catch (err) {
              console.error("[Kick] Failed to parse .data as JSON:", parsed.data);
              return;
            }
            const username = data.sender?.username;
            let message = data.content;
            // console.log("[Kick] Parsed chat message:", { username, message });
            if (username && message) {
              // Remove trailing special characters if present (legacy logic)
              if (typeof message === 'string' && message.length > 0 && message.charCodeAt(message.length - 1) === 55360) {
                message = message.slice(0, -3);
              }
              let triggerWord: string | null = null;
              const lowerMessage = message.toLowerCase();
              for (const word of listOfTriggerWords) {
                const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
                if (pattern.test(lowerMessage)) {
                  triggerWord = word;
                  break;
                }
              }
              if (!triggerWord) return;
              // Use lowercased triggerWord for cooldown check
              if (soundCooldown.current.map(w => w.toLowerCase()).includes(triggerWord.toLowerCase())) return;
              const sound = soundList.find((s: SoundType) => s.trigger_word.toLowerCase() === triggerWord!.toLowerCase());
              if (!sound || sound.enabled === "false") return;
              const roll = Math.random() * 100 < Number(sound.chance.replace("%", ""));
              if (!roll) return;
              const audio = new Audio(decodeURI(sound.sound));
              audio.volume = Number(sound.volume) || 0.5;
              audio.play();
              if (!sound.trigger_cooldown) return;
              soundCooldown.current.push(sound.trigger_word);
              setTimeout(() => {
                soundCooldown.current = soundCooldown.current.filter((word) => word.toLowerCase() !== triggerWord!.toLowerCase());
              }, sound.trigger_cooldown * 1000);
            }
          }
        };

        socket.onerror = (err) => {
          console.error("Kick WebSocket error:", err);
        };
      }

      startKickChat();
    }
  }, [soundList]);

  if (soundList.length === 0) {
    return (
      <div
        style={{
          color: enabled ? "green" : "red",
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
        color: enabled ? "green" : "red",
      }}
      className="container"
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: "bold" }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={() => setEnabled((prev) => !prev)}
            style={{ marginRight: 8 }}
          />
          Soundboard {enabled ? "ON" : "OFF"}
        </label>
      </div>
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
