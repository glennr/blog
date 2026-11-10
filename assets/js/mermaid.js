// Override of the theme's mermaid configuration, which appearance.js calls on
// load and again on every switch between light and dark.
//
// The theme passes "rgb( r, g, b)" strings read from the colour scheme, and
// mermaid's colour parser cannot read them, so the derived colours come out
// black. This converts each scheme colour to hex first. Both modes use the
// "base" theme with the scheme's own colours, so a diagram matches the page.

function hex(name) {
  const rgb = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .split(",");
  return (
    "#" + rgb.map((c) => parseInt(c, 10).toString(16).padStart(2, "0")).join("")
  );
}

const mermaidFont =
  "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,segoe ui,Roboto,helvetica neue,Arial,noto sans,sans-serif";

function initMermaid(dark) {
  const ink = hex(dark ? "--color-neutral-200" : "--color-neutral-800");
  const box = hex(dark ? "--color-neutral-800" : "--color-primary-50");
  const edge = hex(dark ? "--color-primary-400" : "--color-primary-500");
  const line = hex(dark ? "--color-neutral-400" : "--color-neutral-600");
  const note = hex(dark ? "--color-neutral-700" : "--color-neutral-100");
  // An edge label sits on the line, so it takes the page colour.
  const page = hex(dark ? "--color-neutral-800" : "--color-neutral");
  mermaid.initialize({
    theme: "base",
    // Mermaid 12 lays flowcharts out with elk, giving right-angled edges, and
    // strokes each node with a two-colour gradient. dagre and useGradient keep
    // the flat look the diagrams were drawn for; custom.css drops its shadows.
    layout: "dagre",
    sequence: { mirrorActors: false, wrap: true, width: 120, actorMargin: 30 },
    flowchart: { nodeSpacing: 30, rankSpacing: 40, wrappingWidth: 140 },
    themeVariables: {
      darkMode: dark,
      background: "transparent",
      useGradient: false,
      fontFamily: mermaidFont,
      fontSize: "15px",
      primaryColor: box,
      primaryTextColor: ink,
      primaryBorderColor: edge,
      secondaryColor: note,
      tertiaryColor: note,
      lineColor: line,
      textColor: ink,
      actorBkg: box,
      actorBorder: edge,
      actorTextColor: ink,
      actorLineColor: line,
      signalColor: line,
      signalTextColor: ink,
      labelBoxBkgColor: box,
      labelBoxBorderColor: edge,
      labelTextColor: ink,
      loopTextColor: ink,
      noteBkgColor: note,
      noteBorderColor: line,
      noteTextColor: ink,
      edgeLabelBackground: page,
    },
  });
}

function initMermaidLight() {
  initMermaid(false);
}

function initMermaidDark() {
  initMermaid(true);
}

// A diagram wider than the column renders shrunk to fit it, and a left-to-right
// flowchart of more than three boxes then has text too small to read. After
// each render, a diagram that would shrink below MIN_SCALE is redrawn top to
// bottom when it is a left-to-right flowchart, and otherwise keeps a readable
// size and scrolls sideways inside the column.
// shortcut: decided once per render, not on resize or rotation; add a
// ResizeObserver if a reader turning a phone matters.
const MIN_SCALE = 0.85;
const LEFT_TO_RIGHT = /^(\s*(?:flowchart|graph)\s+)(LR|RL)\b/;

function letScroll(pre, svg, natural) {
  svg.style.minWidth = `${natural * MIN_SCALE}px`;
  pre.dataset.scrolls = "true";
  // Focusable and named, so a keyboard or screen reader can scroll it too.
  pre.tabIndex = 0;
  pre.setAttribute("role", "region");
  pre.setAttribute("aria-label", "Diagram, scrolls sideways");
  // The faded edge says there is more; drop it once the reader is at the end.
  pre.onscroll = () =>
    pre.toggleAttribute(
      "data-at-end",
      pre.scrollLeft + pre.clientWidth >= pre.scrollWidth - 1,
    );
}

const mermaidRun = mermaid.run.bind(mermaid);
mermaid.run = async (options) => {
  const pres = [...document.querySelectorAll("pre.mermaid")];
  // The theme's own call redraws every diagram from its source, so forget flips.
  if (!options) {
    pres.forEach((pre) => {
      delete pre.dataset.flipped;
      delete pre.dataset.scrolls;
      delete pre.dataset.atEnd;
    });
  }
  await mermaidRun(options);

  const flip = [];
  for (const pre of pres) {
    const svg = pre.querySelector("svg");
    const natural = svg?.viewBox.baseVal.width;
    if (!natural || natural * MIN_SCALE <= pre.clientWidth) continue;
    const source = pre.getAttribute("data-graph") || "";
    if (!pre.dataset.flipped && LEFT_TO_RIGHT.test(source)) {
      pre.dataset.flipped = "true";
      pre.removeAttribute("data-processed");
      pre.textContent = source.replace(
        LEFT_TO_RIGHT,
        (_, head, dir) => head + (dir === "LR" ? "TB" : "BT"),
      );
      flip.push(pre);
    } else {
      letScroll(pre, svg, natural);
    }
  }
  if (flip.length) await mermaid.run({ nodes: flip });
};
