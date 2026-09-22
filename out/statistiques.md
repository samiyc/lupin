# Schotten Totten en cartes classiques — les chiffres

> Généré par `npm run build` · graine 20260922 · 2 000 parties par variante.
> Aucun chiffre de ce fichier n'a été tapé à la main.

On compare quatre façons de jouer : l'**original** (6 couleurs × 1-9, 9 bornes), ta
version **rapide** (6 couleurs × 1-7, 7 bornes), le **4 couleurs** (jeu de 52 cartes :
As à 10 + 2 jokers) et le **tarot** (4 couleurs + les atouts, de 1 à 8, + 2 atouts libres).

## Le verdict

```text
╔═ LE VERDICT ═══════════════════════════════════════════════════════════╗
║ ♠ 4 couleurs × 1-10 + 2 jokers : OUI, à une condition —                ║
║   le joker vaut le chiffre qu'on veut, mais n'a PAS de couleur.        ║
║ ♥ Avec cette règle, l'ordre d'origine reste juste : rien à réordonner. ║
║ ♦ Ressemblance avec l'original : 90,8 %                                ║
║   (ta version rapide, que tu connais bien : 90,1 %).                   ║
║ ♣ Avec un joker « libre », aucun ordre ne tient et la Suite couleur    ║
║   gagne 2,3 fois plus de bornes que dans l'original. À éviter.         ║
║ ★ Tarot 5 × 1-8 + joker sans couleur : le plus fidèle (97,2 %),        ║
║   mais il faut un tarot et lire les atouts comme une 5e couleur.       ║
╚════════════════════════════════════════════════════════════════════════╝
```

## Les cinq combinaisons, de la plus forte à la plus faible

Les règles d'origine, sur un jeu de 52 cartes. En cas d'égalité de combinaison,
la plus grosse somme gagne ; si l'égalité persiste, celui qui a fini sa ligne le premier.

```text
┌────┐┌────┐┌────┐   1. SUITE COULEUR
│4   ││5   ││6   │   trois cartes qui se suivent, de la même couleur
│   ♥││   ♥││   ♥│
└────┘└────┘└────┘

┌────┐┌────┐┌────┐   2. BRELAN
│7   ││7   ││7   │   trois cartes de même valeur
│   ♠││   ♥││   ♦│
└────┘└────┘└────┘

┌────┐┌────┐┌────┐   3. COULEUR
│2   ││5   ││9   │   trois cartes de la même couleur
│   ♣││   ♣││   ♣│
└────┘└────┘└────┘

┌────┐┌────┐┌────┐   4. SUITE
│8   ││9   ││10  │   trois cartes qui se suivent
│   ♠││   ♥││   ♦│
└────┘└────┘└────┘

┌────┐┌────┐┌────┐   5. SOMME
│3   ││7   ││10  │   tout le reste : on additionne (ici 20)
│   ♦││   ♠││   ♥│
└────┘└────┘└────┘
```

## Premier angle : trois cartes tirées au hasard

Toutes les mains de 3 cartes possibles, comptées une par une (calcul exact, pas un
sondage). Une combinaison forte doit être rare : c'est la logique des règles d'origine.

```text
┌────────────────────┬──────────────┬────────────┬─────────────────────┬────────────────────────┬───────────────────┬──────────────────────┐
│ 3 cartes au hasard │ Original 6×9 │ Rapide 6×7 │ 4 coul. joker libre │ 4 coul. joker s. coul. │ Tarot joker libre │ Tarot joker s. coul. │
├────────────────────┼──────────────┼────────────┼─────────────────────┼────────────────────────┼───────────────────┼──────────────────────┤
│ Suite couleur      │       0,17 % │     0,26 % │               1,8 % │                 0,28 % │             1,7 % │               0,26 % │
│ Brelan             │       0,73 % │      1,2 % │               1,4 % │                  1,7 % │             2,1 % │                2,4 % │
│ Couleur            │        1,9 % │      1,6 % │               5,9 % │                  3,9 % │             3,5 % │                2,2 % │
│ Suite              │        5,9 % │      9,1 % │               7,7 % │                  8,9 % │            10,8 % │               11,9 % │
│ Somme              │       91,3 % │     87,8 % │              83,2 % │                 85,2 % │            81,9 % │               83,2 % │
│ Mains possibles    │       24 804 │     11 480 │              11 480 │                 11 480 │            11 480 │               11 480 │
│ Ordre respecté ?   │            ✓ │          ✓ │                   ✗ │                      ✓ │                 ✓ │                    ✗ │
└────────────────────┴──────────────┴────────────┴─────────────────────┴────────────────────────┴───────────────────┴──────────────────────┘
```

