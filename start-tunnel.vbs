Set shell = CreateObject("WScript.Shell")
' 0 means hidden window
shell.Run "cmd /c npx localtunnel --port 5173", 0, False
