# Schotten Totten en cartes classiques — les chiffres

> Généré par `npm run build` · graine 20260922 · 2 000 parties par variante.
> Aucun chiffre de ce fichier n'a été tapé à la main.

On compare quatre façons de jouer : l'**original** (6 couleurs × 1-9, 9 bornes), ta
version **rapide** (6 couleurs × 1-7, 7 bornes), le **4 couleurs** (jeu de 52 cartes :
As à 10 + 2 jokers) et le **tarot** (4 couleurs + les atouts, de 1 à 8, + 2 atouts libres).

## Le verdict

```text
╔═ LE VERDICT ═══════════════════════════════════════════════════════════════════╗
║ ♠ 4 couleurs × 1-10 + 2 jokers : OUI, à une condition —                        ║
║   le joker vaut le chiffre qu'on veut, mais n'a PAS de couleur.                ║
║ ♥ Avec cette règle, l'ordre d'origine reste juste : rien à réordonner.         ║
║ ♦ Ressemblance avec l'original : 94,5 %, la plus haute de toutes               ║
║   les variantes (ta version rapide : 93,0 %, le tarot : 89,6 %).               ║
║ ♣ Avec un joker « libre », aucun ordre ne tient et la Suite couleur            ║
║   gagne 1,5 fois plus de bornes que dans l'original. À éviter.                 ║
║ ★ Tes 140 colonnes jouées pour de vrai confirment le tableau. Tes habitudes    ║
║   et tes idées rendent le robot plus fort : 65 % de victoires contre l'ancien. ║
╚════════════════════════════════════════════════════════════════════════════════╝
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

2 000 parties par variante entre deux robots « stratèges » : chacun pose la carte
qui augmente le plus ses chances de gagner une borne, face à ce que l'adversaire
est en train de construire, et suit en plus tes habitudes et tes idées (voir plus bas).
La colonne « Ancien robot » donne la ressemblance obtenue avec la première version,
sans tes habitudes. Deux vérifications avant de croire ces parties :

- le robot stratège bat un robot qui joue au hasard dans 99,4 % des parties ;
- deux robots au hasard retrouvent les probabilités exactes du premier angle
  (Suite couleur 1,8 % en jeu, 1,8 % au calcul).

**Même dans l'original, en jeu, la Couleur se construit plus souvent que la Suite**
(30,7 % contre 10,5 %) : on court après ce qui rapporte. Les parties ne
servent donc pas à classer les combinaisons, mais à mesurer si le jeu *ressemble* à
l'original : on compare, rang par rang, la part des bornes gagnées par la 1re
combinaison de l'ordre, la 2e, etc. 100 % = même profil que l'original.

```text
                         Bornes gagnées, par rang de la combinaison  Ressemb.
Original 6×9             ████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒░░░·  100,0 %
Rapide 6×7               █████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒░░░··   93,0 %
4 coul., joker libre     █████████████▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒░░···   83,7 %
4 coul., 1 joker/borne   ████████████▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒░░···   86,3 %
4 coul., joker s. coul.  ████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒░░··   94,5 %
Tarot, joker libre       ████████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒░░···   86,2 %
Tarot, joker s. coul.    █████████▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒░··   89,6 %