Du plus rare au plus courant — ✓ quand la place correspond à l'ordre des règles :

```text
ORIGINAL 6×9                    4 COUL., JOKER LIBRE            4 COUL., JOKER SANS COULEUR
1. Suite couleur 0,17 %  ✓      1. Brelan        1,4 %   ✗      1. Suite couleur 0,28 %  ✓
2. Brelan        0,73 %  ✓      2. Suite couleur 1,8 %   ✗      2. Brelan        1,7 %   ✓
3. Couleur       1,9 %   ✓      3. Couleur       5,9 %   ✓      3. Couleur       3,9 %   ✓
4. Suite         5,9 %   ✓      4. Suite         7,7 %   ✓      4. Suite         8,9 %   ✓
```

```text
╔═ LE PARADOXE DU JOKER LIBRE (4 couleurs) ═══════════════════════════════════════╗
║ Ordre d'origine : Suite couleur 208 mains, Brelan 160 mains.                    ║
║   → le Brelan est le plus rare : il devrait passer devant.                      ║
║ On les échange  : Suite couleur 168 mains, Brelan 200 mains.                    ║
║   → les mains à 2 jokers deviennent des Brelans : il redevient le plus courant. ║
║ Aucun ordre ne tient. C'est le paradoxe des jokers, connu au poker              ║
║ (Gadbois, Mathematics Magazine, 1996).                                          ║
║                                                                                 ║
║ Joker sans couleur : 32 / 200 / 448 / 1 024 mains,                              ║
║ quel que soit l'ordre choisi. Il ne peut plus faire de couleur,                 ║
║ donc la Suite couleur redevient rare et l'ordre d'origine tient.                ║
╚═════════════════════════════════════════════════════════════════════════════════╝
```

En tarot, le joker sans couleur a un petit défaut au tirage de 3 cartes : le Brelan
(2,4 %) y devient à peine plus courant que la Couleur (2,2 %). Les deux
angles suivants, plus proches du jeu réel, montrent que l'ordre tient quand même.

## Deuxième angle : la main de départ (6 cartes)

Probabilité que les 6 cartes reçues contiennent déjà la combinaison complète.
C'est plus proche du jeu réel : on choisit ses 3 cartes parmi 6.

```text
┌──────────────────┬──────────────┬────────────┬─────────────────────┬────────────────────────┬───────────────────┬──────────────────────┐
│ Déjà en main     │ Original 6×9 │ Rapide 6×7 │ 4 coul. joker libre │ 4 coul. joker s. coul. │ Tarot joker libre │ Tarot joker s. coul. │
├──────────────────┼──────────────┼────────────┼─────────────────────┼────────────────────────┼───────────────────┼──────────────────────┤
│ Suite couleur    │        3,2 % │      4,9 % │              22,2 % │                  5,2 % │            21,5 % │                4,9 % │
│ Brelan           │       12,7 % │     20,1 % │              22,6 % │                 22,4 % │            30,5 % │               30,7 % │
│ Couleur          │       30,3 % │     28,3 % │              69,8 % │                 52,1 % │            55,0 % │               35,4 % │
│ Suite            │       51,0 % │     61,1 % │              62,0 % │                 61,9 % │            68,3 % │               68,0 % │
│ Ordre respecté ? │            ✓ │          ✓ │                   ✗ │                      ✓ │                 ✓ │                    ✓ │
└──────────────────┴──────────────┴────────────┴─────────────────────┴────────────────────────┴───────────────────┴──────────────────────┘
```

