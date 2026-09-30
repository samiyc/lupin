/**
 * The two kinds of puzzle, and what differs between them. An endgame (the
 * default) has an empty pile and every card known: the page plays it out
 * against the solver. A "gain immédiat" (`kind: "immediate"`, from
 * `npm run puzzles:immediate`) keeps the opponent's hand hidden: one move
 * makes the win certain at the next claim, whatever they hold, and the
 * puzzle ends on that move.
 */
export const isImmediate = (current) => current.kind === "immediate";

/** Every legal move with its value for the side to move: 1 for a solution, -1 otherwise. */
export function solutionOf(current, legal, text) {
  const wins = current.solutions.map((solution) => ({ card: solution.split("→")[0], border: Number(solution.split("→")[1]), value: 1 }));
  const others = legal.filter((move) => !current.solutions.includes(text(move)));
  return [...wins, ...others.map((move) => ({ card: text(move).split("→")[0], border: move.border + 1, value: -1 }))];
}

export function openingMessage(current) {
  const count = current.solutions.length;
  const found = `${count} coup${count > 1 ? "s gagnent" : " gagne"} sur ${current.moves}`;
  if (!isImmediate(current)) return `Trouve le coup gagnant : ${found}.`;
  return `Gain immédiat : trouve le coup qui te fait revendiquer la victoire tout de suite, quoi que tienne l'adversaire (${found}).`;
}

export function immediateMessage(slip, helped) {
  if (slip) return slip;
  if (helped) return "Gagné, mais avec de l'aide.";
  return "Résolu ! Ce coup prouve assez de bornes, avec les seules cartes de la table, pour les revendiquer et gagner tout de suite.";
}

export const hintOf = (current) =>
  isImmediate(current)
    ? "La main adverse et la pioche restent cachées. Une borne se revendique quand tes 3 cartes battent tout ce que l'adversaire pourrait encore y poser, preuve faite avec les seules cartes de la table."
    : "Pioche vide : toutes les cartes sont connues. Joue le camp du bas contre un adversaire parfait.";

export const namesOf = (current) => ({ bottom: "Toi (au trait)", top: isImmediate(current) ? "Adversaire — main cachée" : "Adversaire — jeu parfait" });

/** A random order, the puzzles not yet solved first. */
export function randomOrder(list, solved, rng) {
  const indices = list.map((_, i) => i);
  const fresh = rng.shuffle(indices.filter((i) => !solved.has(list[i].id)));
  return [...fresh, ...rng.shuffle(indices.filter((i) => solved.has(list[i].id)))];
}
