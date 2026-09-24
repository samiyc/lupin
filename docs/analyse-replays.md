# Analyse des 15 parties contre le Stratège

Les 15 parties jouées dans le navigateur les 23 et 24 septembre 2026, toutes contre
le **Stratège 1.0.0**, avec les règles de la fiche. Les chiffres sortent de
`npm run replays`, et les duels de robots de `npm run duel`.

## Les résultats

**Sami gagne 12 parties sur 15 (80 %).**
- 7 victoires par 3 bornes côte à côte, 5 par 4 bornes.
- Les 3 défaites : 3-4, 2-5 et 3-4.
- Sur l'ensemble, Sami prend 64 bornes sur 105 (61 %).

**Un biais à garder en tête : Sami a joué premier dans les 15 parties.** Or jouer
premier est un désavantage. Quand le Stratège joue contre lui-même, le second
joueur gagne environ 54 % des parties, parce qu'il voit le coup adverse avant de
répondre. Les 80 % sont donc obtenus du mauvais côté de la table. Pour la suite,
il faudrait aussi jouer second, pour voir le robot commencer.

## Les combinaisons

| Lignes terminées | Suite couleur | Brelan | Couleur | Suite | Somme |
|---|---|---|---|---|---|
| Sami | 28 (27 %) | 19 (18 %) | 29 (28 %) | 9 (9 %) | 20 (19 %) |
| Robot | 11 (10 %) | 17 (16 %) | 40 (38 %) | 5 (5 %) | 32 (30 %) |

Sami fait **2,5 fois plus de Suites couleur** que le robot. Le robot, lui, se
contente de Couleurs et finit presque une ligne sur trois en simple Somme.

**Les jokers :**
- Sami en a posé 14 : 12 dans un Brelan, 2 dans une Suite.
- Un seul a été posé hors d'une paire, au tour 39 d'une partie. Il ne restait que
  2♠ et le joker en main.

## Où se gagnent les bornes

| Borne | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Gagnées par Sami | 6 | 7 | **12** | **10** | **11** | 10 | 8 |
| Gagnées par le robot | 9 | 8 | 3 | 5 | 4 | 5 | 7 |

**Sami tient le milieu.** Il gagne 33 des 45 bornes centrales. Or toute série de 3
bornes côte à côte passe par au moins une borne du milieu. Ses trois premières
ouvertures vont surtout sur les bornes 3 et 4, puis la 2. Le robot, lui, ouvre
partout.

**La même valeur seule sur deux bornes.** Le robot a 25 fois ouvert une borne avec
une valeur déjà seule sur une autre de ses bornes (deux 7 isolés, par exemple). Il
a perdu 17 de ces bornes, soit 68 %. Sami ne l'a fait que 3 fois. Deux 7 isolés
attendent les mêmes cartes, et l'un des deux Brelans ne viendra pas.

## Le Stratège comme conseiller

Pour chacun des 314 coups de Sami, le lecteur de replays demande au Stratège ce
qu'il aurait joué.
- Il fait le même choix **une fois sur quatre** : 25 % avec le Stratège 1.1, 22 %
  avec le 1.0.
- Les plus grands écarts se ressemblent. En fin de partie, le Stratège voulait
  vider une carte sur la borne 7, alors que Sami jouait au milieu.
- Sami a gagné ces parties-là. Le robot juge chaque borne pour elle-même, sans
  voir qu'une borne du milieu compte dans plus de séries de trois qu'une borne du
  bord.

Les temps de réflexion n'existent pas pour ces 15 parties : le chronomètre a été
ajouté après. Les prochaines parties les auront, et `npm run replays` listera les
coups les plus longs.

## Tes idées, mesurées

Chaque idée a été codée seule dans le robot (`src/sim/ideas.js`), puis opposée au
Stratège 1.0.
- **Protocole** : 8 000 parties par idée, 4 000 de chaque côté de la table. La
  fourchette est d'environ ±1,1 point.
- **Finalistes** : rejoués sur 24 000 parties, à ±0,6 point.
- **Repère** : le Stratège contre lui-même gagne 49,3 %.

| Idée | Contre le Stratège 1.0 | Verdict |
|---|---|---|
| Contrer en second (même formation, un cran au-dessus) | 49,5 % | rien de mesurable |
| Le milieu seulement pour un départ solide | 52,9 % | gagne |
| Les bords quand la main n'est pas prometteuse | 50,1 % | rien de mesurable |
| Pas deux fois la même valeur seule | 55,2 %, puis 56,9 % avec un poids plus fort | gagne nettement |
| **Milieu + valeur seule** (24 000 parties) | **55,6 %** | **retenu : Stratège 1.1.0** |
| Milieu + valeur seule + bords (24 000 parties) | 55,7 % | les bords n'ajoutent rien |

**Pourquoi le contre ne donne rien.** Le robot calcule déjà chaque coup face à ce que
l'adversaire construit sur la même borne. Répondre plus haut que lui fait donc
déjà partie de son calcul. La pénalité pour avoir ouvert une borne vide ne change
rien non plus.

**Pourquoi les bords ne donnent rien.** Dès que le milieu est réservé aux départs
solides, les autres cartes vont déjà sur les bords.

**Le Stratège 1.1.0** garde donc deux idées : le milieu et la valeur seule.
- Il bat le Basique dans 65 % des parties, contre 58 % pour le 1.0 (rapport,
  4 000 parties).
