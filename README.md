# Schotten Totten en cartes classiques

*(nom provisoire, voir `docs/noms.md`)*

Adapter **Schotten Totten** (Reiner Knizia) à un jeu que tout le monde a
dans un tiroir, un jeu de 52 cartes ou un jeu de tarot :

- **42 cartes** = 7 bornes × 3 cartes × 2 joueurs ;
- **40 cartes « normales »** : 4 couleurs × 1-10 (jeu de 52 sans les figures)
  ou 5 couleurs × 1-8 (tarot : les 4 couleurs + les atouts 1 à 8) ;
- **2 jokers** qui remplacent n'importe quelle carte.

Le dépôt contient :

| Où | Quoi |
|---|---|
| `out/statistiques.md` | les statistiques en ASCII art |
| `out/statistiques.html` | le même rapport, interactif (s'ouvre d'un double-clic) |
| `regles/regles.pdf` | la fiche de règles à imprimer (A4 recto-verso) |
| `docs/noms.md` | propositions de noms |
| `docs/methode.md` | hypothèses, méthode et limites des calculs |

## Commandes

```bash
npm run build     # recalcule toutes les statistiques → out/
npm run pdf       # regles/regles.html → regles/regles.pdf (Edge ou Chrome)
npm run check     # lint + tests, avant chaque commit
```

Aucun chiffre n'est tapé à la main dans les rapports : ils sortent tous de
`npm run build`. Changer une règle, c'est changer `src/config/decks.js` et
relancer le build.
