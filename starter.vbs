Set WshShell = CreateObject("WScript.Shell")
' Run the batch file hidden
WshShell.Run "cmd.exe /c start_gen.bat", 0, False
Set WshShell = Nothing