- Il joue désormais toutes les parties simulées du rapport et de la fiche.
- L'Expérimental 0.2.0 repart de lui, à égalité.

**Ce que ça change dans les chiffres.** Dans les parties simulées, le Brelan gagne
maintenant 39 % des bornes, contre 26 % avant. La Couleur passe de 46 % à 31 %.
Le robot joue autrement : sa règle du milieu récompense un Brelan déjà en main,
ce qui explique sans doute une bonne partie de l'écart. La ressemblance avec
l'original passe de 95,2 % à 94,5 %, et reste la plus haute de toutes les
variantes. La fiche de règles a été régénérée avec ces chiffres.

# Deuxième série : 3 parties contre le Stratège 1.1

Les 3 parties du 24 septembre 2026, de 1h57 à 3h, contre le **Stratège 1.1.0**.

| Partie | Sami joue | Résultat | Bornes | Durée |
|---|---|---|---|---|
| 01h57 | premier | gagnée, 3 bornes côte à côte | 6-1 | 6 min |
| 02h49 | second | perdue, 4 bornes | 3-4 | 3 min 30 |
| 02h53 | second | gagnée, 3 bornes côte à côte | 5-2 | 6 min |

**2 victoires sur 3, dont une en second.** C'est trop peu de parties pour conclure,
et l'impression de Sami est la bonne : un niveau « moyen, incertain ».

**Les temps de réflexion** (premières parties chronométrées) :
- 14 s par coup en moyenne ;
- les coups les plus longs sont en fin de partie, quand il faut choisir la borne à
  sacrifier. Le plus long : 83 s au tour 32 de la partie de 02h49, avec
  9♠ 2♥ 1♦ 6♦ 5♣ 10♣ en main, le 10♣ posé en face de 9♣ 9♦.

## Rendre le robot plus fort

**Trois nouvelles idées, sur le Stratège 1.1.** Protocole : 8 000 parties chacune
contre le Stratège 1.1, fourchette ±1,1 point. Le Stratège 1.1 contre lui-même
fait 49,7 %.

| Idée | Réglage | Contre le Stratège 1.1 |
|---|---|---|
| **Poids des bornes** : une borne compte pour le nombre de séries de trois qui la traversent (1-2-3-3-3-2-1) | 0,15 / 0,3 / 0,5 | 50,6 % / 48,8 % / 48,3 % |
| **Séries en jeu** : une borne vaut plus si ses voisines ont l'air gagnables | 0,5 / 1 / 2 | 49,7 % / 48,8 % / 47,8 % |
| **Défausse** : les petites cartes sur une borne qui a l'air perdue | 0,1 / 0,3 | 48,4 % / 45,6 % |
| Réglages internes (température, coût du joker, coût d'une carte haute) | 8 valeurs | de 49,1 % à 50,4 % |

**Aucune ne gagne.** Le robot qui juge un coup à la fois, borne par borne, est au
bout de ce qu'il peut donner. Les réglages ne bougent plus rien.

**Ce qui marche : anticiper.** Avant chaque coup, le nouveau robot :
1. prend les 4 meilleurs coups selon le Stratège 1.1 ;
2. pour chacun, rejoue 16 fois la fin de la partie, en distribuant au hasard les
   cartes qu'il ne voit pas (ta main et la pioche), les deux côtés joués par le
   Stratège 1.1 ;
3. garde le coup qui gagne le plus souvent.

Tous les coups sont rejoués sur les mêmes 16 donnes, pour que la comparaison entre
coups ne se noie pas dans la chance des donnes.

| Anticipation | Contre le Stratège 1.1 | En premier | En second |
|---|---|---|---|
| **4 coups × 16 fins de partie** (800 parties) | **74,4 % ±3,0** | 69,8 % | 79,0 % |
| 6 coups × 16 fins de partie (600 parties) | 77,0 % ±3,4 | 72,0 % | 82,0 % |
| 4 coups × 32 fins de partie (600 parties) | 77,3 % ±3,4 | 74,3 % | 80,3 % |

C'est le plus grand saut depuis le début : trois parties sur quatre contre le
Stratège 1.1. Les réglages plus lourds ne font pas nettement mieux : les
fourchettes se chevauchent, et ils coûtent 1,5 à 2 fois plus de temps. On garde
donc **4 × 16**.

**Le Stratège 2.0.0.** C'est cette version qui joue dans le navigateur.
- **Temps de réflexion** : environ 0,9 s par coup en début de partie, puis de
  moins en moins. Ce temps est compté dans la pause habituelle de 0,7 s.
- **Rapport et fiche** : les statistiques restent jouées par le Stratège 1.1.
  Un million de parties avec anticipation prendrait des jours.
- **Conseiller des replays** : c'est aussi le Stratège 1.1, pour que le lecteur
  s'ouvre immédiatement.
- **Expérimental 0.3.0** : il repart du Stratège 2.0.

## La suite

- **Rejouer contre le Stratège 2.0**, premier et second. Le nom des fichiers
  dit maintenant le score, et `npm run replays` donne tes résultats par version.
- **Pistes pour le robot** :
  - des fins de partie jouées par un robot plus rapide, pour en jouer davantage ;
  - un calcul dans un worker, pour réfléchir plus longtemps sans figer la page.