██ 1re   ▓▓ 2e   ▒▒ 3e   ░░ 4e   ·· Somme
```

```text
┌─────────────────────────┬──────────┬──────────────┬───────────────────┬──────────────────────┬─────────────────┬───────────────┐
│ Variante                │ Ressemb. │ Ancien robot │ Bornes à la somme │ Plus de jokers gagne │ 2e joueur gagne │ Cartes posées │
├─────────────────────────┼──────────┼──────────────┼───────────────────┼──────────────────────┼─────────────────┼───────────────┤
│ Original 6×9            │  100,0 % │      100,0 % │            25,9 % │                    — │          54,9 % │          51,0 │
│ Rapide 6×7              │   93,0 % │       89,7 % │            22,8 % │                    — │          56,0 % │          40,0 │
│ 4 coul., joker libre    │   83,7 % │       75,2 % │            25,6 % │               74,0 % │          52,7 % │          40,2 │
│ 4 coul., 1 joker/borne  │   86,3 % │       76,2 % │            24,6 % │               76,5 % │          50,8 % │          40,3 │
│ 4 coul., joker s. coul. │   94,5 % │       91,0 % │            26,8 % │               70,3 % │          54,8 % │          39,8 │
│ Tarot, joker libre      │   86,2 % │       84,6 % │            23,1 % │               74,4 % │          51,6 % │          40,3 │
│ Tarot, joker s. coul.   │   89,6 % │       95,5 % │            22,3 % │               66,0 % │          55,0 % │          39,8 │
└─────────────────────────┴──────────┴──────────────┴───────────────────┴──────────────────────┴─────────────────┴───────────────┘
```

Le second joueur gagne un peu plus souvent dans toutes les variantes du tableau, original
compris (45,1 % pour le premier) : c'est le jeu, pas les cartes. Le joueur qui a posé le plus de
jokers gagne souvent : 2 jokers sur 42 cartes pèsent lourd. Le joker sans couleur
réduit cet avantage.

## Toutes les variantes testées en 4 couleurs

Ressemblance avec l'original, pour chaque règle de joker et chaque ordre :

```text
┌────────────────────┬─────────────────┬────────────────────────────┬─────────────────────┬───────────────────┐
│                    │ Ordre d'origine │ Brelan avant Suite couleur │ Suite avant Couleur │ Les deux échanges │
├────────────────────┼─────────────────┼────────────────────────────┼─────────────────────┼───────────────────┤
│ Joker libre        │          83,7 % │                     66,8 % │              81,4 % │            64,1 % │
│ 1 joker par borne  │          86,3 % │                     66,4 % │              83,1 % │            64,2 % │
│ Joker sans couleur │        ★ 94,5 % │                     64,8 % │              92,1 % │            64,5 % │
└────────────────────┴─────────────────┴────────────────────────────┴─────────────────────┴───────────────────┘
```

Aucun ordre ne rattrape un joker libre : le meilleur plafonne à 86,3 %. C'est la
règle du joker qui fait la différence. Et avec le joker sans couleur, échanger Brelan
et Suite couleur coûte 30 points : gardez l'ordre d'origine.

Et « 1 joker maximum par joueur » ? Le second joker reste coincé en main : 10,8 %
des parties se terminent sans vainqueur. À éviter.

## Cinquième angle : tes parties en vrai

10 photos, 140 colonnes de 3 cartes, jouées seul avec le jeu de 52 cartes et le
joker sans couleur (transcription : `data/irl/essais.json`). Pour comparer ce qui est
comparable, les robots ont rejoué **le même protocole** : une moitié de 21 cartes, main de
6, sept colonnes, personne à battre ; la ligne du haut à l'aveugle, celle du bas en
voyant l'autre moitié (2 000 parties par robot).

```text
┌───────────────┬────────┬───────────────┬───────────────┬───────────────┬───────────────┬─────────────┐
│ Combinaison   │    Toi │ Ta fourchette │ Stratège seul │ Gourmand seul │ Partie à deux │ 3 au hasard │
├───────────────┼────────┼───────────────┼───────────────┼───────────────┼───────────────┼─────────────┤
│ Suite couleur │ 28,6 % │   22 % – 37 % │        16,7 % │        15,8 % │        11,4 % │       0,3 % │
│ Brelan        │ 21,4 % │   15 % – 29 % │        24,0 % │        23,9 % │        25,9 % │       1,7 % │
│ Couleur       │ 31,4 % │   24 % – 40 % │        28,9 % │        27,6 % │        35,7 % │       3,9 % │
│ Suite         │  3,6 % │     2 % – 8 % │         8,0 % │         9,5 % │         7,3 % │       8,9 % │
│ Somme         │ 15,0 % │   10 % – 22 % │        22,4 % │        23,2 % │        19,7 % │      85,2 % │
└───────────────┴────────┴───────────────┴───────────────┴───────────────┴───────────────┴─────────────┘
```

- **Tu fais bien plus de Suites couleur que le robot** : 28,6 % de tes colonnes (ta
  fourchette à 95 % va de 22 % à 37 %), contre 16,7 % pour le robot stratège. Moins de
  Sommes aussi : 15,0 % contre 22,4 %.
- **Tu joues mieux que lui.** Avec les mêmes 21 cartes, le meilleur rangement possible (calculé
  exactement) vaut 100 : tu atteins 90 %, le robot 78 %.
- **Tes 20 jokers ont tous fini en Brelan** ; ceux du robot stratège aussi, à 94 %.
- Les chiffres de la partie à deux ne sont pas comparables tels quels : là, on joue contre
  quelqu'un, et une borne perdue n'appelle plus de belles cartes.

Ligne du haut (à l'aveugle) et ligne du bas (en voyant l'autre moitié) :

```text
┌───────────────┬───────────┬──────────┬─────────────┬────────────┐
│ Combinaison   │ Toi, haut │ Toi, bas │ Robot, haut │ Robot, bas │
├───────────────┼───────────┼──────────┼─────────────┼────────────┤
│ Suite couleur │    31,4 % │   25,7 % │      15,1 % │     18,3 % │
│ Brelan        │    15,7 % │   27,1 % │      24,2 % │     23,7 % │
│ Couleur       │    37,1 % │   25,7 % │      29,2 % │     28,6 % │
│ Somme         │    14,3 % │   15,7 % │      23,8 % │     21,0 % │
└───────────────┴───────────┴──────────┴─────────────┴────────────┘
```

Avec 10 lignes de chaque sorte (70 colonnes), tes écarts entre haut et bas restent
dans le bruit : les fourchettes se recouvrent.

**Ton impression, vérifiée par le robot sur le même protocole :**

```text
┌──────────────────────┬────────────────────┬────────────┐
│ Robot stratège, seul │ 4 couleurs + joker │ Rapide 6×7 │
├──────────────────────┼────────────────────┼────────────┤
│ Suite couleur        │             16,7 % │     17,6 % │
│ Brelan               │             24,0 % │     35,4 % │
│ Couleur              │             28,9 % │     16,2 % │
└──────────────────────┴────────────────────┴────────────┘
```

La Couleur est bien plus présente en 4 couleurs, et le Brelan en version rapide : c'est
confirmé. Les Suites couleur, elles, sortent à peu près autant dans les deux : si elles te
semblent plus faciles ici, c'est sans doute ta façon de jouer, pas le paquet.

## Tes stratégies dans le robot

Chaque habitude a été ajoutée seule, puis les trois ensemble, puis deux de tes idées tirées
des parties contre les robots : les trois bornes du milieu réservées à un départ solide
(Brelan en main, ou deux cartes de même couleur qui se suivent, bouts libres), et jamais
la même valeur seule sur deux bornes. Le robot ainsi modifié a joué contre l'ancien
(le « gourmand »), des deux côtés de la table :

```text
┌─────────────────────────────────────────┬─────────────────┬───────────────────┬─────────┐
│ Habitude                                │ Parties gagnées │ Fourchette à 95 % │ Parties │
├─────────────────────────────────────────┼─────────────────┼───────────────────┼─────────┤
│ Garder le joker pour un Brelan          │          53,5 % │   51,9 % – 55,0 % │   4 000 │
│ Ouvrir au milieu, une couleur à la fois │          52,5 % │   51,0 % – 54,0 % │   4 000 │
│ Suite couleur plutôt que paire          │          53,3 % │   51,8 % – 54,9 % │   4 000 │
│ Les trois ensemble                      │          57,7 % │   56,2 % – 59,2 % │   4 000 │
│ Les trois, plus tes deux idées          │          65,1 % │   63,6 % – 66,6 % │   4 000 │
└─────────────────────────────────────────┴─────────────────┴───────────────────┴─────────┘
```

**Était-ce déjà pris en compte ?** En partie : l'ancien robot comptait déjà les cartes
encore cachées (d'où ton « tant que la couleur n'est pas épuisée ») et hésitait à dépenser
un joker. Mais chacune de tes habitudes le rend plus fort : les trois ensemble le font
gagner 58 % des parties contre l'ancien, et 65 % avec tes deux idées.
C'est donc lui, le « stratège » version 1.1, qui joue désormais toutes les parties de ce rapport.

## La règle retenue

```text
╔═ 4 COULEURS · JOKER SANS COULEUR ══════════════════════════════════════════════╗
║ Paquet   52 cartes sans Valets, Dames ni Rois (As = 1), + les 2 jokers = 42    ║
║ Joker    vaut le chiffre de votre choix, mais n'a pas de couleur               ║
║ Ordre    Suite couleur > Brelan > Couleur > Suite > Somme                      ║
║ Partie   7 bornes · 6 cartes en main · 4 bornes, ou 3 côte à côte, pour gagner ║
║ Conseil  gardez le joker pour un Brelan                                        ║
║                                                                                ║
║ Ressemblance avec l'original ████████████████████████████▍ 94,5 %              ║
╚════════════════════════════════════════════════════════════════════════════════╝
```

## Comment c'est calculé

- Mains de 3 cartes : **toutes** comptées (calcul exact). Un joker prend la meilleure
  valeur possible pour sa ligne.
- Mains de départ : 200 000 mains de 6 tirées au hasard par paquet.
- Parties : 2 000 par variante, robot stratège contre robot stratège, graine 20260922
  (rejouable à l'identique).
- Tes parties réelles : transcrites photo par photo ; chaque photo contient bien les 42 cartes.
  Les robots rejouent ton protocole solo 2 000 fois ; le meilleur rangement possible
  d'une ligne est calculé exactement (programmation dynamique sur les 21 cartes).
- Simplification : une borne se règle quand les deux côtés ont 3 cartes. La
  revendication anticipée (« je prouve que tu ne peux plus me battre ») n'est pas simulée ;
  elle change le moment où l'on gagne une borne, pas les combinaisons que l'on construit.

Détails et limites : `docs/methode.md`. Tout se recalcule avec `npm run build`.
