---
title: "When Mise Ignores Your Global Config: A Tale of Red Herrings and Stale State"
description: "Troubleshooting Mise configuration issues when your global config is being ignored"
date: 2025-03-11T23:20:00+10:00
categories:
  - development
tags:
  - mise
  - neovim
  - troubleshooting
---

Imagine this: you're happily typing away in Neovim, living your best dev life,
and suddenly you see an error message like this:

```
mise ERROR No version is set for shim: node
Set a global default version with one of the following:
mise use -g node@latest
```

And you think: "But hang on, I *do* have `node = "latest"` in my global Mise
config (`~/.config/mise/config.toml`)—did Mise not even *read* it?"

Well, yes. And, bizarrely, also no. This is the story of how I discovered Mise
was effectively giving my global config the silent treatment—while insisting it
was "tracked." Below is the journey, the misdirections that could lead you
astray, and the eventual fix that saved my Neovim setup from imploding.

---

## 1. The Symptom: Shell Fine, Neovim Complaining

### **Neovim's Perspective**

- LSP and plugins throw "No version is set for shim: node."
- Running `:!mise doctor` inside Neovim might still show `shims_on_path: yes`, implying it *does* find the shims.
- However, any configured tools (like Node or Python versions) aren't actually recognised.
- If you run `mise doctor` **in Neovim** and see:
  ```
  ignored_config_files:
    ~/.config/mise/config.toml
  ```
  …that's the bright, flashing sign that your global config is effectively in the naughty corner.

### **Shell's Perspective**

- Initially, your shell *appears* fine. Possibly from earlier usage or leftover
state, you could run Node without hassle.
- But if you check `mise doctor` in the shell and see the same
"ignored_config_files" line, then yes—Mise is ignoring
`~/.config/mise/config.toml` there, too. The difference is that your shell had
enough leftover "environment sauce" to carry on, while Neovim was left out in
the cold.

Basically, the shell was "putting on a brave face," but Neovim was being more
candid: no global config, no party.

---

## 2. The Red Herrings

It's easy to go down a rabbit hole here. These were my (infuriating) potential
culprits along the way.

### **Red Herring #1: Missing `eval "$(mise init -)"` in Your Shell RC**

Mise generally wants you to `eval "$(mise init -)"` in your `~/.bashrc` or
`~/.zshrc`. If you *haven't* done that, heartbreak can follow. But if your
shell **and Neovim shell commands** both report "activated: yes"
in `mise doctor`, then you know this isn't the problem. Next suspect, please.

### **Red Herring #2: Neovim Missing Shims in `PATH`**

It's common to forget to prepend `~/.local/share/mise/shims` to Neovim's
`PATH`. (The [Mise docs](https://mise.jdx.dev/ide-integration.html#neovim)
mention it, if you RTFM) If that's missing, you might
indeed see "No version is set." In this situation, though, I'd already done:

```lua
local mise_shim_path = vim.fn.expand("~/.local/share/mise/shims")
vim.env.PATH = mise_shim_path .. ":" .. vim.env.PATH
```

So the shims were recognised, yet the dreaded "No version is set" still
appeared. Therefore, not the culprit.

### **Red Herring #3: Invalid `config.toml` or Stray BOM**

Sometimes a sneaky "invisible" character or a bung `[tools]` block can cause
issues. But I triple-checked, and it was squeaky clean—no stray BOM, no dodgy
syntax. Another suspect ruled out.

---

## 3. The Real Culprit: Duplicate Entries in ignored-configs/ **and** tracked-configs/

Deep inside Mise's labyrinthine innards, you'll find two directories:

- ~/.local/state/mise/tracked-configs/
- ~/.local/state/mise/ignored-configs/

They're basically two lists of symlinks: one for config files Mise actively
loads, and one for config files it's ignoring. The kicker: if your
~/.config/mise/config.toml somehow appears **in both** with the same hash, you
get Schrödinger's config—both "tracked" and "ignored," which effectively means
*ignored*.

Here's what I found when I looked at my own setup:

```
❯ ls -al ~/.local/state/mise/ignored-configs/
Permissions Size User Date Modified Name
lrwxrwxrwx     - g    27 Nov  2024   mise-config.toml-506ade9caf4d46ff -> /home/g/.config/mise/config.toml

❯ ls -al ~/.local/state/mise/tracked-configs/
Permissions Size User Date Modified Name
lrwxrwxrwx     - g    11 Mar 15:16   49bc95cf95659576 -> /home/g/mise-test/.mise.toml
lrwxrwxrwx     - g    10 Oct  2024   506ade9caf4d46ff -> /home/g/.config/mise/config.toml
```

Notice the exact same hash identifier (`506ade9caf4d46ff`) appearing in both directories? That's the smoking gun. My config.toml contained simple version settings:

### **But…why?**

You might have told Mise to "ignore" that config at some point (maybe after a
prompt to trust or not trust the config?), and then later on you or Mise tried
to track it again. Now Mise is confused, sees it in both lists, and the
"ignore" overrides your "track." Classic.

---

## 4. Fixing It

1. **Remove the Symlink in `ignored-configs/`.**

```bash
cd ~/.local/state/mise/ignored-configs
ls -l # find something referencing ~/.config/mise/config.toml
rm mise-config.toml-<some-hash>
```

2. **Check `tracked-configs/`.** Make sure your config is still there. If it's
   missing, Mise may recreate it once you run `mise doctor` or another command.

3. **(Optional) Wipe All Mise State.** If you want a truly clean slate:

```bash
rm -rf ~/.local/state/mise
```

Then re-run `mise doctor` or `mise use -g ...` so Mise can rebuild everything.

After that, if you run `mise doctor`, you should see something like:

```
shims_on_path: yes

config_files: ~/.config/mise/config.toml

ignored_config_files: (none)
```

And—finally—Neovim's LSP or plugins will finally respect your global config's
versions.

---

## Conclusion

If you're getting "No version is set for shim: node" in Neovim (but not
obviously in your shell), don't be misled by typical PATH or shell init
suspects. Check `~/.local/state/mise/ignored-configs/` to see if your global
mise config is blacklisted. With that fixed, Neovim's LSP or plugins will
properly recognize the correct binaries.

### Quick Recap:

1. **Look** for your `~/.config/mise/config.toml` under `ignored-configs/`.
2. **Remove** it if it's there.
3. **Confirm** you get `shims_on_path: yes` for both shell and Neovim.
4. **Celebrate** having consistent tool versions everywhere!

Hopefully that saves you the same confusion I faced. Happy debugging!