En 4 couleurs avec joker libre, la Couleur (69,8 %) devient plus courante que la
Suite (62,0 %) : six cartes pour quatre couleurs, il y en a forcément plusieurs
de la même. Le joker sans couleur remet les choses dans l'ordre.

## Troisième angle : les cartes qui complètent

Vous avez posé deux cartes : combien de cartes du paquet terminent la combinaison ?
(« J » = jokers qui conviennent aussi.)

```text
┌───────────────────────────────────┬──────────────┬────────────┬─────────────────────┬────────────────────────┬───────────────────┬──────────────────────┐
│ Deux cartes posées                │ Original 6×9 │ Rapide 6×7 │ 4 coul. joker libre │ 4 coul. joker s. coul. │ Tarot joker libre │ Tarot joker s. coul. │
├───────────────────────────────────┼──────────────┼────────────┼─────────────────────┼────────────────────────┼───────────────────┼──────────────────────┤
│ Paire                             │            4 │          4 │             2 + 2 J │                2 + 2 J │           3 + 2 J │              3 + 2 J │
│ Deux qui se suivent, même couleur │            2 │          2 │             2 + 2 J │                      2 │           2 + 2 J │                    2 │
│ Suite couleur à trou (ex. 4 et 6) │            1 │          1 │             1 + 2 J │                      1 │           1 + 2 J │                    1 │
│ Deux de même couleur              │            7 │          5 │             8 + 2 J │                      8 │           6 + 2 J │                    6 │
│ Deux qui se suivent               │           12 │         12 │             8 + 2 J │                8 + 2 J │          10 + 2 J │             10 + 2 J │
│ Suite à trou (ex. 4 et 6)         │            6 │          6 │             4 + 2 J │                4 + 2 J │           5 + 2 J │              5 + 2 J │
└───────────────────────────────────┴──────────────┴────────────┴─────────────────────┴────────────────────────┴───────────────────┴──────────────────────┘
```

Une paire n'a plus que 2 cartes pour devenir Brelan en 4 couleurs, contre 4 dans
l'original : c'est pour ça que le Brelan recule. Le joker sans couleur aide le Brelan
et la Suite, jamais la Couleur.

## Quatrième angle : des parties entières, jouées par des robots

2 000 parties par variante entre deux robots « gourmands » : chacun pose la carte
qui augmente le plus ses chances de gagner une borne, face à ce que l'adversaire
est en train de construire. Deux vérifications avant de les croire :

- le robot gourmand bat un robot qui joue au hasard dans 98,3 % des parties ;
- deux robots au hasard retrouvent les probabilités exactes du premier angle
  (Suite couleur 1,6 % en jeu, 1,8 % au calcul).

**Même dans l'original, en jeu, la Couleur se construit plus souvent que la Suite**
(37,2 % contre 13,9 %) : on court après ce qui rapporte. Les parties ne
servent donc pas à classer les combinaisons, mais à mesurer si le jeu *ressemble* à
l'original : on compare, rang par rang, la part des bornes gagnées par la 1re
combinaison de l'ordre, la 2e, etc. 100 % = même profil que l'original.

```text
                         Bornes gagnées, par rang de la combinaison  Ressemb.
Original 6×9             ████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░··  100,0 %
Rapide 6×7               █████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒░░░░···   90,1 %
4 coul., joker libre     ██████████▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░···   74,5 %
4 coul., 1 joker/borne   ██████████▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░···   75,0 %
4 coul., joker s. coul.  ████▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░··   90,8 %
Tarot, joker libre       ██████████▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░··   84,9 %
Tarot, joker s. coul.    ████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░··   97,2 %

██ 1re   ▓▓ 2e   ▒▒ 3e   ░░ 4e   ·· Somme
```

