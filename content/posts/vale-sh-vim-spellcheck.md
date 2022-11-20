---
title: "Vale.sh Vim Spellcheck"
description: "Vale.sh Vim Spellcheck"
date: 2022-11-13T10:32:39+10:00
categories:
  - blogging
tags:
  - vim
  - Neovim
  - LunarVim
---

[Vale.sh](https://vale.sh/) is a great tool for enforcing a writing style in your documents.

My vale.sh setup follows the one described in [Writing like a pro with vale & Neovim](https://bhupesh.me/writing-like-a-pro-with-vale-and-neovim/), (albeit with my preferred [LunarVim](https://www.lunarvim.org/)).

Once you've got Vale up and running, both it and Neovim spell checking will complain about the same things. Technical terms often appear as false positives, so the [`zg`](https://neovim.io/doc/user/spell.html#spell-quickstart) shortcut is handy. (`zg` adds the word under the cursor as a good word to your spellfile.) However Vale.sh still complains about the spelling you just whitelisted:

```
  Did you really mean 'blargh'? vale (Vale.Spelling) [17, 139]
```

A neat workaround is to link [Vale Vocabularies accept.txt](https://vale.sh/docs/topics/vocab/) to your vim spellfile.

First, set up a Vale Vocab folder

```
mkdir -p styles/Vocab/Blog/
```

And configure Vale to use it

```git
diff --git a/.vale.ini b/.vale.ini
index 636f9f3..db22387 100644
--- a/.vale.ini
+++ b/.vale.ini
@@ -4,6 +4,8 @@ MinAlertLevel = suggestion

 Packages = Microsoft, proselint, Hugo

+Vocab = Blog
+
 [*]
 BasedOnStyles = Vale, Microsoft, proselint
```

Then symlink the [Vale `accept.txt`](https://vale.sh/docs/topics/vocab/#file-format), for example

```
% ln -s ~/.config/lvim/spell/en.utf-8.add styles/Vocab/Blog/accept.txt
% ll styles/Vocab/Blog/accept.txt
lrwxrwxrwx 1 g g 39 Nov 12 17:51 styles/Vocab/Blog/accept.txt -> /home/g/.config/lvim/spell/en.utf-8.add
```

Now if you mark a word as 'good' in Neovim, Vale will accept it too.
