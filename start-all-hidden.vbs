Set shell = CreateObject("WScript.Shell")

' 1. Chay Backend (da vao thu muc backend)
shell.Run "cmd /c cd /d backend && npm run dev", 0, False

' 2. Chay Frontend (da vao thu muc frontend)
shell.Run "cmd /c cd /d frontend && npm run dev", 0, False

' 3. Chay LocalTunnel 
shell.Run "cmd /c npx localtunnel --port 5173", 0, False

WScript.Echo "He thong dang khoi dong ngam (Backend, Frontend, Tunnel). Ban co the dong cua so nay."
