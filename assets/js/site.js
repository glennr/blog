// The site's one script: the light/dark toggle, the typing line, and the
// Email me links. Each part finds nothing to do on a page without its markup.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Light/dark. The head script set data-theme before paint; this flips it and
// remembers the choice.
for (const button of document.querySelectorAll("[data-theme-toggle]")) {
  button.addEventListener("click", () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    document.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  });
}

// The "$ currently:" line types each phrase, waits, deletes it, and moves on.
// With reduced motion it shows the first phrase and stops.
const typing = document.querySelector(".typing[data-words]");
if (typing && !reducedMotion) {
  const words = JSON.parse(typing.dataset.words);
  const target = typing.querySelector(".typing__word");
  let word = 0;
  let length = words[0].length;
  let deleting = true;
  const tick = () => {
    const text = words[word];
    length += deleting ? -1 : 1;
    target.textContent = text.slice(0, length);
    let delay = deleting ? 35 : 70;
    if (!deleting && length === text.length) {
      deleting = true;
      delay = 1800;
    } else if (deleting && length === 0) {
      deleting = false;
      word = (word + 1) % words.length;
      delay = 300;
    }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 2500);
}

// An "Email me" link carries data-mail-user and data-mail-domain and goes to
// Contact without JavaScript. On click it becomes a mailto, so no page prints
// a whole address for a scraper to find.
for (const link of document.querySelectorAll("a[data-mail-user]")) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    location.href = `mailto:${link.dataset.mailUser}@${link.dataset.mailDomain}`;
  });
}
