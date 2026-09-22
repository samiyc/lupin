/*
 * The explorer of the statistics report. Inlined as a classic script (no ES
 * module) so the page also works when opened from the disk. Everything it
 * shows comes from REPORT_DATA, written by the build next to this script.
 */
(function explorer() {
  "use strict";

  const data = REPORT_DATA;
  const form = document.getElementById("explorer-form");
  if (!form) return;

  const PATTERNS = ["straightFlush", "threeOfAKind", "flush", "straight"];
  const NARROW_SPACE = String.fromCharCode(0x202f);
  const pct = (share, digits) => {
    const places = digits ?? (share < 0.01 ? 2 : 1);
    return (share * 100).toFixed(places).replace(".", ",") + NARROW_SPACE + "%";
  };

  function el(name, attrs, ...children) {
    const node = document.createElement(name);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === "style") node.style.cssText = value;
      else node.setAttribute(key, value);
    });
    children.forEach((child) => node.append(child));
    return node;
  }

  const choice = (name) => form.querySelector(`input[name="${name}"]:checked`).value;

  const markOf = (ok) =>
    el("span", { class: ok ? "mark ok" : "mark bad", title: ok ? "à sa place" : "pas à sa place" }, ok ? "✓" : "✗");

  function rung({ formation, index, share, max, expected }) {
    const width = Math.max(1, (100 * share) / max).toFixed(1);
    const color = `var(--rank-${data.orders.original.indexOf(formation) + 1})`;
    return el(
      "div",
      { class: "rung" },
      el("span", { class: "num" }, String(index + 1)),
      el("span", {}, data.labels.formations[formation]),
      el("span", { class: "track" }, el("span", { class: "fill", style: `display:block;width:${width}%;background:${color}` })),
      el("span", { class: "v num" }, pct(share)),
      markOf(expected[index] === formation),
    );
  }

  function ladder(title, values, order, note) {
    const expected = data.orders[order].filter((f) => f !== "sum");
    const rare = PATTERNS.slice().sort((a, b) => values[a] - values[b]);
    const max = Math.max(...rare.map((f) => values[f]));
    const ok = rare.every((f, i) => f === expected[i]);
    return [
      el("h3", {}, title),
      ...rare.map((f, i) => rung({ formation: f, index: i, share: values[f], max, expected })),
      el("p", { class: "verdict-line" }, ok ? "Ordre choisi respecté ✓" : "Ordre choisi bousculé ✗"),
      el("p", { class: "note" }, note),
    ];
  }

  function triplesPane(deck, rule, order) {
    const exact = data.exact[deck][rule][order];
    const shares = Object.fromEntries(PATTERNS.map((f) => [f, exact.best[f] / exact.total]));
    const note = `${exact.total.toLocaleString("fr-FR")} mains de 3 cartes, toutes comptées.`;
    return ladder("Trois cartes au hasard", shares, order, note);
  }

  function handPane(deck, rule, order) {
    const hand = data.hands[deck][rule];
    return ladder("Déjà dans une main de 6", hand, order, "Probabilité que la main de départ contienne la combinaison.");
  }

  function playNote(sim) {
    const sums = "Bornes jouées à la somme : " + pct(sim.sumShare, 1);
    return sim.drawShare > 0.01 ? sums + " · parties sans vainqueur : " + pct(sim.drawShare, 1) : sums;
  }

  function playPane(deck, rule, order) {
    const sim = data.sims[`${deck}-${rule}-${order}`];
    if (!sim) {
      return [
        el("h3", {}, "Parties simulées"),
        el("p", { class: "note" }, "Cette combinaison-là n’a pas été jouée par les robots. Les variantes jouées : ordre d’origine partout, et tous les ordres en 4 couleurs."),
      ];
    }
    const bar = el("span", { class: "pbar", role: "img", "aria-label": "Profil des bornes gagnées" });
    sim.profile.forEach((share, i) => {
      bar.append(el("span", { class: `seg seg-${i + 1}`, style: `flex-basis:${(100 * share).toFixed(2)}%`, title: `${data.labels.ranks[i]} : ${pct(share)}` }));
    });
    return [
      el("h3", {}, "Parties simulées"),
      el("p", { class: "big-number" }, pct(sim.resemblance, 1)),
      el("p", { class: "note" }, "de ressemblance avec l’original"),
      bar,
      el("p", { class: "note" }, playNote(sim)),
    ];
  }

  function syncRules(deck) {
    const hasJokers = data.jokers[deck];
    form.querySelectorAll('input[name="rule"]').forEach((input) => {
      input.disabled = !hasJokers && input.value !== "free";
      if (input.disabled && input.checked) form.querySelector("#rule-free").checked = true;
    });
  }

  function render() {
    const deck = choice("deck");
    syncRules(deck);
    const rule = data.jokers[deck] ? choice("rule") : "free";
    const order = choice("order");
    const panes = [["pane-triples", triplesPane], ["pane-hand", handPane], ["pane-play", playPane]];
    panes.forEach(([id, build]) => document.getElementById(id).replaceChildren(...build(deck, rule, order)));
  }

  form.addEventListener("change", render);
  render();
})();
