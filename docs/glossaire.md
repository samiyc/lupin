# Le glossaire

Les mots qui reviennent dans les mesures du robot Expérimental, et comment se nomment les
versions en essai et les jobs de la file (Sami, 05/10 : être sur la même longueur d'onde). Si
un terme ne parle pas, on le change ici d'abord. Les commandes, elles, sont dans
[commandes.md](commandes.md).

## Comment le robot choisit un coup

- **Le cœur** : la fonction qui note tous les coups possibles d'une position en un éclair (moins
  d'un dixième de milliseconde) : la valeur de chaque côté de borne (le *potentiel*), les chances
  de gagner la borne avant et après le coup, plus des bonus (habitudes et idées). Le cœur du V1
  s'appelle `stfig6`.
- **L'arbre** (ISMCTS) : la recherche qui s'appuie sur le cœur. **« 2 000 simulations par coup »
  (`@2000`) veut dire 2 000 itérations pour choisir UN coup**, pas une partie de 2 000 coups.
  Une itération :
  1. **le tirage** : les cartes qu'on ne voit pas (main adverse, pioche) sont distribuées au
     hasard ;
  2. **la descente** : on part de la position réelle et on descend dans l'arbre de coups —
     à la racine parmi les 8 meilleurs coups selon le cœur (les *candidats*), puis à chaque
     étage parmi ses 3 meilleures réponses (`widen`), sur 5 coups au plus (`depth`) ;
  3. **la simulation** : de là, la partie est jouée jusqu'au bout, vite, le cœur choisissant
     chaque coup des deux joueurs ;
  4. **le retour** : qui a gagné cette simulation est compté sur chaque coup de la descente.

  Après 2 000 itérations, le robot joue le coup de la racine le plus visité. Il a donc joué
  2 000 fins de partie différentes, chacune d'une trentaine de coups.
- **Où sert le cœur dans l'arbre** :
  - **la racine** : une fois par coup, le cœur complet (avec les certitudes) choisit les 8
    candidats ;
  - **les nœuds de l'arbre** : à chaque étage de la descente, il choisit les 3 réponses
    regardées ;
  - **les simulations** : à chaque coup de chaque simulation, soit des dizaines de milliers de
    fois par coup. C'est là que part presque tout le temps, et pourquoi un cœur plus rapide rend
    le robot plus fort (`npm run features`).
- **Itération, simulation** : ici, les deux mots désignent la même chose (une descente et une fin
  de partie jouée). **Coup** : une carte posée. **Tour** : le numéro du coup dans la partie (une
  partie en compte environ 35). **Partie** : une partie entière, du premier coup à la fin.
- **La fin exacte** : quand la pioche est vide et qu'il reste 8 cartes ou moins, il n'y a plus
  rien de caché ; le robot calcule le meilleur coup exactement, sans arbre.

## Mesurer une version

- **V1** : la version à battre, l'Expérimental 1.0 (`ismcts+widen=3+depth=5+core=stfig6`), dans
  le labo à 2 000 itérations par coup depuis le 04/10. On travaille toujours sur la dernière
  version : les nouvelles se nomment par ce qu'elles changent, sans numéro.
- **Le labo** : les parties robot contre robot, hors du jeu. Dans le jeu, le robot réfléchit
  jusqu'à 10 s par coup (environ 13 000 itérations).
- **Une paire** : une même donne jouée deux fois, chaque version commençant une fois. La chance
  des cartes s'y annule en grande partie ; le score d'une paire va de 0 à 1.
- **Un jeu de donnes** (`--offset N`) : une série de donnes tirées d'une graine ; l'offset 0 est
  celui des tris, les offsets 1 à 4 ceux des validations longues (jamais les donnes qui ont fait
  choisir une version).
- **La fourchette à 95 %** : l'intervalle où se trouve très probablement le vrai score. Environ
  ±5,5 points sur 250 parties, ±4,5 sur 400, ±2,7 sur 1 000. **Une version est meilleure quand
  la fourchette basse dépasse 50 %**, sur 1 000 parties.
- **À temps égal** : quand une version est plus rapide ou plus lente par itération (plus de 3 %
  d'écart), elle reçoit le nombre d'itérations qui prend le même temps (`@2200` contre `@2000`),
  ou les deux ont le même temps par coup (`@t3200` : 3,2 s).
- **Les écritures `@`** : `@800`, `@2000` : itérations par coup ; `@t3200` : millisecondes par
  coup ; `1k@2k` : 1 000 parties à 2 000 itérations par coup.
- **L'empreinte** (`npm run fingerprint`) : une signature de tous les coups de parties fixes. Une
  optimisation qui la laisse identique ne change aucun coup : pas besoin de la valider en parties.

## Les étapes d'une validation

Du plus rapide au plus sûr. Aucune étape rapide ne suffit à adopter une version : elles servent
à écarter.

| Terme | Ce que c'est | Durée |
| --- | --- | --- |
| **cœur contre cœur** (`VALIDATE_CORE`) | les deux cœurs jouent seuls, sans arbre, des milliers de parties | ~1 min |
| **le banc** (`VALIDATE_BANC`) | la version joue un coup sur les positions où l'oracle a cherché ; on mesure si elle joue ses coups (banc de similitude, `npm run banc`) | <10 min |
| **validation courte** (`VALIDATE_SHRT`, « tri ») | 400 parties contre le V1 à 2 000 itérations ; écarte une version si le haut de la fourchette est sous 50 % | ~45-55 min |
| **validation longue** (`VALIDATE_LONG`, « 1k@2k ») | 4 duels de 250 parties sur les jeux de donnes 1 à 4, réunis par paires ; décide | ~2 h |

- **Un duel** : une série de parties entre deux versions (`npm run duel`).
- **La règle d'arrêt** (`stopIf`) : une validation longue s'arrête après un 1er duel sous 47 %,
  ou deux réunis sous 50 % ; il est alors presque impossible de finir au-dessus.
- Leçon du 05/10 : une validation courte à 52-53 % ne dit presque rien (10c4r et
  DistOracle1Root y étaient à 52,8 % ; 49,4 % et 51,6 % en validation longue).

## L'oracle

- **L'oracle** : le même arbre que le V1, en beaucoup plus large et plus long (tous les coups à
  la racine, 6 réponses par étage, 20 000 itérations). Trop lent pour jouer, il sert d'étalon.
- **Une position stable** : une position où ses deux recherches choisissent le même coup ;
  avant le tour 10, c'est rare (il hésite).
- **Top 8** : le coup de l'oracle est-il parmi les 8 candidats que le cœur donne à la racine ?
- **Distiller** (`npm run distill`) : régler les poids du cœur pour qu'il mette les coups de
  l'oracle dans son top 8.

## Nommer les versions et les jobs

**Une version** se nomme par ce qu'elle change par rapport au V1, en CamelCase, sans numéro de
version :

| Nom | Ce qu'elle change | Moteur |
| --- | --- | --- |
| `B1Lite1` | le cœur allégé (un côté à une carte vaut sa carte seule) dans les simulations | `…+lite=1` |
| `B1Lite2` | le même, aussi dans les nœuds de l'arbre | `…+lite=2` |
| `DistOracle1Root` | le cœur réglé sur l'oracle, à la racine seulement | `…+shortlist=dist1` |
| `DistOracle1` | le même, partout | `…+core=dist1` |
| `DistOraclePair` | la remise sur une paire réglée sur l'oracle (B3) | `…+core=distpair` |
| `NoConnector` | le V1 sans l'idée `connector` | `…+core=v1nc` |
| `Tree-10c-4r` | l'arbre à 10 candidats et 4 réponses par étage | `ismcts+candidates=10+widen=4…` |
| `EarlyBudget-4000-750` | plus d'itérations aux tours 1-12, moins ensuite, même total | `phase:13:…@4000/…@750` |
| `InferLast3` | la main adverse devinée d'après ses 3 derniers coups | `…+infer=48+memory=3` |

Les optimisations qui ne changent aucun coup (A1 à A4, vérifiées par l'empreinte) n'ont pas de
nom de version : elles profitent à toutes.

**Un job de validation** se nomme en colonnes de largeur fixe à gauche, la version à droite ;
`@` marque une colonne vide :

```
VALIDATE_SHRT_@_B1Lite1           validation courte
VALIDATE_LONG_1_B1Lite1           validation longue, jeu de donnes 1 (sur 4)
VALIDATE_LONG_5_DistOracle1Root   validation longue, jeu de donnes 5 (une deuxième série)
VALIDATE_BANC_@_Tree-10c-4r       banc de similitude
VALIDATE_CORE_@_NoConnector       cœur contre cœur
```

Les autres jobs (construire des positions de l'oracle, mesurer, régler) n'ont pas à suivre ces
largeurs ; seuls les jobs lancés en groupe gardent le même gabarit.

## La file et les réveils

- **La file** (le backlog, `data/backlog.json`) : les jobs joués l'un après l'autre par
  `npm run backlog` ; le lanceur relit la file avant chaque job, on peut en ajouter pendant qu'il
  tourne.
- **Un réveil** : une tâche programmée dans la session de Claude (elle meurt si la console se
  ferme) qui lit les résultats à l'heure prévue, met à jour les docs et le changelog, et fait le
  point.
- **Les fils** (`--threads 18`) : le nombre de calculs en parallèle ; 18 sur les 24 de la machine
  laissent le PC utilisable.
