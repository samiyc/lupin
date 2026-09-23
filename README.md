# Bornage — Schotten Totten en cartes classiques

*Projet Lopin n°742 : 7 bornes, 42 cartes. Le choix du nom est expliqué dans
`docs/noms.md`.*

Adapter **Schotten Totten** (Reiner Knizia) à un jeu que tout le monde a dans un
tiroir, un jeu de 52 cartes ou un jeu de tarot :

- **42 cartes** = 7 bornes × 3 cartes × 2 joueurs ;
- **40 cartes « normales »** : 4 couleurs × 1-10 (jeu de 52 sans les figures),
  ou 5 couleurs × 1-8 (tarot : les 4 couleurs et les atouts de 1 à 8) ;
- **2 jokers** qui remplacent une carte.

## Le verdict

Le 4 couleurs marche, **à une condition : le joker vaut le chiffre qu'on veut,
mais il n'a pas de couleur.** Avec cette règle, l'ordre d'origine des
combinaisons reste juste, et une partie ressemble à l'original autant que la
version rapide 6 × 1-7. Avec un joker qui peut tout remplacer, aucun ordre ne
tient. Le détail est dans le rapport.

## Les fichiers

| Où | Quoi |
|---|---|
| `regles/regles.pdf` | **la fiche de règles à imprimer** (A4 recto-verso) |
| `out/statistiques.html` | le rapport complet, interactif (s'ouvre d'un double-clic) |
| `out/statistiques.md` | le même rapport en ASCII art |
| `docs/noms.md` | propositions de noms |
| `docs/methode.md` | méthode, hypothèses et limites des calculs |

## Commandes

```bash
npm run build     # recalcule toutes les statistiques → out/ (environ 1 min 30)
npm run pdf       # regles/regles.html → regles/regles.pdf (Edge ou Chrome)
npm run check     # lint + tests, avant chaque commit
```

Aucun chiffre n'est tapé à la main dans les rapports : ils sortent tous de
`npm run build`. Changer une règle, c'est modifier `src/config/` et relancer le
build.

Les polices de la fiche de règles (Atkinson Hyperlegible, Bodoni Moda) sont
livrées dans `regles/fonts/`, sous licence SIL Open Font License.
