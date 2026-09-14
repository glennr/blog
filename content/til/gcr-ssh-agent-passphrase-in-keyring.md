---
title: "gcr-ssh-agent will not sign until the passphrase is in the keyring"
date: 2026-09-14T22:48:43+10:00
draft: true
format: til
tags:
  - ssh
  - omarchy
  - gnome-keyring
---

`gcr-ssh-agent` refuses to sign until the key's passphrase is stored in the
keyring, and `ssh-add -l` gives you no warning.

`gcr-ssh-agent` is GNOME's SSH agent, from the
[`gcr`](https://gitlab.gnome.org/GNOME/gcr) library, and it replaced the agent
built into `gnome-keyring`. You use it so the login keyring unlocks your keys,
and you type no passphrase after you log in. The agent preloads every
`~/.ssh/*.pub` it finds, so the key is listed while the private half is still
unusable, and signing fails:

```text
sign_and_send_pubkey: signing failed for ED25519 ".../id_ed25519_github" from agent: agent refused operation
```

Plain `ssh-add` loads the key into the running agent only, so it is gone at the
next boot. Write the passphrase into the keyring instead:

```bash
secret-tool store --label="SSH key: id_ed25519_github" \
  unique "ssh-store:$HOME/.ssh/id_ed25519_github"
```

The `unique` value has to be `ssh-store:` followed by the full path to the key,
or the agent will not find it.

On [Omarchy](https://omarchy.org/) the agent arrives with `gnome-keyring`, in a
package called `gcr-4`. Start it with
`systemctl --user enable --now gcr-ssh-agent.socket`.
