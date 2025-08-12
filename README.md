# Chat soundboard overlay

A widget for [Pogly](https://github.com/PoglyApp/pogly-standalone) that allows Twitch or Kick chat to trigger a MP3 sound effect.

# Demo
https://github.com/user-attachments/assets/5051eff6-50d7-40e2-97e5-dea80ba10326

# Widget
```
{"widgetName":"Chat soundboard","widgetWidth":500,"widgetHeight":258,"headerTag":"","bodyTag":"<iframe id=\"iframe\" src=\"\" allowtransparency=\"true\"></iframe>","styleTag":"html, body {\n    width: 100%;\n    height: 100%;\n    overflow: hidden!important;\n    background-color: rgba(0,0,0,0);\n}\n\niframe {\n    width: 100%;\n    height: 100%;\n    border: none;\n    overflow: hidden!important;\n    display: block;\n    background-color: rgba(0,0,0,0);\n}","scriptTag":"(() => {\n  document.getElementById(\"iframe\").src = \"https://repo.pogly.gg/chatsoundboard/?channel={channel}&audioname={name}&playword={trigger_word}&volume={volume}&enabled={On/Off}&audiourl=\"+ encodeURI(\"{audio_url}\") + \"&chance=\" + encodeURI(\"{chance_to_trigger}\");\n\n})();","variables":[{"variableName":"channel","variableType":1,"variableValue":"bobross"},{"variableName":"name","variableType":1,"variableValue":"Placeholder"},{"variableName":"trigger_word","variableType":1,"variableValue":""},{"variableName":"chance_to_trigger","variableType":1,"variableValue":""},{"variableName":"audio_url","variableType":1,"variableValue":""},{"variableName":"volume","variableType":1,"variableValue":"0.5"},{"variableName":"On/Off","variableType":3,"variableValue":false}]}
```
