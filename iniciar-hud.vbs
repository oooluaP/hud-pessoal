Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Projetos\hud && node server.js", 0, False
