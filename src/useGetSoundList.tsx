import { useEffect, useState } from "react";
import { SoundType } from "./SoundType";

export const useGetSoundList = (setSoundList: Function, soundList: SoundType[]) => {
  const urlParams = new URLSearchParams(window.location.search);

  const [finished, setFinished] = useState<boolean>(false);

  const TRIGGER_WORD = urlParams.get("triggerword");
  const AUDIO_NAME = urlParams.get("audioname");
  const AUDIO_URL = urlParams.get("audiourl");
  const VOLUME = urlParams.get("volume");
  const ENABLED = urlParams.get("enabled");
  const RANDOM_CHANCE = urlParams.get("chance");

  const SOUND_LIST_URL = urlParams.get("soundlisturl") ? decodeURIComponent(urlParams.get("soundlisturl")!) : null;

  useEffect(() => {
    if (finished) return;

    if (AUDIO_URL && !SOUND_LIST_URL) {
      const sound: SoundType = {
        name: AUDIO_NAME!,
        trigger_word: TRIGGER_WORD!,
        sound: AUDIO_URL,
        volume: Number(VOLUME!),
        chance: RANDOM_CHANCE || "100%",
        enabled: ENABLED!,
      };

      setSoundList([sound]);
      setFinished(true);
    }

    if (!SOUND_LIST_URL || soundList.length > 0) return;

    (async () => {
      const REQUEST = await fetch("https://cors-anywhere.herokuapp.com/" + SOUND_LIST_URL);
      const SOUND_JSON = await REQUEST.json();

      if (SOUND_JSON && SOUND_JSON.sounds) {
        const soundArray: SoundType[] = SOUND_JSON.sounds;

        setSoundList(soundArray);
        setFinished(true);
      }
    })();
  }, []);
};
