# glenn-roberts.com

A Hugo blog.

## Setup

```bash
mise install
mise run setup
```

`mise run setup` also points git at `.githooks`, so a commit runs the checks.
That setting is per clone, which is why it lives in a task rather than a
file.

`mise install` gets every tool the checks run, at the version in
`.tool-versions`: Hugo, Vale, htmltest, prettier, markdownlint-cli2 and taplo.
CI installs from the same file, so there is no second list of versions. The
Vale styles are vendored under `styles/` and tracked, so do not run
`vale sync`: it re-syncs over the top and recreates the config fragments the
one `.vale.ini` replaced.

`mise run setup` installs `styles/Security/Infra.yml`, copying it from the main
checkout into a worktree. That file is gitignored: it holds the real host,
network and device names this blog must never print, and this repository is
public. Add them in the main checkout's copy, never to the example. On a fresh
clone there is nothing to copy, and setup fails until you create it there from
`styles/Security/Infra.yml.example`.

CI gets the same file from the `VALE_SECURITY_INFRA` repository secret, which
holds the whole file verbatim. Without the secret the lint step fails and
nothing publishes. Send it, and re-send it after every edit to the rule:

```bash
mise run push-secret
```

Nothing detects drift between the local rule and the secret, so a forgotten
`mise run push-secret` leaves CI linting against the older rule.

## Checks

`mise run check` is what CI runs before it deploys, and it is
`lint build anchors test`. `mise run lint` is every check that only reads.
`mise tasks` lists every task with a line on what it does.

A task that is one command, or only a list of tasks, lives in `mise.toml`.
A task with logic is an executable under `mise-tasks/`, and its `#MISE`
header carries the description, the files it reads, the stamp it writes and
what it depends on, so the check and the rule for when it runs are one file.
Two commands that do not need each other are two tasks, and mise runs them
in parallel.

| | |
| :-- | :-- |
| `mise run lint-prose` | Vale over `content/`, the Slop, Security and House styles |
| `mise run lint-md` | markdownlint over the posts and this file |
| `mise run lint-format` | `lint-prettier` over the css and yaml, `lint-taplo` over the toml |
| `mise run front-matter` | the keys each section publishes with |
| `mise run dates` | no commit whose only content change is a date |
| `mise run words` | no post's prose past its format's budget in `data/word-budgets.toml` |
| `mise run agent-text` | no `<!-- agent -->` markers in post source |
| `mise run anchors` | every anchor the site has published still resolves |
| `mise run build` | the production build |
| `mise run test` | htmltest over `build/` |

Two tasks write to the tree, and neither is in `check`. `mise run fix` -
`format-fix` under its older name - runs prettier and taplo over the files they
own. `mise run anchors-accept` rewrites the `anchors.txt` baseline, which is
only ever right when a page was deliberately removed.

`mise run fix` also takes paths to narrow it to a list:

```bash
mise run fix                      # the whole tree
mise run fix a.css b.toml         # only those, split by the tool that owns each
```

`mise run pre-commit` uses the second form on the staged paths and re-stages
what it rewrote, so a commit carries the formatted version rather than leaving
it behind as a dirty tree. A path containing a space arrives intact.
`.githooks/pre-commit` is one line that runs that task.

`mise run lint-advice` prints everything Vale has to say, including the styles
`lint-prose` filters out, and never fails.

### A warm run runs nothing

`mise run pre-commit` runs the same task, because CI only sees a commit
after it exists. It formats the staged paths first and stages the result, then
checks the working tree rather than the index, so a partial `git add` validates
something other than what is being committed. The date
rule is the exception: before the commit exists there is no range to read, so
the hook asks `mise run dates --staged` whether the staged diff is a
bare date change. `git commit --no-verify` skips the hook. CI does not.

Each task names its `sources`, and mise keeps a stamp per task in its own
state directory, so a task whose inputs have not changed does not run. mise prints
`sources up-to-date, skipping` for each of those and `Finished in` at the
end, so a passing run on a clean tree still shows every check it skipped.
The tasks print nothing of their own.

`mise run --force check` ignores the stamps and is the cold run, and
`mise run bench` times both.

### Speed

`mise run check` runs on every commit, so the number that matters is the warm
one. `mise run bench` prints both:

| | |
| :-- | :-- |
| `mise run check`, cold | 339 ms |
| `mise run check`, warm | 54 ms |

The cold run is under half of what it was under make, because mise runs
tasks that do not depend on each other in parallel: the linters run beside
the build rather than before it.

Keep both under a second. The checks that are now `front-matter` and
`dates` under `mise-tasks/` were shell loops
once and cost 903 ms between them, which was half the cold run and all of the
warm one; each is a single `awk` or `git log` pass now and they cost 30 ms
together. If a new check pushes the cold run over a second, that is the first
thing to look at.

## Editing a published post

A published post can be edited. What changes is whether the edit is disclosed,
and that turns on whether it changes what the post claims, which is the same
test the [BBC](https://www.bbc.co.uk/editorialguidelines/guidelines/accuracy)
and [PLOS](https://journals.plos.org/plosone/s/corrections-expressions-of-concern-and-retractions)
both use. Each edit falls in one of three tiers:

1. It does not change a claim. A typo, a dead link, a code fence that never
   had a language. Edit it and say nothing. A marker that fires on whitespace
   is a marker nobody reads.
2. It changes a claim, and the old text was not wrong. Set `lastmod` in the
   front matter by hand and the page prints an updated date.
3. The post was wrong. Leave the wrong text where it is and add a dated
   `Update, <date>:` note beside it. Quietly correcting a claim someone has
   already read and repeated is the one case where silence costs something.

`enableGitInfo` stays off on purpose. It would date every post from its last
commit, so a whitespace pass would stamp the whole archive as revised.

Heading text is frozen once a post publishes, because the heading generates
the anchor and a renamed heading breaks every bookmark and inbound link to
that section. It fails more quietly than a dead page: the browser finds no
element and scrolls to the top, so nobody reports it. If a heading has to
change, keep the old anchor alive beside it:

```html
<div id="the-old-anchor"></div>

## The new heading
```

`mise run anchors` holds the whole site to this. `anchors.txt` is the baseline of
every anchor the production build emits, and the check fails when one of them
disappears. A new anchor is not an error. Removing one is a decision, so
`mise run anchors-accept` rewrites the baseline and puts the removal in the diff
where it has to be approved.

## Writing

```bash
hugo new content posts/<slug>.md --kind guide
hugo new content posts/<slug>.md --kind til
```

The kind is the shape, and it writes the front matter. The archetypes are in
`archetypes/`; the shapes a post may declare, with their word budgets, are in
`data/word-budgets.toml`. Headings come from the content, not a template.

Run the Hugo dev server with

```bash
mise run serve
```

`mise run dcup` is the Docker path.
