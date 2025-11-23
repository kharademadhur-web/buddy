Set ws = CreateObject("Wscript.Shell")
ws.run "wsl -e bash -c 'nohup /home/madhur2567/start_buddy.sh > /home/madhur2567/buddy.log 2>&1 &'", vbhide