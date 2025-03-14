---
title: "A Space Broke the Drata Agent"
description: "A simple but frustrating issue with directory names containing spaces causing the Drata Agent to fail"
date: 2025-03-14T10:47:00+10:00
categories:
  - troubleshooting
tags:
  - drata
  - linux
---

I recently ran into a simple but frustrating issue with [Drata's](https://drata.com/) Agent for [Linux](https://help.drata.com/en/articles/4752916-installing-the-drata-agent-via-ubuntu-linux). The agent wouldn't start, and the logs showed this error:

```
LaunchProcess: failed to execvp:
/opt/Drata
[FATAL:zygote_host_impl_linux.cc(201)] Check failed: . : Invalid argument (22)
```

After checking `ps` to confirm the process wasn't running and looking through system logs with `dmesg` and `tail -f /var/log/*`, I took a closer look at my autostart file:

```ini
Exec=/opt/"Drata Agent"/drata-agent
```

The issue? A space in the directory name. While the command worked in the terminal with quotes, the autostart system couldn't handle it properly and was only executing `/opt/Drata`.

The fix was straightforward:

```bash
sudo mv "Drata Agent" DrataAgent
```

And updating the autostart config:

```ini
Exec=/opt/DrataAgent/drata-agent
```

After this change, the agent started without issues. A simple space in a directory name was the culprit all along.