```text
┌─────────────────────────┬──────────┬───────────────────┬──────────────────────┬─────────────────┬───────────────┐
│ Variante                │ Ressemb. │ Bornes à la somme │ Plus de jokers gagne │ 2e joueur gagne │ Cartes posées │
├─────────────────────────┼──────────┼───────────────────┼──────────────────────┼─────────────────┼───────────────┤
│ Original 6×9            │  100,0 % │            27,7 % │                    — │          56,8 % │          51,1 │
│ Rapide 6×7              │   90,1 % │            25,1 % │                    — │          55,1 % │          40,0 │
│ 4 coul., joker libre    │   74,5 % │            33,4 % │               74,8 % │          55,4 % │          40,0 │
│ 4 coul., 1 joker/borne  │   75,0 % │            32,9 % │               76,3 % │          54,8 % │          40,0 │
│ 4 coul., joker s. coul. │   90,8 % │            30,4 % │               65,6 % │          54,8 % │          39,9 │
│ Tarot, joker libre      │   84,9 % │            27,4 % │               73,3 % │          56,1 % │          39,9 │
│ Tarot, joker s. coul.   │   97,2 % │            27,4 % │               61,3 % │          56,1 % │          40,0 │
└─────────────────────────┴──────────┴───────────────────┴──────────────────────┴─────────────────┴───────────────┘
```

Le second joueur gagne un peu plus souvent partout, original compris (43,3 %
pour le premier) : c'est le jeu, pas les cartes. Le joueur qui a posé le plus de
jokers gagne souvent : 2 jokers sur 42 cartes pèsent lourd. Le joker sans couleur
réduit cet avantage.

## Toutes les variantes testées en 4 couleurs

Ressemblance avec l'original, pour chaque règle de joker et chaque ordre :

```text
┌────────────────────┬─────────────────┬────────────────────────────┬─────────────────────┬───────────────────┐
│                    │ Ordre d'origine │ Brelan avant Suite couleur │ Suite avant Couleur │ Les deux échanges │
├────────────────────┼─────────────────┼────────────────────────────┼─────────────────────┼───────────────────┤
│ Joker libre        │          74,5 % │                     73,9 % │              76,0 % │            74,6 % │
│ 1 joker par borne  │          75,0 % │                     75,4 % │              76,0 % │            75,5 % │
│ Joker sans couleur │        ★ 90,8 % │                     68,1 % │              89,3 % │            70,2 % │
└────────────────────┴─────────────────┴────────────────────────────┴─────────────────────┴───────────────────┘
```

Changer l'ordre ne rattrape pas un joker libre (les résultats bougent de un ou deux
points). C'est la règle du joker qui fait la différence. Et avec le joker sans
couleur, échanger Brelan et Suite couleur coûte 23 points : gardez l'ordre d'origine.

Et « 1 joker maximum par joueur » ? Le second joker reste coincé en main : 12,0 %
des parties se terminent sans vainqueur. À éviter.

## La règle retenue

```text
╔═ 4 COULEURS · JOKER SANS COULEUR ══════════════════════════════════════════════╗
║ Paquet   52 cartes sans Valets, Dames ni Rois (As = 1), + les 2 jokers = 42    ║
║ Joker    vaut le chiffre de votre choix, mais n'a pas de couleur               ║
║ Ordre    Suite couleur > Brelan > Couleur > Suite > Somme                      ║
║ Partie   7 bornes · 6 cartes en main · 4 bornes, ou 3 côte à côte, pour gagner ║
║                                                                                ║
║ Ressemblance avec l'original ███████████████████████████▎ 90,8 %               ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

## Comment c'est calculé

- Mains de 3 cartes : **toutes** comptées (calcul exact). Un joker prend la meilleure
  valeur possible pour sa ligne.
- Mains de départ : 200 000 mains de 6 tirées au hasard par paquet.
- Parties : 2 000 par variante, robot contre robot, graine 20260922 (rejouable à l'identique).
- Simplification : une borne se règle quand les deux côtés ont 3 cartes. La
  revendication anticipée (« je prouve que tu ne peux plus me battre ») n'est pas simulée ;
  elle change le moment où l'on gagne une borne, pas les combinaisons que l'on construit.

Détails et limites : `docs/methode.md`. Tout se recalcule avec `npm run build`.
