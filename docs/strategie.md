# La stratégie des robots, et tes principes

Ce que Sami a relevé en relisant ses parties contre les robots, principe par
principe. Chaque principe donne :
- où il se voit (replay et coup du journal) ;
- sa traduction dans le code ;
- son test ;
- ce qu'il a donné en duel.

**Règle de décision** (choix de Sami) : **la mesure tranche**.
- Un principe qui fait gagner le robot entre dans le Stratège.
- Un principe neutre ou perdant reste dans le code comme interrupteur, mais pas
  dans le Stratège.
- Son test de cas reste alors « à faire » (`todo`), avec la raison.

## Tentatives écartées (le code est retiré, git le garde)

Tout ce qui a été essayé pour dépasser le 0.7 puis le 0.8, et n'a pas passé la
règle. Le code a été retiré le 01/10 (« merlin-is-dead ») : `git show eb9d1c0:<fichier>`
le retrouve tel qu'il était, le commit d'origine dit comment il a été fait. Les
mesures détaillées sont plus bas, section par section.

| Idée | Date | Mesure (fourchette à 95 % par paires) | Verdict | Commit d'origine |
| --- | --- | --- | --- | --- |
| Plus de simulations pour le 0.7 (4 000 contre 400) | 30/09 | 37,5 % | sa recherche plafonne ; c'est ce qui a mené à ISMCTS | ffc7267 |
| Simulations à la règle de revendication (0.8-early) | 30/09 | 47,9 % contre le 0.7 | écarté | 0c0f1cf |
| Simulations qui voient une borne perdue (`certainLite`, 0.8-lite) | 30/09 | 53,1 % (47,4 – 58,8) contre le 0.7 | pas net, écarté | 975fc24 |
| Modèle de l'adversaire (donnes pondérées par son dernier coup) | 30/09 | +4,3 % de cartes devinées seulement | écarté sans duel | f14548e |
| Mixture d'experts par phase | 01/10 | 45,8 % (38,4 – 53,3) contre ISMCTS partout | écarté | 28c9ccb |
| Simulations tirées au sort (TLC) | 01/10 | 51,4 % à 400, 50,0 % à 800 | écarté | 52f702a |
| Cas difficiles comme banc d'essai | 01/10 | 5 cas nets en 20 min, sans vérité indépendante | écarté | 52f702a |
| Profondeur 4 et 5 de l'arbre (duels de Sami) | 01/10 | 53,5 % (47,2 – 59,7) chacune ; le 5e coup n'est atteint que par 0,2 % des itérations | la profondeur 3 reste | — |
| Valeur de position apprise, dans l'arbre | 01/10 | 40,3 % (33,1 – 47,4) dès le tour 1 ; 43,8 % dès le tour 15 | écarté | e8dceea |
| Cœur réglé par auto-jeu (SPSA) | 01/10 | 52,9 % seul, mais 50,7 % (42,8 – 58,6) dans l'arbre | écarté | 2207a8d |
| Répertoire d'ouvertures complet (plafond : 1er coup à 5 000) | 01/10 | 45,1 % (37,8 – 52,4) | écarté | 9a8b980, 6c0e13a |
| Répertoire ciblé, mains faibles / fortes | 01/10 | 47,9 % (39,8 – 56,0) / 44,4 % (38,5 – 50,4) | écarté ; le suivi des mains de départ reste | eb9d1c0 |
| Solveur exact dès la pioche vide (+ chercher s'il ne voit pas de victoire) | 01/10 | 47,2 % (40,0 – 54,4) ; 48,6 % | écarté, l'option reste (`+exact`, `+hope`) | bbc1c7e |
| Budget ×4 au point charnière (7 bornes adverses entamées) | 01/10 | 44,8 % (36,4 – 53,2) | écarté, l'option reste (`+pivot`) | bbc1c7e |
| 2 réponses, 5 coups ; RAVE | 01/10 | 47,2 % ; 44,4 % | écartés | bbc1c7e |
| Élargissement progressif sur le 0.9 (6 réponses, 6 coups) | 02/10 | 60,4 % au tri, puis 49,0 % (43,2 – 54,7) au duel long | écarté : le tri était un coup de chance | — |
| Exploration 0,5 sur le 0.9 | 02/10 | 56,9 % au tri, puis 49,0 % (43,5 – 54,5) au duel long | écarté, même leçon | — |
| Élargissement progressif (4 réponses, 5 coups) ; exploration 1,0 ; 6 ou 12 candidats | 02/10 | 45,8 % ; 52,8 % ; 51,4 % ; 47,9 % | écartés | — |
| Deux fois plus d'itérations pour le 0.9 (1 600 contre 800) | 02/10 | 52,1 % (42,9 – 61,3) | pas net : pas de workers dans la page pour l'instant | — |
| Plus de budget après le tour 22, moins avant (au même total) | 02/10 | 45,8 % (×2 / ×0,5) ; 48,6 % (×1,5 / ×0,75) | écarté, l'option reste (`+late`, `+early`) | a1b3de5 |
| Temps qui suit l'incertitude (au même total) | 02/10 | 54,2 % puis 50,0 % ; ≈ 51,7 % réunis | écarté, l'option reste (`+smart`) | a1b3de5 |
| Juger une borne avec ses voisines (`neighbors`) | 02/10 | seul 47,0 % ; depuis le tour 23 +0,8 ± 2,4 ; partie entière 46,9 % | écarté, l'idée reste (`+core=nb1`) | b9cbecc |
| L'arbre sans les bonus du cœur | 02/10 | depuis le tour 23 +0,3 ± 2,6 ; partie entière 42,4 % | les bonus restent : ils servent avant la fin | b9cbecc |
| Fin de partie : cœur nu et 7 coups d'avance, à temps égal (880 itérations) | 02/10 | depuis le tour 22 +0,0 ± 3,3 ; 20 : +1,3 ± 3,2 ; 18 : −2,0 ± 3,5 | écarté ; la bascule reste (`phase:`), le début de partie est au backlog | — |
| Choisir son jeu : brelans ou suites (`plan`, `ends`, `midRuns`, `weakRuns`) | 02/10 | cœur seul de 45,9 % (les quatre) à 50,6 % (joker seul) | écarté sans duel long, les idées restent (`shapes.js`) | — |
| Règles des replays : face à un côté plein, répondre plus bas, à côté d'une borne gagnée | 02/10 | cœur seul 48,0 – 50,6 % | écartées ; `junk` (53 %) va au duel long | — |
| Placer le joker (face à un côté plein, attendre, brelan du milieu) ; `deepen` | 02/10 | cœur seul 49,5 – 50,3 % | écartés : le cœur le fait déjà ; `jokerRuns` +0,8, rien de plus avec `jkx` | — |
| Le piège du joker : une paire morte, joker en main (`jokerTrap`) | 02/10 | cœur seul 49,7 – 50,3 % | neutre entre robots : ils ne lisent pas le signal ; le cœur le joue déjà (2 323 fois dans les replays) | — |
| L'appât : débuts bas hors des zones qui comptent (`bait`) | 02/10 | cœur seul 49,5 – 51,0 % | neutre : l'adversaire mord à peine, la borne appât se perd plus | — |
| `junk`, `obex` et les deux (`jkx`) dans l'arbre du 0.9 | 03/10 | 52,4 % ; 50,5 % ; 51,7 % (deux jeux de donnes réunis) | pas net ; `jkx` prolongé au backlog | — |
| Deux phases (voisinage au début, cœur nu et 7 coups à la fin), partie entière contre le Stratège | 03/10 | −1,3 ± 4,2 pts (bascule au tour 20) ; −2,0 ± 4,3 (1re borne) | écarté | — |
| Imiter l'oracle : répondre moins, ouvrir sans figure, côtés sans figure, jokers libres | 03/10 | cœur seul 38,8 – 50,4 % | écartés ; seul `stay` 0,4 reste (jkxs, au duel long) | — |
| Bonus seulement aux tours 1-10 : junk, obex, jkx, whole, stfig | 03/10 | 47,9 – 52,1 % (arbre, 400 itérations, 10 min) | écartés ; seul stay (55,4 %) va en validation de nuit | — |
| Les bonus du 0.9 (middle, spread, connector, joker, opening, suited) coupés après le tour 10 | 03/10 | 49,0 – 50,9 % (arbre, 400 itérations, 10 min) | neutres : après le tour 10 l'arbre décide | — |
| Les bonus du 0.9 à partir du tour 15 ; connector à partir du tour 11, 15 ou 19 (à temps égal) | 03/10 | 49,0 – 50,9 % ; connector 48,5 – 48,9 % ; suited seulement après 15 : 41,1 % | neutres, sauf suited, qui sert au début | — |
| Simulations tronquées à la première borne décidée (`trunc=5`, `trunc=8`, à temps égal) | 03/10 | 41,1 % ; 45,6 % | écartées : l'estimation au point d'arrêt coûte plus que le temps gagné ; l'option reste (`+trunc`) | — |

## Comment le Stratège choisit un coup

Le Stratège 2 a deux étages :
1. **Le cœur** (`strategist`, version 1.2) note chaque coup possible. Il estime ce
   que devient la borne jouée, face à ce que l'adversaire y construit.
   - Estimation : `sidePotential` dans `src/sim/potential.js`, `moveGain` dans
     `src/sim/bots.js`.
   - La note reçoit ensuite des bonus : les trois habitudes
     (`src/sim/strategist.js`), les idées (`src/sim/ideas.js`) et les principes
     (`src/sim/principles.js`).
2. **L'anticipation** (`src/sim/lookahead.js`) prend les 4 meilleurs coups du
   cœur. Pour chacun, elle rejoue 16 fois la fin de la partie, en distribuant au
   hasard les cartes invisibles, puis garde celui qui gagne le plus souvent.

Depuis la version 2.1, l'anticipation garde aussi une part de l'avis du cœur :
la note d'un candidat est sa part de fins de partie gagnées, plus 0,3 fois sa note
du cœur (`prior`). Seize fins de partie départagent mal deux coups proches, et la
note du cœur porte les habitudes et les principes. Mesure : 54,1 % contre la même
version sans cette part (800 parties, ±3,5).

**Conséquence importante.** Une règle du cœur agit de deux façons sur le 2 :
- elle choisit les 4 candidats ;
- elle fait jouer les fins de partie simulées, où le cœur tient les deux côtés.

Mais une fois les candidats choisis, seules les fins de partie tranchent. Le
Stratège 2 peut donc encore jouer un coup que son cœur évite : un 10 au milieu,
par exemple.

**Protocole des duels.**

| Duel | Parties | Fourchette | Durée |
|---|---|---|---|
| Cœur contre cœur | 8 000 (4 000 de chaque côté) | ±1,1 point | quelques secondes |
| Finalistes, cœur contre cœur | 24 000 | ±0,6 point | — |
| Stratège 2 contre Stratège 2 | 800 | ±3,5 points | environ 20 minutes |

## Les principes

### 1. Une paire de même couleur ne se sépare pas — `connector` ✅ retenu (1.2)

- **Replay** : 12-05, coup 5. Le 8♠ est seul sur la borne 4, le 9♠ en main. Le
  robot ouvre la borne 5 avec le 9♠.
- **Pourquoi c'est grave** : 8♠ 9♠ ouvre 7-8-9 et 8-9-10 à pique, le meilleur score
  possible. Ce sont les meilleures cartes de la main. Garder le 9♠ en main est
  acceptable, et cache la Suite couleur à l'adversaire. Le poser ailleurs la
  détruit.
- **À ne pas confondre** : 9♥ 10♥ n'attend qu'une seule carte, le 8♥.
- **Code** : une pénalité pour poser une carte loin de sa voisine de même couleur
  restée seule sur une autre borne, tant que les deux bouts sont encore possibles.
- **Cause** : l'estimation ne mesure que la borne jouée. Elle ne voit pas que le
  9♠ valait une Suite couleur à la borne 4.
- **Mesure** : 53,9 % contre le Stratège 1.1 (24 000 parties, ±0,6). Le Stratège
  2.1, qui l'embarque, bat le 2.0 dans 55,4 % des parties (800 parties, ±3,4).
- **Test** : réussi par le cœur et par le Stratège 2.

### 2. Les Brelans se jouent — `trips` ✗ non retenu

- **Replay** : 11-28, coups 2 à 16. Le robot a 2♠ 2♥ JK en main dès le départ, puis
  3♠ 3♣ et deux jokers. Il ne joue aucun Brelan.
- **Principe** : jouer un Brelan vide la main et fait piocher.
  - Brelans sur les bornes 2, 3, 5 et 6.
  - Suites couleur au milieu, sur les bornes 3, 4 et 5.
  - Suites et Sommes aux bords, sur les bornes 1 et 7.
- **Rappel** : le joker n'a pas de couleur, il n'aide jamais une Suite couleur.
- **Code** : un bonus pour une carte qui rejoint sa jumelle seule, ou qui ouvre une
  borne 2, 3, 5 ou 6 quand la main tient déjà le Brelan.
- **Mesure** : 51,2 % seul (±1,1), mais 52,6 % avec `connector` contre 53,9 %
  sans. Il affaiblit le cœur.
- **Test** : « à faire ». Piste : le bonus s'applique aussi à des Brelans faibles ;
  ta nuance sur les petites valeurs (principe 6) n'est pas encore codée.

### 3. Pas de bout au milieu — `ends` ✗ non retenu

- **Replay** : 11-28, coup 8. Le 10♥ ouvre la borne 4.
- **Principe** : 10 est un bout, comme 1. Sa Suite couleur ne peut venir que de
  8-9. Au milieu, il faut deux cartes de même couleur qui se suivent, de 2-3 à
  8-9, et leurs deux voisines ne doivent pas être déjà en jeu. Si ces cartes
  partent chez l'adversaire, on se rabat sur une Couleur simple.
- **Code** : une pénalité pour un 1 ou un 10 qui ouvre les bornes 3, 4 ou 5. La
  règle `middle` du Stratège 1.1 couvre déjà le cas des deux cartes qui se
  suivent.
- **Mesure** : 49,9 %, neutre. Avec `connector`, 53,3 % contre 53,9 %.
- **Test** : le cœur l'évite déjà, grâce à `middle`. Le Stratège 2.1 le joue
  encore 4 fois sur 10 (10 graines essayées) : les fins de partie choisissent parmi
  les 4 candidats, et le 10♥ y figure. « À faire » pour lui.

### 4. Garder des bornes libres — `reserve` ✗ non retenu

- **Replay** : 12-05, coup 13. Les 7 bornes du robot sont occupées.
- **Principe** : garder deux bornes vides en début et milieu de partie, une seule
  vers la fin. La pioche peut apporter un Brelan ou une Suite couleur qui ne
  s'accorde avec aucune borne déjà ouverte.
- **Code** : une pénalité pour ouvrir une borne quand il en resterait moins de deux
  libres (moins d'une quand la pioche passe sous 10 cartes).
- **Mesure** : 50,3 %, neutre. Au poids essayé, il ne change pas ce coup-là.
- **Test** : « à faire ».

### 5. Garder l'estimation entière — `whole` (mesuré, non retenu)

- **Principe** (pas de replay précis) : juger un coup sur tout le plateau. Une
  carte qui quitte la main emporte ce qu'elle promettait aux autres bornes.
- **Mesure** : 51,3 % seul. Avec `connector`, 54,4 % contre 53,9 % : l'écart est
  dans le bruit, et le calcul est plus lourd.
- **Suite** : c'est la cause générale du principe 1. Il reste un interrupteur, à
  remesurer avec le Stratège 2.

### 6. Le Brelan avec un joker : bord ou milieu ? — cas « à faire »

- **Replay** : 12-50, coup 10. La main est 4♠ 1♥ 8♥ 1♦ 2♦ JK. Le robot ouvre la
  borne 5 avec le 1♥, pour un Brelan 1-1-JK.
- **Principe** : un Brelan faible ne doit pas bloquer une borne du milieu.
  - **Mieux** : 2♦ vers le 2♠ de la borne 1, pour vider la main. On garde les 8,
    utiles pour départager une Couleur contre une Couleur.
  - **Sinon** : 8♥ vers le 8♣ de la borne 6, si les 6♣ et 9♣ sont déjà joués. La
    Suite couleur est alors impossible, et le Brelan devient la meilleure ligne de
    cette borne.
- **Code** : `ends` (1 au milieu) et `trips` (rejoindre la jumelle) couvrent ce cas.
- **Test** : « à faire ». `trips` affaiblit le cœur, et `ends` seul ne suffit pas à
  changer ce coup.

## Les tests

- **`tests/strategy-cases.test.js`** : chaque cas est rejoué depuis
  `tests/fixtures/replays/`, et vérifié pour le cœur et pour le Stratège 2 (graine
  fixe).
  - On vérifie ce que le robot **ne doit pas** faire, pas un coup unique.
  - Un cas encore raté est `todo` : il s'affiche dans `npm test` sans le faire
    échouer.
- **`tests/ideas.test.js`** : chaque principe sur une position construite à la
  main.

Les numéros de coup sont ceux des journaux. Le compteur du lecteur de replays
affichait le tour suivant ; il affiche maintenant le coup montré.

## Les motifs gagnants prouvés (Expérimental 0.6)

Sami demandait des conditions **déterministes** qui disent, sans calculer toute la
partie, qu'un coup est gagnant ou inutile sur une borne. Le sûr, ce sont les
**certitudes** : la « revendication » de la règle officielle de Schotten Totten,
calculée par énumération (`src/sim/certainty.js`).

- **Borne gagnée d'avance** : mon côté est complet, et aucune façon de finir le
  côté adverse ne le bat. On essaie toutes les cartes que je ne vois pas. En cas
  d'égalité, gagne celui qui a complété en premier, c'est-à-dire moi.
- **Borne perdue d'avance** : leur côté est complet, et aucune façon de finir le
  mien ne le bat, même avec ma main et toutes les cartes que je ne vois pas.

Ce sont des théorèmes, pas des estimations. Le test rejoue 60 parties entières et
vérifie plus de 500 affirmations « gagnée » ou « perdue » faites en cours de
partie : aucune n'est contredite par la fin.

**Ce que l'auto-jeu en dit** (`npm run selfplay` puis `npm run mine`) : 1 136
parties de l'Expérimental 0.5 contre lui-même, en 19 minutes, soit 47 712
décisions.

| Motif | Fréquence | Ce que faisait le 0.5 |
|---|---|---|
| Une borne perdue d'avance est jouable | 30 % des décisions | il y joue 42 % des fois, et **y gâche une carte qui n'est pas la moins chère 28 % des fois** |
| Un coup gagne une borne à coup sûr | 35 % des décisions | il le prend 45 % des fois : ce n'est pas toujours urgent, la borne peut attendre |
| Coup « évident » (le choisi devance le suivant de plus de 15 points) | 13 % des décisions | médiane de l'écart : 4,5 points. La plupart des coups sont serrés, et c'est là que le temps de recherche compte |

**Ce qui en est tiré** :
1. **`certain`, dans le cœur de l'Expérimental.** Sur une borne perdue d'avance, un
   coup ne change rien : il est jugé au prix de la carte jetée, donc la moins chère
   part. Mesure : 52,8 % contre le cœur 1.2 (8 000 parties, ±1,1). Le Stratège ne
   l'a pas encore, pour ne pas relancer le rapport. C'est le prochain candidat pour
   son cœur (1.3).
2. **L'élagage de la recherche** (`search.js`, `prune`) :
   - une seule candidate par borne perdue d'avance, puisque les autres ne font que
     jeter une carte plus chère ;
   - après chaque donne, un candidat dont la meilleure note plausible reste sous la
     pire note plausible du meneur (2,5 écarts-types) sort de la course, sans
     attendre la fin de sa ronde.

   Le temps économisé va aux coups serrés.

   **Un piège trouvé en route** : avec les certitudes aussi dans les fins de partie
   simulées, le 0.6 faisait 35 % de simulations en moins par seconde. Elles ne
   servent qu'à choisir le vrai coup, et les deux versions tournent maintenant à
   la même vitesse (296 simulations par seconde).

**Mesure du 0.6 contre le 0.5**, à budget égal (400 simulations par coup, profil
rapide) : 50 % sur 48 parties avant la correction de vitesse, puis **58 %** sur
72 parties (fourchette 47 – 69 %). Une tendance, pas encore une preuve : entre
deux robots aussi forts, 5 minutes ne suffisent pas.

**Duel long** (`npm run duel -- experimental:400 experimental:0.5 --long`, 240
parties en 23 minutes) : **50,4 %** (fourchette 44,1 – 56,7 %) ; 43 % en
commençant, 58 % en second. **Aucune différence** : à budget égal, le 0.6 est
aussi fort que le 0.5, pas plus. Le 58 % du profil rapide était du hasard. Le
0.6 reste en place pour son jeu plus propre sur les bornes perdues, qui ne coûte
rien. Les gains devront venir d'ailleurs : de plus de simulations par seconde,
ou d'une meilleure politique dans les fins de partie simulées.
3. **« Gagner une borne à coup sûr » n'est pas une priorité prouvée.** Le robot fort
   ne la prend qu'une fois sur deux. Elle reste une information pour le cœur, pas
   une règle.

## Expérimental 0.7 : plus vite, et la fin de partie exacte

Le 0.7 applique les deux pistes laissées par le 0.6 : plus de simulations par
seconde, et une fin de partie calculée au lieu d'être simulée. Tout est mesuré
par `npm run bench`, le nouveau banc d'essai. Il cherche sur les 20 puzzles les
plus difficiles et sur 12 positions de milieu de partie, avec 3 graines, et donne
des médianes.

**Plus vite, sans changer un seul coup.** Le profil montre que 93 % du temps de
recherche passe dans le cœur du Stratège qui joue les fins de partie simulées :
le potentiel des bornes (45 %), la vue de la table (18 %), le décompte des cartes
invisibles (10 %). Quatre corrections, sans toucher au jugement :
- les cartes invisibles comptées dans un tableau plutôt qu'en reconstruisant le
  paquet ;
- l'évaluateur de valeurs gardé d'un coup à l'autre ;
- la main sans la carte appariée lue par index au lieu d'être copiée ;
- des clés numériques pour les mémoires, et plus de `flat()` à chaque coup.

| Mesure | Avant | Après |
| --- | --- | --- |
| Stratège contre Basique, par partie | 8,2 ms | 4,9 ms |
| Expérimental (200 simulations) contre Stratège, par partie | 11,0 s | 6,2 s |
| Milieu de partie, tour 8 | ≈ 200 simul./s | ≈ 345 simul./s |
| Milieu de partie, médiane | 310 simul./s | 548 simul./s |

Les quatre empreintes (`npm run fingerprint`) sont identiques avant et après :
mêmes coups, **1,8 fois plus vite**. Dans les 10 s de la page, c'est 1,8 fois
plus de fins de partie rejouées.

**La fin de partie exacte.** Sur les 20 puzzles les plus difficiles, la recherche
ne trouve le coup gagnant que **30 fois sur 60**, et toujours 0/3 ou 3/3 selon le
puzzle. La pioche vide ne laisse plus rien au hasard des donnes : toutes les
simulations rejouent la même partie, et c'est la politique de simulation, pas le
budget, qui se trompe. Le solveur exact coûte :

| Cartes en main (les deux joueurs) | Règle de revendication | Bornes réglées à la fin |
| --- | --- | --- |
| 8 | 51 ms au plus | 97 ms au plus |
| 9 | 78 ms | 159 ms |
| 10 | 1,7 s | 10,9 s |

Le 0.7 s'en sert dès 8 cartes, avec un arrêt au premier coup gagnant, les coups
essayés dans l'ordre du cœur. Il joue alors le coup gagnant dans **les 44 puzzles
de 8 cartes ou moins** (un test le vérifie). Un premier essai en ratait un : le
cœur écarte d'office certains jokers, et le coup gagnant en était un. Le solveur
reçoit donc tous les coups.

**Mesure contre le 0.6**, profil rapide (400 simulations par coup, 72 parties) :
**56,9 %** (fourchette 45,4 – 67,7 %), 52,8 % en commençant, 61,1 % en second :
**pas de différence nette**. Peu de parties atteignent une fin de partie aussi petite, et le gain
de vitesse ne compte pas à budget de simulations égal. Le vrai gain du 0.7 est
dans la page : 1,8 fois plus de simulations dans les mêmes 10 s, et un jeu
parfait dans les derniers coups.

**Les puzzles « gain immédiat ».** Sous la règle de revendication, un coup peut
rendre la victoire certaine alors que la pioche n'est pas vide. Il faut que, après
ce coup, les bornes prouvables fassent déjà trois côte à côte ou quatre en tout, et
que l'adversaire n'ait pas gagné avant. La preuve n'utilise que les cartes de la
table, donc la main cachée n'y change rien. `npm run puzzles:immediate` en a
trouvé 20 dans l'auto-jeu du Stratège, qui ne voit le coup dans aucun d'eux. Un
test rejoue chaque solution sur 20 donnes différentes des cartes cachées, avec une
réponse au hasard : la victoire tombe à chaque fois.

## Cacher son jeu ? (`npm run hiding`)

**La question** (Sami, après le 0.6) : l'Expérimental cache-t-il sa stratégie en
gardant ses coups forts en main ?

**La réponse** : aucun robot ne se représente ce que l'adversaire devine de sa
main, donc aucun ne cache quoi que ce soit *exprès*. S'il garde une carte qui
finirait une suite couleur ou un brelan, c'est que la recherche juge un autre coup
meilleur maintenant, et que le coup fort restera possible.

**La mesure**, sur les 1 136 parties d'auto-jeu (0.6, bornes réglées à la fin).
À chaque première occasion de finir une borne en suite couleur ou en brelan :

| Choix | Occasions | Formation forte finie | Borne gagnée | Partie gagnée |
| --- | --- | --- | --- | --- |
| Jouée tout de suite | 2 411 | 100 % | 84,7 % | 57,5 % |
| Gardée pour plus tard | 4 627 | 75,1 % | 67,3 % | 55,1 % |
| … puis finie en forte | 3 474 | 100 % | 80,2 % | 57,1 % |
| … jamais finie en forte | 1 153 | 0 % | 28,5 % | 49,0 % |

**Lecture.**
- Il garde **deux occasions sur trois**.
- Quand il finit plus tard, il gagne la partie aussi souvent qu'en jouant tout de
  suite : attendre ne lui coûte presque rien. Cacher son jeu serait donc
  gratuit, mais il ne le fait que par accident.
- Une fois sur quatre, la formation ne se fait jamais, et la borne tombe
  rarement. C'est le vrai coût de l'attente, dans des positions qu'on ne sait pas
  distinguer ici.
- Ce sont des corrélations : il garde sa carte dans d'autres positions que
  celles où il la joue.
- Le vrai jeu caché demande de modéliser ce que l'autre croit : c'est un levier de
  la feuille de route (`out/OLD/roadmap-experimental.html`), pas un acquis du 0.6.
- À refaire sur un auto-jeu du 0.7 : avec la revendication, finir tôt ferme la
  borne et peut arrêter la partie.

## Expérimental 0.8 : ce qui n'a pas marché

La 0.8 travaille la **qualité des simulations**, pas leur nombre : 4 000
simulations par coup ne battent pas 400 (`docs/validation.md`). Chaque candidat
est jugé par un duel long **à la règle de la page** (`npm run duel -- … --long
--page`), et gardé seulement si la borne basse de la fourchette à 95 % dépasse
50 %.

**Candidat 1 : des simulations à la règle de la revendication**
(`experimental:0.8-early`).
- Les simulations réglaient les bornes à la fin (`final`). Elles les règlent
  maintenant dès qu'elles sont pleines et s'arrêtent à la première victoire
  (`early`), comme la revendication le fait pour les bornes pleines. Réglage de
  recherche `rolloutMode`, appliqué aussi pendant la réflexion au tour adverse.
- Solveur exact jusqu'à 9 cartes au lieu de 8.
- Banc d'essai : coup gagnant trouvé 33 fois sur 60 au lieu de 30, même vitesse.
- **Duel long contre le 0.7** : 288 parties en 18 minutes, **47,9 %** (fourchette
  42,2 – 53,7 %). Aucune différence : écarté.
- À noter : dans tous les duels à la règle `early` (toutes les lignes Elo), les
  simulations tournaient déjà en `early`. Ce candidat ne changeait donc que le jeu
  dans la page.

**Au passage**, les moteurs figés `experimental:0.5` et `experimental:0.6`
héritaient du solveur exact du 0.7, parce qu'ils copiaient les réglages courants.
Ils énumèrent maintenant chaque réglage qui les distingue (`FROZEN`, dans
`src/sim/bots.js`).

**Candidat 2 : des simulations qui voient une borne perdue d'un coup d'œil**
(`experimental:0.8-lite`).
- L'idée `certainLite` : une borne est perdue quand l'autre côté est complet, que
  le mien tient deux cartes, et qu'aucune carte encore possible ne finit le mien
  au-dessus. Un seul essai par carte, là où la certitude du 0.6 énumérait toutes
  les fins.
- Choisie par `npm run policy` parmi cinq variantes : elle garde le coup gagnant
  dans 95,3 % des fins de partie décisives (90,0 % des délicates), contre 94,3 %
  (87,5 %) pour le 0.7. La température, le coût des cartes et celui des jokers ne
  bougeaient rien.
- Banc d'essai : coup gagnant trouvé 33 fois sur 60 au lieu de 30, pour 7 % de
  vitesse en moins.
- **Duel long contre le 0.7**, à la règle de la page : 288 parties en 20 minutes,
  **53,1 %** (fourchette 47,4 – 58,8 %). La tendance est pour lui, mais la borne
  basse reste sous 50 % : écarté selon la règle, **le 0.7 reste en place**.

**Ce qu'on en retient.** Deux corrections de la politique, mesurables sur les fins
de partie, ne se voient pas en partie entière : +3 points au mieux. Les simulations
se trompent surtout ailleurs, en milieu de partie, où la politique joue les deux
camps sans rien savoir de la main adverse. La suite de la feuille de route est
donc de **modéliser l'adversaire** : pondérer les donnes par ce qu'il a joué.
`certainLite` reste disponible, et pourra être remesuré avec ce modèle.

## La soirée du 30/09 : tous les leviers au banc

Protocole (`docs/validation.md`) : tri en 10 minutes à 200 simulations, puis
confirmation en 20 minutes à 400 simulations, toujours à la règle de la page et
contre le 0.7. La version ne monte que si la borne basse de la fourchette par
paires dépasse 50 %.

**Tri** (288 parties chacun, 240 pour le modèle) :

| Candidat | Idée | Score | Fourchette par paires |
| --- | --- | --- | --- |
| `ismcts` | recherche en arbre sur 3 coups (levier 4) | 54,5 % | 50,3 – 58,7 % |
| `experimental+sample=0.05` | simulations qui tirent leur coup, peu | 52,8 % | 47,6 – 58,0 % |
| `experimental+model=0.02+tries=24` | modèle de l'adversaire (levier 5) | 51,7 % | 46,1 – 57,2 % |
| `experimental+lite` | borne perdue vue d'un coup d'œil | 51,4 % | 46,4 – 56,4 % |
| `experimental+candidates=12` | 12 coups examinés au lieu de 8 | 50,0 % | 44,8 – 55,2 % |
| `experimental+prior=0.15` | moins de poids au cœur | 49,3 % | 44,1 – 54,5 % |
| `experimental+sample=0.15` | simulations qui tirent leur coup, beaucoup | 47,2 % | 42,0 – 52,4 % |
| `experimental+prior=0.6` | plus de poids au cœur | 45,8 % | 40,9 – 50,8 % |

**Confirmation** (400 simulations, 20 minutes, 288 parties) :
- `ismcts` : **49,0 %** (43,7 – 54,2 %). Le 54,5 % du tri était de la chance :
  sur huit idées triées, une sort au-dessus de 54 % par hasard seul. C'est ce
  que la confirmation sert à attraper.
- `experimental+sample=0.05` : **51,4 %** (45,8 – 56,9 %).
- les trois petites tendances ensemble (`experimental+sample=0.05+model=0.02+tries=24+lite`,
  240 parties) : **44,6 %** (39,0 – 50,1 %). Elles ne s'additionnent pas ; réunies,
  elles nuisent.

**Le modèle de l'adversaire** devine mal la main cachée
(`npm run model`) : +4,3 % de cartes justes au mieux (2,52 sur 6 au lieu de
2,42). Un seul coup de l'adversaire, lu par un cœur qui n'est pas le sien, trahit trop
peu de sa main.

**Ce qu'on en retient.** Aucun levier ne dépasse l'écart que 300 parties
savent mesurer, environ ±5 points. Les leviers bon marché sont épuisés.
- Si le 0.7 peut encore progresser de beaucoup, ce sera par un changement de
  fond : une vraie évaluation apprise par auto-jeu au lieu du cœur écrit à la
  main, ou une recherche en arbre plus profonde et bien plus rapide.
- Sinon, la marge restante est plus petite que ce qu'un duel de 20 minutes
  sait voir.

## Expérimental 0.8 : la recherche en arbre, à 800 simulations (01/10)

**La question** (`evol-exp-070-prompt.md`) : les 400 simulations par coup des
duels brident-elles les nouveaux algorithmes, comme un plafond de verre ?
Personne ne l'avait mesuré pour eux : le duel 4000 contre 400 ne portait que sur
le 0.7, qui ne gagne rien à chercher plus.

| Candidat, contre le 0.7 au même budget | 400 simulations | 800 simulations |
| --- | --- | --- |
| ISMCTS (arbre sur 3 coups) | 49,0 % (43,7 – 54,2) | **56,3 % (51,2 – 62,7)**, 288 parties en deux duels |
| TLC, simulations qui tirent leur coup | 51,4 % (45,8 – 56,9) | 50,0 % (35,6 – 64,4), tri |

- **Le plafond existait pour l'arbre.** À 400, ISMCTS fait jeu égal. À 800, il
  gagne 56 % : son arbre s'approfondit avec les itérations, là où la recherche
  du 0.7 plafonne. Les deux duels de 20 minutes, sur des donnes différentes
  (`--offset 1`), donnent 55,6 % et 56,9 %. Mis en commun, la fourchette par
  paires est de 51,2 – 62,7 % : il passe la règle.
- **À vitesse égale** : 549 itérations par seconde pour ISMCTS, 508 simulations
  pour le 0.7. Dans les 10 s de la page, il en fait 3 000 à 4 500, au-delà des 800
  mesurés.
- **Expérimental 0.8.0 = ISMCTS à 800 itérations** (moteur `ismcts@800`), Elo
  **1504 ± 40** (≈ 1010 depuis que le Basique vaut 500). Le navigateur a trouvé une régression que les tests ne voyaient
  pas : la page cherchait le moteur dans `BOTS`. C'est corrigé (`engineFor`) et
  couvert par un test.

**La mixture d'experts** (moteur `mix:A,B,C`, un expert par phase) :
- ISMCTS au milieu seulement, et le 0.7 au début et à la fin : 62,5 % contre le
  0.7 au tri (48 parties), mais **45,8 % (38,4 – 53,3) contre ISMCTS partout**.
  L'arbre vaut aussi en début et en fin de partie.
- Et le calcul « en trop » est faible : habitudes et idées ne pèsent que 13 à
  16 % du temps du cœur, dans chaque phase. Les couper par phase ne ferait gagner
  que de la vitesse, qui n'est pas la limite.

**Les cas difficiles** (`npm run hard-cases`, `npm run cases`) :
- 20 minutes pour 5 cas nets seulement. Quand le 0.7 hésite, ses coups se valent
  presque toujours pour de bon : 24 fins de partie par coup ne les départagent pas.
- Et la référence vient des simulations de l'Expérimental : elle juge avec son
  regard, et ISMCTS y fait 0 %, alors qu'il gagne plus de parties.
- Un étalon de cas difficiles a besoin d'une vérité indépendante : le solveur en
  fin de partie (puzzles, `npm run policy`), ou des parties entières.

**Le répertoire d'ouvertures** (`npm run openings`, `data/openings/`, ignoré par
git) :
- Clé canonique sur les 24 permutations de couleurs et le miroir des bornes :
  aucun doublon de couleur, 85 µs par lecture.
- Coût : 24 s par ouverture à 2 000 simulations, soit ~56 h pour tout le 1er
  coup (~191 000 ouvertures, 2,2 Mo). Le temps de calcul est la limite, pas la
  taille : 500 Mo ne serviraient qu'aux coups suivants, bien plus nombreux.
- Son coup diffère de celui du jeu en direct dans 35 % des ouvertures, sans preuve
  qu'il soit meilleur. Pour le 0.7, chercher plus ne rapportait rien. Pour
  ISMCTS, qui gagne avec le budget, un répertoire calculé à 5 000 itérations
  restait à essayer : c'est fait plus bas (« Le répertoire : le plafond »), sans
  gain.

## L'étape 2 : apprendre l'évaluation par auto-jeu (01/10, evol-exp-080)

**Pousser l'arbre (étape 1), d'après tes duels longs :**
- Profondeur 4 à 800 itérations : 53,5 % (47,2 – 59,7). Profondeur 5 : 53,5 % aussi.
- Profondeur 4 à 1 600 itérations : 56,3 % (45,5 – 67,0), sur 48 parties.
- Rien n'est net : **la profondeur 3 reste**.
- Le même total (77/144) pour 4 et 5 n'est pas un hasard de code. L'arbre
  n'ajoute qu'un nœud par itération : à 800 itérations, 12 % d'entre elles
  atteignent le 4e coup, et **0,2 %** le 5e. Les deux moteurs jouent presque
  pareil.

**Lot 2 — une valeur de position apprise** (`npm run value`, `src/sim/value.js`) :
- Une régression logistique sur 47 712 positions d'auto-jeu. Elle lit les
  chances du cœur par borne (adoucies : il est trop sûr de lui), traduites en
  chances de gagner la partie, plus les bornes closes, les jokers et la phase.
- Jugée sur des parties qu'elle n'a pas vues (Brier, plus bas = mieux) :

| Prédicteur | tours 1-14 | tours 15-29 | tours 30+ |
| --- | --- | --- | --- |
| pile ou face | 0,250 | 0,250 | 0,250 |
| valeur apprise | 0,250 | 0,232 | 0,148 |
| 8 simulations | 0,288 | 0,227 | 0,025 |
| une simulation | 0,504 | 0,382 | 0,022 |

- Avant le tour 15, personne ne prédit rien. Entre 15 et 29, la valeur vaut
  8 simulations ; après, une seule simulation fait bien mieux.

**Lot 3 — la valeur dans l'arbre** (`ismcts+value=N`, à temps égal, `@t1400`) :
- Juger les feuilles par la valeur est 1,5 à 6 fois plus rapide, mais :
  - dès le tour 1 : **40,3 % (33,1 – 47,4)**, nettement moins bon ;
  - dès le tour 15 : 43,8 % (35,8 – 51,7).
- **Écartée.** Une valeur qui prédit bien en moyenne ne départage pas les coups :
  les simulations, même bruitées, voient les différences entre deux coups
  voisins, la valeur les lisse.

**Lot 4 — régler le cœur par auto-jeu** (`npm run tune`, SPSA) :
- Dix poids du cœur qui joue les simulations, déplacés dans les directions qui
  gagnent des parties cœur contre cœur, sur les mêmes donnes : 240 manches de
  23 sondes en 15 minutes.
- Ce qui bouge le plus :
  - la température, de 0,35 à **0,25** ; elle descendait encore à la fin ;
  - le départ assorti (`suitedStart`), de 0,2 à **0,285** ;
  - l'ouverture au milieu (`openMiddle`), de 0,1 à 0,057.
- Le cœur réglé bat le cœur actuel : **52,9 % (51,7 – 54,0)** sur 6 000 parties.
  Les réglages à la main plafonnaient à +3 points ; le SPSA les règle tous
  ensemble.
- En fin de partie, il ne garde pas mieux le coup gagnant (94,0 % contre
  94,3 %, `npm run policy`) : le gain vient du milieu de partie.

**Lot 5 — valider dans l'arbre** (`npm run duel -- ismcts+core=1@800 ismcts@800 --long --page`) :
- **50,7 % (42,8 – 58,6)**, 144 parties : pas de différence nette. **Le 0.8 reste.**
- Le cœur gagne 3 points quand il joue seul, l'arbre ne les voit pas. À 800
  itérations, ce n'est plus la politique des simulations qui limite : l'arbre
  corrige déjà ses erreurs de milieu de partie.
- Ce qui reste à essayer :
  - régler le cœur **dans l'arbre** (sondes ISMCTS à 200 itérations, bien plus
    lentes que cœur contre cœur) ;
  - laisser le SPSA converger : sa température descendait encore à la fin ;
  - et surtout des **workers dans la page**, puisque le budget, lui, paie.

## Le répertoire d'ouvertures : le plafond d'abord (01/10)

**L'idée de Sami** : faire jouer le Stratège contre le 0.8, calculer en
profondeur les ouvertures des parties que le 0.8 perd, recommencer sur d'autres
donnes, puis opposer un 0.8 avec répertoire au 0.8 sans.

**Le plafond, mesuré avant de calculer** (`ismcts+open=N`) :
- Un 0.8 qui cherche ses premiers coups à 5 000 itérations joue exactement comme
  un 0.8 qui lirait un répertoire **complet** calculé à 5 000.
- 1er coup à 5 000, contre le 0.8 : **45,1 % (37,8 – 52,4)**, 144 parties, règle de
  la page.
- 3 premiers coups de chaque joueur à 5 000 : 39,6 % (27,8 – 51,4), sur
  48 parties seulement : chaque partie coûte trois recherches de près d'une
  minute.
- Aucun gain, et plutôt une tendance contraire. Le coup profond diffère du coup à
  800 deux fois sur trois, sans gagner plus : **au premier coup, les bons coups se
  valent**. Le premier coup est le plus incertain, mais pas le plus décisif :
  presque tout reste à jouer.

**Un lot du processus, pour les vrais chiffres** (`npm run openings`, donnes 0) :
- En 20 minutes, 322 parties où le 0.8 commence contre le Stratège : **121
  perdues (37,6 %)**. À la règle de la page, le Stratège résiste mieux que ses
  Elo ne le disent (mesurés à la règle `early`).
- 121 entrées, 55 s chacune sur un fil quand les 23 tournent ensemble.
- **Recouvrement : 0,06 %** des donnes neuves. Il y a environ 191 000 ouvertures,
  toutes également probables : une position perdue ne revient pas, et le
  répertoire ne sert qu'en proportion de sa taille.
- Tout le 1er coup demanderait environ 130 h à ce rythme, pour un plafond qui ne
  gagne rien.

**Décision : le répertoire est abandonné.** Une erreur ne se reproduit pas parce
qu'on a mémorisé sa position, mais parce que le jugement du robot change : le
cœur, les simulations, ou le budget de l'arbre. Le livre du 0.7
(`data/openings/book-0.7.bin`) et celui de ce lot (`book.bin`, `entries.json`)
restent sur le disque, hors de git.

## Le répertoire ciblé : les mains faibles et les fortes (01/10)

**L'idée de Sami** : ne couvrir que les deux bouts du répertoire. D'un côté, les
mains les plus faibles ; de l'autre, les mains fortes que le robot a perdues
(avec un backlog). Puis en tirer des tendances, un « Merlin des ouvertures ».

**Les classes** (`src/sim/hand-classes.js`, environ 10 % à chaque bout, comptées
exactement sur les 5 245 786 mains) :
- La version stricte des mains faibles (tout sous 6, sans paire ni cartes qui se
  suivent) ne contient **aucune main** : six cartes de cinq valeurs font toujours
  une paire.
- **Faible, 9,9 %** : pas de joker, pas deux cartes de même couleur qui se
  suivent, pas trois d'une couleur, au plus une paire, somme ≤ 36.
- **Forte, 8,9 %** : un départ (paire, cartes de même couleur qui se suivent,
  trois d'une couleur, ou joker), somme ≥ 44.
- Elles prédisent bien : dans les duels ci-dessous, le joueur qui commence avec
  une main faible ne gagne qu'environ 40 % de ses parties.
- `npm run duel -- … --hands weak|strong` ne distribue que ces mains au 1er
  joueur. L'onglet Stats compte les victoires de chacun selon sa main de départ.

**Le plafond par classe** (1er coup à 5 000 itérations, le répertoire complet de
la classe, contre le 0.8 ; 144 parties chacun, règle de la page) :
- mains faibles : **47,9 % (39,8 – 56,0)** ;
- mains fortes : **44,4 % (38,5 – 50,4)**.
- Aucune classe ne gagne. Avec les 45,1 % sur toutes les mains, les trois mesures
  réunies donnent **45,8 % (41,7 – 50,0)** sur 432 parties : chercher le 1er coup
  plus longtemps n'aide pas, et nuit peut-être un peu. Le budget profite à
  l'arbre en milieu de partie, pas au 1er coup.

**Décision** : le répertoire ciblé est écarté, comme le complet. Le backlog des
mains fortes perdues et le Merlin ne sont pas construits : ils apprendraient d'un
coup profond qui ne gagne pas plus que le coup joué. **Reste le suivi des mains
de départ dans l'onglet Stats**, pour ajuster le tir plus tard, par exemple voir
si un robot perd ses mains fortes plus souvent qu'il ne devrait.

## Les points charnières et l'élagage (01/10, merlin-is-dead)

**Quand la partie bascule** (`npm run pivots`, 200 parties entre deux cœurs
expérimentaux, règle de la page) :

| Moment | Tour médian | 10 % – 90 % |
| --- | --- | --- |
| un joueur a une carte sur les 7 bornes | 13 | 13 – 15 |
| les deux joueurs l'ont | 14 | 14 – 18 |
| la 1re borne prouvée | 22 | 18 – 27 |
| le dernier joker posé (170 parties sur 200) | 30 | 22 – 36 |
| la pioche vide | 30 | 30 – 30 |

**Pioche vide = information complète** : la seule donne possible est la vraie.
Le solveur exact, qui ne jouait qu'à 8 cartes au plus (vers le tour 34),
règle en fait **toutes** les positions dès le tour 30 :

| Cartes en main (les deux) | Résolues (400 000 positions au plus) | Temps médian | 90 % sous |
| --- | --- | --- | --- |
| 12 | 100 % | 255 ms | 2,3 s |
| 11 | 100 % | 43 ms | 0,5 s |
| 10 | 100 % | 10 ms | 0,1 s |

**Ce que ça donne en duel** (contre le 0.8, `--long --page`, 20 min) :
- résoudre dès la pioche vide (`ismcts+exact=12@800`) : **47,2 % (40,0 – 54,4)** ;
- la même chose, mais chercher quand le solveur ne trouve pas de victoire
  (`+hope=1` : pour le solveur, tous les coups perdants se valent ; pour un
  adversaire qui peut encore se tromper, non) : 48,6 % (41,1 – 56,1) ;
- budget ×4 au coup qui suit les 7 bornes adverses entamées (`+pivot=4`) :
  44,8 % (36,4 – 53,2), sur 96 parties.
- **Aucun gain.** À 800 itérations, l'arbre joue déjà presque parfaitement la fin
  de partie à information complète : il n'y a rien à reprendre aux tours 30-33.
  Et au tour 13-15, quatre fois plus d'itérations ne changent pas le coup joué.

**Pourquoi les échecs voient 10 coups et plus, et pas nous** :
- Aux échecs, tout est visible. L'alpha-bêta élague à peu près la racine du
  nombre de branches, et une évaluation fiable juge chaque feuille.
- Ici, chaque réponse adverse dépend d'une main cachée, et chaque pioche est
  un tirage : il n'y a pas de valeur exacte à comparer pour élaguer. Et aucune
  évaluation ne prédit avant le tour 15 (mesuré : la valeur apprise ne fait pas
  mieux que pile ou face). L'arbre doit tirer des donnes et jouer jusqu'au bout.
- À 800 itérations, la profondeur 3 compte déjà 8 × 4 × 4 = 128 lignes,
  soit environ 6 visites chacune.

**Les élagages essayés** (tris de 10 min à temps égal, 1,4 s par coup, contre
`ismcts@t1400`) :

| Variante | Ce qu'elle fait | Résultat |
| --- | --- | --- |
| `widen=3+depth=5` | 3 réponses au lieu de 4 sous la racine, 5 coups d'avance | **54,2 % (46,0 – 62,3)** |
| `pw=1+widen=6+depth=5` | élargissement progressif : 1 + √visites réponses, jusqu'à 6 | 52,8 % (45,1 – 60,5) |
| `widen=2+depth=5` | 2 réponses seulement | 47,2 % (39,3 – 55,2) |
| `rave=300` | les statistiques d'un coup partagées partout où il était jouable | 44,4 % (36,3 – 52,6) |

- Élaguer à 2 réponses coupe trop : le bon coup adverse n'est pas toujours dans
  les deux préférés du cœur. À 3, on gagne deux coups de profondeur pour le même
  temps.
- RAVE perd : dans ce jeu, un coup ne vaut pas la même chose un tour plus tôt ou
  plus tard. Ce sont les cartes vues entre-temps qui décident.

**La confirmation** (`npm run duel -- ismcts+widen=3+depth=5@t1400 ismcts@t1400 --long --page --offset 1`) :
- **55,9 % (50,3 – 61,5)**, 288 parties, sur d'autres donnes que le tri.
- Mis en commun avec le tri : **55,3 % (50,7 – 59,9)**, 432 parties. La règle est
  passée : c'est l'**Expérimental 0.9.0** (`ismcts+widen=3+depth=5@800`).
- Même vitesse que le 0.8 (580 contre 588 itérations par seconde,
  `npm run bench`) : chaque itération descend plus loin, mais sur moins de
  branches.
- Classement : 0.9.0 à 1032 ± 33 ce jour-là, 920 après les duels directs (plus bas).
- Le reste du lot ne passe pas : élargissement progressif 52,8 % (proche, à
  retenter combiné au 0.9), RAVE, les points charnières.

## Le classement stabilisé (01/10, duels directs gardés en replays)

Trois duels de 100 parties entre les versions actuelles, à la règle de la page,
toutes gardées dans `duels/` (avec l'avantage au tour 30) :

| Duel | Score | Fourchette à 95 % par paires |
| --- | --- | --- |
| Stratège 2.1 contre Basique | 82 % | 74,2 – 89,8 |
| Expérimental 0.9 contre Basique | 92 % | 86,9 – 97,1 |
| Expérimental 0.9 contre Stratège 2.1 | 60 % | 50,3 – 69,7 |

- **Le classement descend pour les Expérimental** : 0.9.0 à **920 ± 29** (1032
  avant ces duels ; **978 ± 30** le 02/10, une fois les duels réenregistrés avec un
  robot par partie : Stratège–Basique 85 %, 0.9–Basique 95 %, 0.9–Stratège 68 %), 0.8.0 à 892, 0.7.0 à 862, Stratège 2.1 à 811. Ils n'étaient
  reliés aux Stratège que par une chaîne de duels anciens, à la règle `early` et
  à 400 simulations. Le duel direct, à la règle de la page, dit que l'écart est
  plus petit. C'est lui qu'il faut croire.
- **L'avantage au tour 30 décide presque tout** : quand la pioche est vide, le
  camp qui gagne en jeu parfait gagne la partie dans 95 à 99 % des cas, même
  entre robots imparfaits. Les parties se jouent avant le tour 30. C'est là
  qu'un rejeu « à partir du tour 15, un seul changement » a le plus de chances
  de montrer quelque chose.

## Rejouer depuis le milieu, et le prix d'une erreur (02/10, evol-exp-090)

**Le rejeu est fidèle.** Chaque partie gardée construit ses robots à partir de
sa graine. Rejouée depuis la première borne gagnée, elle redonne la même fin,
coup pour coup, dans **100 / 100** parties du 0.9 contre lui-même
(`npm run branch -- --check`). On peut donc changer un seul coup, ou un seul
moteur, sur une position réelle, sans rejouer le début.

**Le piège : le chaos du début de partie.** Forcer une erreur et comparer au
replay gardé donnait des effets absurdes : au tour 2, une erreur « aidait » le
fautif de 20 points. Au début, n'importe quel changement rebat la suite, et la
partie redevient presque pile ou face. Le bon témoin, c'est la même suite
**sans erreur**, avec seulement la graine des robots changée (`reseed`).

**Le prix d'une erreur au hasard** (`npm run error-impact`, 0.9 contre
lui-même, mains moyennes, 30 parties par tour ; qui tient la partie au tour 30,
par le solveur exact) :

| Erreur au tour | Le fautif tient la partie : témoin | avec l'erreur | Impact (± 95 %) |
| --- | --- | --- | --- |
| 2 | 36,7 % | 40,0 % | −3 ± 15 |
| 6 | 56,7 % | 23,3 % | 33 ± 25 |
| 10 | 53,3 % | 30,0 % | 23 ± 22 |
| 14 | 43,3 % | 40,0 % | 3 ± 20 |
| 18 | 26,7 % | 36,7 % | −10 ± 20 |
| 22 | 40,0 % | 20,0 % | **20 ± 15** |
| 26 | 40,0 % | 16,7 % | **23 ± 15** |
| 29 | 66,7 % | 46,7 % | **20 ± 15** |
| au coup qui entame la 7e borne | 53,3 % | 43,3 % | 10 ± 17 |
| au coup qui gagne la 1re borne | 46,7 % | 23,3 % | **23 ± 15** |

- **Au premier coup, une erreur ne coûte rien de mesurable**, comme l'avaient
  montré les essais de répertoire.
- **À partir du tour 22, et au coup qui gagne la première borne, une erreur
  coûte nettement** : un cinquième des parties changent de camp. C'est la
  phase où les bornes se décident. C'est là qu'un meilleur jugement paierait,
  et là qu'il faut tester les prochains changements (`npm run branch --
  --from first-border`).
- Entre les tours 6 et 18, 30 parties par tour ne suffisent pas à trancher : il
  en faudrait environ 120 pour une fourchette de ± 10.

## Les pistes du 0.9 (02/10, evol-exp-090)

**Tris de 10 min à temps égal (1,4 s par coup) contre le 0.9** :

| Variante | Tri | Duel long, autres donnes |
| --- | --- | --- |
| élargissement progressif, 6 réponses, 6 coups | 60,4 % (53,2 – 67,7) | **49,0 % (43,2 – 54,7)** |
| exploration 0,5 | 56,9 % (49,4 – 64,5) | **49,0 % (43,5 – 54,5)** |
| la même exploration, sur l'élargissement progressif | 56,9 % (50,7 – 63,2) | — |
| exploration 1,0 | 52,8 % | — |
| 6 candidats à la racine | 51,4 % | — |
| 12 candidats | 47,9 % | — |
| élargissement progressif, 4 réponses, 5 coups | 45,8 % | — |

- **La leçon** : en triant 6 variantes sur les mêmes 144 parties, la meilleure
  sort à 57-60 % par hasard. Les deux confirmations, sur d'autres donnes,
  retombent à 49 %. Un tri ne désigne qu'un candidat ; seul le duel long, sur
  d'autres donnes, décide. Le 0.9 reste.
- **Les workers dans la page attendent.** Deux fois plus d'itérations
  (`0.9@1600` contre `0.9@800`) ne font que 52,1 % (42,9 – 61,3), sur 96
  parties. Paralléliser la recherche sur 8 fils ne paierait pas plus : le 0.9
  plafonne déjà avec ses 800 itérations en duel, et les 10 s de la page lui en
  donnent beaucoup plus.
- **D'autres pistes encore jamais testées** :
  - un temps de réflexion qui suit l'incertitude : s'arrêter tôt quand un coup
    domine, chercher plus quand deux coups se valent ;
  - les transpositions dans l'arbre (deux ordres de coups, une même position) ;
  - un meilleur jugement autour des tours 22 à 29 et de la première borne,
    là où une erreur coûte le plus (`npm run error-impact`) : à tester avec
    `npm run branch -- --from first-border --engine <variante>`, sur les
    positions réelles où le 0.9 a perdu.

## Le tour critique, avec 4 fois plus de parties (02/10)

600 parties de plus du 0.9 contre lui-même, gardées (363 à mains moyennes et
résolues au tour 30). Pour chaque tour, 120 parties ; à chacune, une erreur au
hasard et **deux** témoins sans erreur (`npm run error-impact -- --turns 18-29
--games 120 --explain`).

| Erreur au tour | Le fautif tient la partie : témoins | avec l'erreur | Impact (± 95 %) | Part de son avantage perdue |
| --- | --- | --- | --- | --- |
| 1 | 50,0 % | 50,0 % | 0,0 ± 9,8 | 0 % |
| 2 | 47,1 % | 55,0 % | −7,9 ± 9,3 | — |
| 3 | 50,8 % | 45,8 % | 5,0 ± 10,3 | 10 % |
| 4 | 52,5 % | 50,8 % | 1,7 ± 9,8 | 3 % |
| 5 | 50,8 % | 47,5 % | 3,3 ± 10,0 | 6 % |
| 6 | 51,7 % | 39,2 % | 12,5 ± 9,4 | 24 % |
| 7 | 46,3 % | 40,0 % | 6,3 ± 9,7 | 14 % |
| 8 | 50,8 % | 41,7 % | 9,2 ± 9,5 | 18 % |
| 9 | 45,8 % | 39,2 % | 6,7 ± 10,2 | 15 % |
| 10 | 51,7 % | 33,3 % | **18,3 ± 9,6** | 35 % |
| 11 | 50,8 % | 33,3 % | **17,5 ± 8,6** | 34 % |
| 12 | 48,8 % | 43,3 % | 5,4 ± 9,8 | 11 % |
| 13 | 54,2 % | 36,7 % | **17,5 ± 10,1** | 32 % |
| 14 | 45,8 % | 32,5 % | 13,3 ± 9,7 | 29 % |
| 15 | 57,1 % | 29,2 % | **27,9 ± 9,3** | 49 % |
| 16 | 38,3 % | 25,8 % | 12,5 ± 8,1 | 33 % |
| 17 | 62,5 % | 35,8 % | **26,7 ± 8,9** | 43 % |
| 18 | 37,9 % | 35,0 % | 2,9 ± 8,1 | 8 % |
| 19 | 64,6 % | 35,8 % | **28,7 ± 8,7** | 44 % |
| 20 | 37,5 % | 24,2 % | 13,3 ± 8,2 | 35 % |
| 21 | 57,9 % | 38,3 % | **19,6 ± 7,6** | 34 % |
| 22 | 44,2 % | 29,2 % | 15,0 ± 8,1 | 34 % |
| 23 | 57,9 % | 33,3 % | **24,6 ± 8,6** | 42 % |
| 24 | 42,1 % | 24,2 % | 17,9 ± 8,1 | 43 % |
| 25 | 61,7 % | 30,8 % | **30,8 ± 8,1** | 50 % |
| 26 | 36,7 % | 27,5 % | 9,2 ± 7,1 | 25 % |
| 27 | 64,2 % | 31,7 % | **32,5 ± 8,7** | 51 % |
| 28 | 36,3 % | 28,3 % | 7,9 ± 5,7 | 22 % |
| 29 | 64,2 % | 42,5 % | **21,7 ± 7,4** | 34 % |
| au coup qui entame la 7e borne (100) | 48,0 % | 38,0 % | 10,0 ± 10,3 | 21 % |
| au coup qui gagne la 1re borne (100) | 51,0 % | 32,0 % | **19,0 ± 8,2** | 37 % |

- **Seules les toutes premières erreurs ne coûtent rien** (tour 2). Dès le
  tour 6, une erreur au hasard coûte 10 à 20 points. **La zone la plus chère va
  du tour 19 à la pioche vide**, avec un sommet aux tours 23-27 : le fautif y
  perd **un tiers à la moitié** de ses chances de tenir la partie au tour 30.
  Le coup qui gagne la 1re borne (19 ± 8) est un vrai tour charnière ; celui
  qui entame la 7e borne l'est moins (10 ± 10).
- Réunis par paires de tours, pour effacer l'effet du siège : 18-19 : 15,8 ;
  20-21 : 16,5 ; 22-23 : 19,8 ; 24-25 : 24,4 ; 26-27 : 20,9 ; 28-29 : 14,8.
- **Les tours impairs coûtent plus que les pairs** : ce sont ceux du joueur qui
  a commencé. Dans ces parties, il tient l'avantage plus souvent (58-65 % chez
  les témoins, contre 36-44 % pour l'autre), et l'on perd plus quand on a plus à
  perdre. Rapporté à son avantage, l'écart se resserre (34-51 % contre 22-43 %).
- **Ce qui distingue une erreur qui coûte** (`--explain`) : presque rien de
  visible dans les traits mesurés. Seul signe, un peu plus de jokers en main
  (0,80-0,85 contre 0,65-0,68) : une erreur au hasard gâche parfois un joker. Le
  coût vient du coup lui-même, pas d'un type de position qu'on saurait filtrer.

**Dépenser plus là où l'erreur coûte** (`+late=K+early=E`, au même budget total
par partie, vérifié : 6 667 itérations par partie à 200 comme le 0.9) :
- ×2 à partir du tour 22, ×0,5 avant : **45,8 % (38,4 – 53,3)** ;
- ×1,5 et ×0,75 : 48,6 % (40,9 – 56,4).
- **Écarté.** Les erreurs coûtent en fin de partie, mais le 0.9 n'en fait pas
  davantage là qu'ailleurs : 800 itérations suffisent déjà, et ce qu'on enlève
  au début se paie.

**Un temps qui suit l'incertitude** (`+smart=1` : un coup s'arrête dès que son
meilleur coup ne peut plus être rattrapé, et l'épargne va aux coups serrés ;
797 itérations par coup en moyenne, contre 800) :
- 54,2 % (45,5 – 62,8) sur 96 parties, puis 50,0 % (42,2 – 57,8) sur d'autres
  donnes ; réunis, environ 51,7 %. **Écarté, pas net.**

**Pour les versions futures** :
- Le 0.9 ne gagne plus rien à redistribuer son calcul (fin de partie, coups
  serrés, points charnières) ni à en ajouter (×2 : 52 %). Sa limite est dans
  ce qu'il évalue, pas dans combien il cherche.
- C'est entre les tours 19 et 29 qu'une erreur coûte le plus. Un nouveau
  jugement (cœur, politique de simulation) se teste d'abord là, sur les
  positions réelles : `npm run branch -- --vs experimental@0.9.0 --from 23
  --engine <variante>`.

## Changer le cœur : voisinage et bonus (02/10, après la rétrospective)

**Les questions de Sami** : juger une borne avec ses voisines aide-t-il l'arbre
à mieux jouer sur la durée ? Les bonus (habitudes, idées) orientent-ils trop la
recherche en amont ?

**Le voisinage** (`neighbors`, `src/sim/ideas.js`) : le gain d'une borne est
multiplié par 1 + λ × son enjeu, c'est-à-dire la somme, sur chaque série de
trois bornes qui la traverse, du produit des chances sur les deux autres. Le
centre et la borne qui complète une série bien partie comptent plus. Il coûte
environ 12 % de vitesse (0,14 ms au lieu de 0,13 pour noter tous les coups ;
500 itérations par seconde au lieu de 556).

**Les cœurs testés** (`CORES`, `src/sim/experimental.js`) : `nb1`, `nb2` (λ = 1, 2),
`runs`, `plain` (le cœur nu, sans habitudes, idées ni certitudes). Dans l'arbre :
`+core=X`, ou un seul rôle avec `+shortlist=X` (les coups examinés) et
`+rollout=X` (les simulations).

**Un nouveau banc d'essai, depuis le tour 23** (`npm run core-test`) : sur les
600 parties gardées du 0.9 contre lui-même, la variante joue un siège puis
l'autre à partir du tour 23 ; le témoin joue les mêmes positions avec le 0.9,
graine changée ; tout est jugé au tour 30 par le solveur exact. Environ 6 min
pour 200 parties. **Il voit une vraie différence** : le Basique, depuis le tour
23, perd 13,8 ± 3,3 points.

| Variante | Seul, contre le cœur du 0.9 | Dans l'arbre, depuis le tour 23 | Partie entière, contre le 0.9 |
| --- | --- | --- | --- |
| voisinage λ = 1 | 47,0 % | +0,8 ± 2,4 | 46,9 % (37,5 – 56,3), 96 parties |
| voisinage λ = 2 | 45,1 % | +1,3 ± 2,7 | — |
| `runs` | 49,2 % | −1,8 ± 2,6 | — |
| cœur nu | 33,2 % | +0,3 ± 2,6 | **42,4 % (34,9 – 49,8)** |
| sans bonus pour les coups examinés | — | −1,3 ± 2,8 | — |
| sans bonus dans les simulations | — | −1,8 ± 3,0 | — |

- **Les bonus n'orientent pas trop la recherche.** Sans eux, le cœur seul
  tombe à 33 %, et l'arbre perd sur une partie entière (42,4 %). En fin de
  partie, ils ne changent rien : depuis le tour 23, l'arbre décide seul, quel que
  soit le cœur.
- **Le voisinage ne paie pas** : moins bon seul, neutre en fin de partie, pas net
  sur une partie entière (en baisse).
- **Où le cœur pèse** : avant le tour 23, quand l'arbre ne voit pas encore la
  fin. C'est là qu'un meilleur jugement servirait ; le banc d'essai peut partir
  plus tôt (`--from 14`, `--from first-border`), au prix d'un bruit plus grand.

## Deux phases : un cœur riche au début, un arbre profond à la fin (02/10)

**L'idée de Sami** : jusqu'au tour 20 environ, un cœur plus riche, qui juge une
borne avec ses voisines, quitte à réduire l'arbre ; ensuite, un cœur aussi
rapide que possible pour que l'arbre aille à 6 ou 7 coups d'avance. Bascule
testée aux tours 18, 20 et 22.

**Le robot à deux phases** (`src/sim/phase.js`) : `phase:<bascule>:<début>/<fin>`,
chaque moitié un moteur ordinaire avec son budget. La bascule est un tour, ou
un événement de la partie : `border` (une première borne gagnée), `board`
(les deux joueurs ont entamé les 7 bornes), `pileN` (N cartes ou moins dans la
pioche).

**Ce que coûte une itération** (ms, positions à graine fixe) :

| Moteur | Tours 4 à 16 | Tours 20 à 26 |
| --- | --- | --- |
| le 0.9 (3 réponses, 5 coups) | 2,51 | 0,86 |
| voisinage, 3 × 5 | 2,79 | 0,98 |
| voisinage, 2 réponses, 4 coups | 2,79 | 0,98 |
| cœur nu, 7 coups | 2,23 | 0,78 |

- **Réduire l'arbre ne libère pas de temps** : presque tout est dans la
  simulation jouée jusqu'au bout, pas dans la largeur ni la profondeur.
- **Le cœur nu ne fait gagner que 9 %** en fin de partie. À temps égal : 720
  itérations au début avec le voisinage, 880 à la fin avec le cœur nu.

**La fin de partie, depuis le tour de bascule** (`npm run core-test`, 200 parties
× 2 sièges, contre le 0.9 au témoin) : depuis 22, +0,0 ± 3,3 ; depuis 20,
+1,3 ± 3,2 ; depuis 18, −2,0 ± 3,5. **Rien** : 10 % d'itérations en plus et
deux coups de profondeur ne changent pas qui tient la partie au tour 30.

**Le début de partie** ne se mesure que sur une partie entière. Le 0.9 et ses
variantes contre le Stratège (`npm run ab`, mêmes donnes, deux sièges) coûtent
un seul camp qui cherche, mais 24 donnes prennent 6 min : un écart de 3 points
demande de l'ordre de 1 000 donnes par variante. C'est au backlog de nuit
(`ab-phase`). Le voisinage sur toute la partie donnait déjà 46,9 %.

**Donner une main forte au Stratège et une faible au robot**, pour équilibrer
le match : écarté pour le test principal. Ramener 68 % à 50 % ne rend la mesure
que 7 % plus sensible, et l'échantillon ne serait plus le jeu normal (une donne
sur 100 environ remplit les deux conditions), justement sur le début de partie
que le nouveau cœur change. Utile en question secondaire : le cœur riche
récupère-t-il mieux d'une main faible ?

## La première carte : surenchérir d'un cran, payer une ouverture (02/10)

**L'idée de Sami, tirée de ses parties** : quand l'adversaire joue sur plus de
bornes que moi, je remplis mes côtés vides de ses bornes avec une carte un cran
au-dessus de la sienne (un 3 contre un 2). Si les deux côtés finissent avec la
même figure (deux brelans, deux suites de même couleur), la somme la plus
haute prend la borne. Et dans l'autre sens, ouvrir une borne vierge offre à
l'adversaire cette même réponse.

**Deux idées** (`src/sim/outbid.js`), qui ne jugent que la première carte de mon
côté. `counter`, plus ancienne, compare des figures et ne joue qu'à partir de
deux cartes :
- `outbid` : sur une borne où l'adversaire a une carte seule et moi aucune, la
  valeur juste au-dessus reçoit un bonus. Avec `outbidWide`, seulement quand
  l'adversaire a entamé plus de bornes que moi.
- `exposure` : ouvrir une borne vierge avec un v coûte en proportion de la
  chance que l'adversaire tienne un v + 1, lue sur les cartes encore invisibles.

**Le cœur seul, contre le cœur du 0.9** (8 000 parties par duel, règle de la
page, fourchette par paires) :

| Cœur | Donnes 0 | Donnes 1 | Donnes 2 |
| --- | --- | --- | --- |
| `ob1` (outbid 0,1) | 50,6 % | 50,5 % | 51,1 % |
| `ob2` (outbid 0,2) | 51,1 % (50,2 – 52,1) | 50,4 % | 51,2 % |
| `ob4` (outbid 0,4) | 50,3 % | — | — |
| `obw2`, `obw4` (seulement en retard de bornes) | 50,3 %, 50,5 % | — | — |
| `ex1`, `ex2`, `ex4` (exposure 0,1, 0,2, 0,4) | 50,3 %, 50,2 %, 48,9 % | ex2 : 49,8 % | ex2 : 50,2 % |
| **`obex`** (outbid 0,2 + exposure 0,2) | **51,2 % (50,2 – 52,2)** | **51,9 % (50,7 – 53,1)** | **51,2 % (50,3 – 52,2)** |

- **`obex` gagne sur les trois jeux de donnes**, environ +1,4 point : petit,
  mais régulier. Les deux idées vont ensemble : `exposure` seule ne fait rien,
  `outbid` seule moins bien.
- **Elles changent vraiment le jeu** (400 parties `obex` contre `exp`) :
  1,17 surenchère par partie au lieu de 0,20 ; 3,3 bornes ouvertes à vide
  au lieu de 3,7, dont 50 % avec un 5 ou moins au lieu de 54 %.
- **La restriction « en retard de bornes »** ne fait pas mieux que la règle
  générale.
- **Reste l'arbre** : un gain du cœur seul ne passe pas toujours dans l'arbre
  (SPSA : 52,9 % seul, 50,7 % dans l'arbre). Deux duels longs
  `ismcts+…+core=obex@800` contre le 0.9 sont au backlog (`duel-obex-0`,
  `duel-obex-1`).

## Choisir son jeu : brelans ou suites de couleur (02/10)

**Les remarques de Sami** :
- Dès qu'une borne est complète de mon côté, il faut choisir son jeu entre les
  suites de couleur et les brelans : on ne peut pas toujours avoir les deux, et
  il est plus facile de finir avec des brelans partout, ou des suites partout,
  qu'avec un mélange.
- Avec une main faible au début, mieux vaut partir sur des brelans que sur des
  suites de couleur basses, qu'une suite plus haute dépassera presque à coup
  sûr.
- Pour mélanger les deux, les brelans vont plutôt aux bouts (1-2, 9-10) et les
  suites au milieu (4-5-6). Un brelan de 5 coupe en deux toutes les suites qui
  passent par le 5 (3-4-5, 4-5-6, 5-6-7), et cela dans trois couleurs.
- Le joker se place plutôt sur un brelan du milieu : il y remplace une vraie
  carte, et le brelan ne bloque plus que deux couleurs.

**Quatre idées** (`src/sim/shapes.js`). Chacune juge un côté de deux ou trois
cartes, dès que sa figure se lit ; une carte seule, avec ou sans joker, peut
encore devenir l'une ou l'autre :
- `plan` : la figure la plus fréquente de mes côtés complets est le plan ; un
  côté qui la suit gagne le poids, un côté qui part dans l'autre sens le perd.
- `ends` : une vraie carte qui bâtit un brelan paie le poids × la part des
  suites qu'il coupe (0 pour 1 et 10, ½ pour 2 et 9, 1 de 3 à 8) ; un joker sur
  un brelan reçoit ce même montant. `endsReal: 0` ne garde que le joker.
- `midRuns` : une suite de couleur gagne le poids au centre des valeurs, et le
  perd autant aux deux bouts.
- `weakRuns` : une suite de couleur basse paie le poids × la hauteur qui lui
  manque (1 − carte haute / 10).

**Le cœur seul, contre le cœur du 0.9** (6 000 à 8 000 parties par duel,
règle de la page, fourchette par paires) :

| Cœur | Poids 0,1 | Poids 0,2 | Poids 0,4 |
| --- | --- | --- | --- |
| `plan` | 49,5 % | 48,0 % (47,0 – 49,1) | 47,7 % (46,6 – 48,7) |
| `ends` | 47,7 % (46,6 – 48,7) | 47,9 % | 47,2 % |
| `ends`, le joker seul | — | 50,6 % ; 50,5 % sur d'autres donnes | 50,2 % |
| `midRuns` | 50,5 % ; 50,3 % et 50,2 % sur d'autres donnes | 50,1 % | — |
| `weakRuns` | 49,5 % | 49,2 % | — |
| les quatre (0,15) | 45,9 % (44,8 – 47,1) | — | — |
| les quatre avec `obex` | 45,5 % (44,3 – 46,6) | — | — |

- **Écarté, pas de duel long.** `plan` et `ends` font nettement perdre ; le
  joker seul et `midRuns` restent dans le bruit (+0,2 à +0,6) ; ensemble, les
  quatre perdent 4 points, et ils effacent le gain de `obex`.
- **Pourquoi, sans doute** : le cœur estime déjà la chance de chaque côté face
  à ce que l'adversaire y bâtit, cartes invisibles comprises, et il sait qu'une
  suite de couleur bat un brelan. Une règle de forme le tire loin de ce calcul.
  Et une partie se gagne avec 4 bornes, ou 3 côte à côte : finir les 7 dans une
  même figure n'est pas le but.
- **Le temps d'un duel cœur contre cœur** : environ 15 ms pour une partie sur
  un fil, à la règle de la page ; 8 000 parties en 13 à 21 s sur les 23 fils,
  backlog de nuit en cours. Une idée à trois poids, confirmée sur deux autres
  jeux de donnes : environ 2 min.

## Des règles tirées des replays (02/10)

**La demande de Sami** : chercher dans les parties gardées des règles de haut
niveau, vraies dans 80 % des parties gagnées, ou des perdues (70 % à défaut).
Pas « un 7 de cœur », mais le moment du coup (la phase, après une borne gagnée
ou perdue, en retard de bornes ouvertes, la main de départ) et ce qu'il fait
(ouvrir une borne vierge, répondre, bâtir un brelan ou une suite de couleur,
jouer face à un côté plein).

**L'outil** : `npm run rules` (`scripts/rules.js`, traits dans
`src/replay/move-features.js`), 10 s sur les 3 248 parties décidées de
`duels/`. Deux lectures :
- **par paires** : dans la même partie, le gagnant le fait-il plus souvent que
  le perdant ? La donne est la même pour les deux, sa chance s'annule surtout ;
- **par partie** : vrai (au moins une fois, ou sur la plupart des coups du
  moment) dans X % des parties gagnées contre Y % des perdues. Une règle vraie
  dans 80 % des gagnées et 80 % des perdues ne dit rien : seul l'écart compte.

Les parties entre robots de même force (3 048) et de force inégale (200, où le
gagnant est surtout le plus fort) sont séparées. Résultats complets :
`data/rules-mining.json`.

**Ce qui ressort, à 70 % et plus** :
- **Aucune règle par paires n'atteint 80 %** ; une dizaine dépasse 70 %.
- **La plupart décrivent la chance ou l'avance, pas un choix** : jouer à côté
  d'une borne gagnée (96 % des gagnées, 69 % des perdues), c'est d'abord en
  avoir gagné une ; jouer un joker en fin de partie (78 % / 48 %), c'est en avoir
  pioché un.
- **Quatre sont des choix**, transformées en idées du cœur (`src/sim/mined.js`) :

| Règle (lecture par paires) | Idée | Poids 0,1 | Poids 0,2 |
| --- | --- | --- | --- |
| le perdant bâtit plus de côtés ni brelan ni suite de couleur (73 % des parties en fin de partie : 59 % de ses coups contre 41 %) | `junk` : un tel côté coûte le poids | 52,8 % | **53,6 % (52,5 – 54,6)** |
| le gagnant joue plus face à un côté adverse plein (92 % / 75 %) | `facing` : bonus | 48,0 % | 48,3 % |
| contre le 0.9, le perdant répond plus bas à une carte seule (73 % ; 25 % de ses coups du début contre 12 %) | `underbid` : malus | 50,3 % | 49,8 % |
| le gagnant joue plus à côté d'une borne gagnée (71 %) | `nextToWon` : bonus | 50,6 % | 50,0 % |

- **`junk` se confirme** : 53,6 %, 52,9 %, 53,0 % sur trois jeux de donnes (au
  poids 0,2 ; 0,3 à 0,6 ne font pas mieux, autour de 52,5 %). C'est le plus gros
  gain du cœur depuis `connector`.
- **Avec `obex`** (cœur `jkx` : junk 0,2, outbid 0,2, exposure 0,2) : 53,6 %,
  54,3 %, 54,7 %. Les deux s'additionnent.
- **`facing` fait perdre** : jouer face à un côté plein est surtout ce qui
  arrive au gagnant, pas ce qui le fait gagner — exactement le piège de la
  corrélation.
- **Au backlog** : deux duels longs pour `jkx`, deux pour `junk` seul, dans
  l'arbre du 0.9, avant ceux de `obex`.

## Les jokers dans les replays, et « présent chez les gagnants, absent chez les perdants » (02/10)

**La lecture de Sami** : une règle « vraie dans 80 % des cas » est un coup que
l'on trouve dans les parties gagnées et presque pas dans les perdues. La mesure
est donc la part des fois où celui qui joue le coup gagne la partie (50 % au
hasard entre robots de même force). `npm run rules` l'affiche en premier.

**Les jokers** (`npm run jokers`, `src/replay/joker-features.js`) : les 4 250
jokers posés dans les 3 048 parties entre robots de même force, lus par ce
qu'ils rejoignent (brelan, suite de couleur, carte seule ; milieu 4-7 ou
bouts), la borne (centre, bord), et ce qu'il y a en face.
- **Celui qui pose un joker gagne 62 % des parties** : tenir un joker est déjà
  un avantage. C'est la base à laquelle comparer un placement, pas 50 %.
- **Le cœur les pose déjà tard et sur des brelans** : 84 % en fin de partie, 92 %
  pour compléter un brelan. L'habitude `joker` ne l'autorise qu'à compléter une
  paire ; aucun joker sur une suite de couleur.
- **Le meilleur placement : face à un côté adverse plein** — la borne est gagnée
  99 % du temps, la partie 74 %. Face à une carte seule ou un début de suite
  adverse : 54 à 55 %. Un joker sur une carte seule, aux bouts : 41 %.
- **Brelan du milieu ou des bouts** : 64 % contre 63 % des parties, 94 % contre
  91 % des bornes. Un léger avantage au milieu, comme le pensait Sami.

**Les idées joker** (`src/sim/joker-ideas.js`) — les premiers bonus qu'un joker
reçoit : `ideasBonus` ne lisait que les vraies cartes. Le volet joker de `ends`,
testé plus haut, n'avait donc jamais joué.

| Idée | Cœur seul, contre le cœur du 0.9 |
| --- | --- |
| `jokerFull` : bonus face à un côté plein (0,1 / 0,2 / 0,4) | 50,0 % / 49,8 % / 49,9 % |
| `jokerWait` : malus tant que le côté adverse est ouvert | 50,0 % / 49,6 % / 49,5 % |
| `jokerMid` : bonus sur un brelan de 4 à 7 | 50,0 % / 49,7 % / 50,2 % |
| `jokerRuns` : le joker peut aussi compléter une suite de couleur | 50,7 %, 50,7 %, 51,0 % sur trois jeux de donnes |
| `jkx` + `jokerRuns` (cœur `jkxr`) | 53,7 %, 54,3 %, 54,2 % : comme `jkx` seul |

- **Le placement ne change rien** : le cœur fait déjà ce que les replays
  montrent (tard, sur un brelan, souvent face à un côté plein).
- **`jokerRuns`** gagne un peu, régulièrement (+0,8), mais n'ajoute rien à `jkx`.

**La lecture de Sami sur tous les coups** :
- **Entre robots de même force, aucune règle n'atteint 80 %, ni 70 % pour un
  choix.** Le plus haut côté gagnant : un joker après une borne gagnée (71 %),
  qui dit l'avance. Côté perdant : jouer à côté d'une borne perdue au milieu de
  la partie (65 %).
- **Entre robots de force inégale** (200 parties), on dépasse 80 % : avec moins
  de bornes ouvertes que l'adversaire, le gagnant pose une 2e carte ou bâtit
  une suite de couleur (80 à 83 %) ; le perdant ouvre encore avec une carte forte
  (86 %). Transformée en idée (`deepen` : une 2e carte quand l'adversaire a
  entamé plus de bornes), elle est neutre (50,0 à 50,3 %) : le 0.9 le fait déjà,
  la règle décrivait l'erreur du Basique.

## Le piège du joker (02/10)

**L'idée de Sami** : avec un joker en main, poser une paire dont les deux
autres cartes sont déjà en jeu. Pour l'adversaire, ce brelan n'aboutira
presque jamais : il part sur une couleur ou une suite. Puis le joker tombe, et
la borne est gagnée.

**Dans les replays** (`npm run jokers`, 3 048 parties entre robots de même
force) — une paire posée avec un joker en main :

| Paire | Nombre | Finie au joker | Borne gagnée | Partie gagnée |
| --- | --- | --- | --- | --- |
| morte (les 2 autres cartes déjà en jeu) | 2 323 | 57 % | 78 % | 60 % |
| vivante | 4 641 | 49 % | 74 % | 58 % |

Le piège arrive souvent (0,76 fois par partie) et paie un peu mieux qu'une
paire vivante : le cœur le joue déjà, sans le savoir, puisqu'il compte le joker
de sa main pour finir la paire.

**En cœur contre cœur** (`jokerTrap`, `src/sim/joker-ideas.js` : bonus pour la
2e carte d'une paire morte, joker en main) : 50,0 %, 50,3 %, 50,2 %, 49,7 % aux
poids 0,1 à 0,8. **Neutre**, et c'est attendu : un robot ne se fait pas piéger.
Le cœur adverse ne lit pas de signal, il compte les cartes invisibles, jokers
compris : une paire morte reste pour lui une menace tant qu'un joker manque.
Le piège joue sur la lecture d'un humain, que seuls des parties contre Sami ou
d'autres joueurs pourraient mesurer.

## Les bornes gagnées avec des cartes faibles : des pièges ? (02/10)

**La question de Sami** : les bornes gagnées avec 1-2-3 ou 1-1-1, que s'est-il
passé ? Des pièges ?

**`npm run weak-wins`** (`scripts/weak-wins.js`) : sur les 18 789 bornes gagnées
des 3 348 parties gardées, **2 928 (16 %)** l'ont été avec des cartes de 1 à 3
seulement (joker admis).

| Ce qui s'est passé | Cartes 1-3 | Toutes les bornes |
| --- | --- | --- |
| gagnée par une figure plus haute que celle d'en face | 33 % | 28 % |
| gagnée sur preuve, l'autre côté inachevé | 65 % | 61 % |
| en face : suite simple ou somme | 15 % | 18 % |
| en face : cartes hautes (moyenne 6 ou plus) | 42 % | 40 % |
| borne ouverte par le gagnant | 55 % | 52 % |
| le gagnant a fini son côté le premier | 73 % | 69 % |
| l'adversaire a encore joué dessus après | 18 % | 16 % |
| la partie aussi est gagnée | 67 % | 67 % |

- **Le côté faible est un brelan (77 %) ou une suite de couleur (21 %)** ; en
  face, un côté inachevé (65 %), une couleur (17 %) ou une somme (12 %). C'est
  la figure qui bat la hauteur : un brelan de 1 bat une couleur 8-9-10.
- **Leur histoire ressemble à celle des autres bornes**, à 2 à 5 points près :
  rien ne les distingue comme un piège.

**Un début bas, pour l'adversaire** (3 048 parties entre robots de même force,
chaque côté qui commence par une paire ou deux cartes de même couleur à deux
valeurs ou moins d'écart) :

| Début de côté | Borne gagnée | Cartes adverses posées ensuite | Nombre |
| --- | --- | --- | --- |
| paire basse (1-3) | 58 % | 1,09 | 3 525 |
| paire moyenne (4-7) | 71 % | 0,89 | 3 132 |
| paire haute (8-10) | 75 % | 0,80 | 2 584 |
| suite de couleur basse | 53 % | 1,25 | 3 922 |
| suite de couleur moyenne | 68 % | 1,04 | 6 580 |
| suite de couleur haute | 66 % | 0,99 | 2 372 |

- **Ce n'est pas un piège, c'est l'inverse** : un début bas attire l'adversaire
  (+0,2 à +0,3 carte posée en face) et se perd plus souvent (58 % contre 71 à
  75 % pour une paire). Quand il gagne, c'est que la figure a tenu.
- **Les suites de couleur gagnent le plus au milieu** (68 %), un peu moins en
  haut (66 %), nettement moins en bas (53 %) : l'intuition de Sami sur les
  suites du milieu et les suites basses se voit dans les parties. Le cœur la
  connaît déjà (`midRuns`, `weakRuns` neutres ou en baisse plus haut) : il note
  une borne d'après sa figure et sa somme.

## L'appât : des suites et brelans faibles pour vider la main adverse (02/10)

**L'idée de Sami** : poser des débuts bas (brelan ou suite de couleur) sur des
bornes qui ne comptent ni pour moi ni pour l'adversaire, pour y attirer ses
suites de couleur puissantes — des cartes qui lui manqueront là où ça compte.
L'arbre pourrait voir à travers ; et en cœur contre cœur ?

**`bait`** (`src/sim/bait.js`) : ma zone est la série de trois bornes côte à côte
où mes chances additionnées sont les meilleures, celle de l'adversaire la
série où les siennes le sont. Une borne hors des deux est un appât ; une carte
de 1 à 3 qui y commence ou y prolonge une paire basse ou une suite de couleur
basse reçoit le poids.

| Poids | Donnes 0 | Donnes 1 | Donnes 2 |
| --- | --- | --- | --- |
| 0,1 | 50,9 % | 50,0 % | 51,0 % |
| 0,2 | 49,5 % | — | — |
| 0,4 | 50,8 % | 49,6 % | 50,6 % |

**Neutre.** Ce qui se passe (600 parties, poids 0,4, contre le cœur du 0.9) :

| | Cœur du 0.9 | Avec l'appât |
| --- | --- | --- |
| départs bas (paire ou suite de couleur) par partie | 1,26 | 1,47 |
| cartes adverses posées en face, par départ bas | 1,29 | 1,48 |
| dont cartes de 7 ou plus | 0,58 | 0,62 |
| borne appât gagnée | 51 % | 46 % |

- **L'appât est tendu et l'adversaire mord un peu** : il pose 0,2 carte de plus
  en face, mais presque pas de cartes hautes en plus (+0,04) — ses suites de
  couleur puissantes ne sont pas vidées.
- **L'appât se paie** : la borne est perdue plus souvent. Les deux s'annulent.
- Contre un humain, qui lit une paire basse comme une borne facile, l'appât
  mordrait peut-être plus fort ; entre robots, l'adversaire compte les cartes
  sans lire d'intention.

## Le prix d'une erreur aux tours 6 à 14 (backlog de nuit, 02/10)

`npm run error-impact -- --turns 6-14 --games 120 --explain` : 120 parties par
tour, deux témoins chacune, 167 min. Les neuf tours sont dans le tableau du
« tour critique » plus haut (les mesures à 100 parties des tours 10 et 14 sont
remplacées ; le tour 6 retombe exactement sur la mesure d'avant : à graine
égale, le banc est reproductible).

- **Une erreur au milieu coûte 12 ± 3 points en moyenne** (tours 6 à 14), contre
  **20 ± 2** de 19 à 29. Le début du milieu coûte un peu moins (6-9 : 8,7 ± 4,9)
  que sa fin (10-14 : 14,4 ± 4,3).
- **Le « pic du tour 10 » n'en est pas un** : 18,3 ± 9,6, autant que les tours 11
  (17,5) et 13 (17,5), alors que 12 tombe à 5,4. À ± 10 points par tour, ces
  écarts sont du bruit ; seule la pente compte. Par paires de tours : 6-7 : 9,4 ;
  8-9 : 8,0 ; 10-11 : 17,9 ; 12-13 : 11,5.
- **`--explain` ne voit rien au milieu** : les traits mesurés (bornes
  disputées, côtés complets, jokers, pioche) sont les mêmes pour une erreur qui
  coûte et une erreur sans effet — à ce stade, les 7 bornes sont ouvertes et
  aucune n'est disputée. Ces traits ont été pensés pour la fin de partie.
- **Pour les versions futures** : le milieu (10-14) vaut déjà les deux tiers de
  la zone chère. C'est là qu'un meilleur jugement du cœur paierait (`jkx` y
  agit : côtés sans figure, surenchère, ouverture), avant que l'arbre ne voie la
  fin.


## L'oracle sur les replays (03/10, en cours)

**L'idée de Sami** : il ne trouve plus, en jouant, ce que le cœur rate. Un
arbre très large sur des positions réelles le trouvera peut-être : un coup que
l'arbre préfère et que le cœur ne met pas dans son top 3 est une omission du
cœur, donc une piste d'évolution.

**Ce que regarde le 0.9** : à la racine, les **8** meilleurs coups du cœur
(`candidates`) ; en dessous, ses **3** meilleures réponses (`widen`). Un coup
hors du top 8 n'est jamais examiné.

**L'oracle** (`npm run oracle`, `src/replay/oracle.js`) :
`ismcts+candidates=99+widen=6+depth=5@20000`, soit **tous** les coups légaux à
la racine (jokers refusés par l'habitude compris), 6 réponses par nœud, 25 fois
le budget du 0.9. Deux recherches de graines différentes ; un **écart** est leur
coup commun hors du top 3 du cœur (et noté s'il est hors du top 8).
- Positions : tours 15-16, 20-21 et 25-26 des 600 parties du 0.9 contre lui-même
  (les deux joueurs) ; et, avec `--at last-column`, le coup où chaque joueur
  remplit sa dernière colonne vide (1 187 positions, tour médian 16 — l'intuition
  de Sami : ce coup pèse lourd sur la suite).
- **Le coût** : 1,5 à 2,5 min de calcul par position au tour 25, environ 6 min
  au tour 15 (42 coups légaux) — cinq fois l'estimation faite sur le 0.9, l'arbre
  étant bien plus large. Environ 10 à 14 s par position sur 23 fils.
- **Deux économies** (Sami : ne pas perdre de temps) : une recherche s'arrête
  dès que son coup favori ne peut plus être rattrapé (`+smart=1`), et la
  seconde recherche, celle qui vérifie que la première n'a pas eu de chance,
  n'est lancée que si la première sort du top 3 du cœur — ailleurs il n'y a pas
  d'écart à confirmer.
- **Le backlog plafonne chaque traitement à 2 h** (`limit`, arrêté au-delà avec
  tous ses processus) ; l'oracle s'arrête de lui-même à 110 min.
- Chaque position est écrite dès qu'elle est lue (`oracle/positions.jsonl`, hors
  de git) ; une nouvelle passe reprend où la précédente s'est arrêtée. Le résumé
  va dans `data/oracle-diffs.json`.
- **Ensuite** : confirmer chaque écart par le jeu (le coup de l'oracle contre le
  premier du cœur, suite jouée par le 0.9, jugée au tour 30 ; `branchFrom` accepte
  désormais un coup à forcer), puis chercher les motifs.

## Les résultats de la nuit du 03/10

**Dans l'arbre, contre le 0.9** (duels longs, règle de la page, deux jeux de
donnes réunis) :

| Cœur | Donnes 0 | Donnes 1 | Réunis |
| --- | --- | --- | --- |
| `jkx` (junk + obex) | 48,6 % | 54,9 % | 51,7 % (46,6 – 56,9), 144 paires |
| `jk2` (junk seul) | 54,9 % | 50,0 % | 52,4 % (47,0 – 57,8), 144 paires |
| `obex` | 49,5 % | 51,6 % | 50,5 % (45,8 – 55,2), 192 paires |

- **Rien de net.** Le gain du cœur seul (+4 pour `jkx`) passe en partie dans
  l'arbre (environ +2), mais un duel de 20 min (144 à 192 parties) ne voit pas
  2 points. Quatre duels de plus pour `jkx` (`--offset 2` à `5`) porteront le
  total à environ 430 paires, soit ± 3 points.
- **Les deux phases, sur des parties entières** (`npm run ab`, 400 donnes contre
  le Stratège) : le 0.9 fait 66,8 % ; bascule au tour 20 : −1,3 ± 4,2 points ;
  bascule à la première borne : −2,0 ± 4,3. **Écarté.**

**Le prix d'une erreur, complet de 1 à 29** (les tours 1, 3-5 et 15-17 dans le
tableau du « tour critique ») :
- **Tours 1 à 5 : 0,4 point en moyenne.** Le brouillard du début se confirme.
- **Tours 15 et 17 : 27,9 et 26,7 points**, autant que le cœur de la zone chère.
  **Elle commence donc au tour 15**, pas au tour 19 : de 15 à 29, une erreur
  coûte 19,4 ± 2,1 points en moyenne, contre 11,9 ± 3,2 de 6 à 14. Le tour 18
  (2,9 ± 8,1) paraît isolé, sans doute du bruit.

**L'oracle au coup qui remplit la dernière colonne vide** (1 187 positions,
99 min) — **non confirmé** :
- l'oracle ouvre aussi une colonne vide dans 36,6 % des cas, et **joue ailleurs
  dans 63,4 %** ;
- il joue le coup du 0.9 dans 22,6 % des cas ;
- un écart stable hors du top 3 du cœur dans **50,1 %** des positions, hors du
  top 8 dans environ 37 % ;
- son favori reçoit en médiane 27 % des visites, avec 0,115 d'avance sur le second.

Ce taux d'écart est trop haut pour être pris tel quel : soit le cœur rate
beaucoup, soit l'oracle (simulations jouées par le cœur, 6 réponses par nœud)
se disperse. **Rien ne dit encore que l'oracle joue mieux que le 0.9.** La
confirmation par le jeu (le coup de l'oracle contre celui du cœur et celui du
0.9, suite jouée par le 0.9, jugée au tour 30) passe avant toute recherche de
motifs.

**La vitesse de l'oracle** : 3,7 s par position sur tous les fils, au lieu des
10 à 14 s estimées — les correctifs de vitesse du cœur, la seconde recherche
seulement quand il faut, l'arrêt anticipé.

**Les temps du cœur de la rétrospective** sont désormais une donnée
(`data/core-timings.json`), remesurée seulement par `npm run retrospective --
--measure`, sur une machine au repos : la page construite pendant le backlog
affichait 120 itérations par seconde au lieu de 556.

**La confirmation par le jeu** (`npm run oracle -- --confirm`,
`scripts/lib/oracle-confirm.js`) : pour chaque écart, le coup de l'oracle, le
premier du cœur et celui du 0.9 sont forcés, puis la partie est jouée par le
0.9 des deux côtés sur 4 graines et jugée au tour 30 par le solveur exact. Le
verdict d'ensemble est l'avance moyenne du coup de l'oracle sur celui du cœur
et sur celui du 0.9, par groupe (dernière colonne, tours fixes, marge de
l'oracle, hors du top 8). Un essai sur 3 écarts : 3,5 à 10 min de calcul par
écart, machine chargée. Les 1 176 écarts trouvés à 9 h passent la nuit du
03/10 (deux traitements de 110 min, programmés à partir de 21 h). Dans 196 de
ces écarts, le coup de l'oracle est celui que le 0.9 avait joué : son arbre
l'avait trouvé, hors du top 3 du cœur.

**L'oracle sur toutes les positions** (4 331 positions lues le 03/10, en
3 h 30 au total) — **non confirmé**, la confirmation par le jeu passe la nuit
suivante :

| Positions | Nombre | Écart hors du top 3 du cœur | hors du top 8 | L'oracle joue le coup du 0.9 |
| --- | --- | --- | --- | --- |
| tours 15-16 | 858 | 60 % | 40 % | 23 % |
| tours 20-21 | 1 105 | 56 % | 35 % | 25 % |
| tours 25-26 | 1 181 | 48 % | 31 % | 27 % |
| dernière colonne | 1 187 | 50 % | 37 % | 23 % |

- Les deux joueurs donnent les mêmes taux : celui qui a commencé 53,9 %
  d'écarts, l'autre 52,3 %.
- **Ce qui distingue le coup de l'oracle du premier coup du cœur**, sur les
  2 300 écarts :

  | Trait | oracle | cœur |
  | --- | --- | --- |
  | bâtit un côté ni brelan ni suite de couleur | 33 % | 9 % |
  | répond à une borne adverse | 7 % | 30 % |
  | pose une 2e carte | 65 % | 51 % |
  | complète un côté (3e carte) | 27 % | 17 % |
  | ouvre sans suite prévue en main | 4 % | 18 % |
  | joker | 14 % | 4 % |

- **L'oracle approfondit plutôt qu'il n'élargit** : il reste sur ses côtés déjà
  entamés au lieu de répondre ou d'ouvrir. Et il bâtit bien plus de côtés sans
  figure, à l'inverse de la règle `junk` — ce qui pourrait être une façon de
  sacrifier une borne pour en tenir d'autres.
- **Tant que la confirmation n'a pas parlé, ce sont des pistes, pas des
  règles** : l'oracle joue ses simulations avec le cœur, et ses écarts
  pourraient venir de sa dispersion (son favori ne reçoit que 27 % des visites
  en médiane). Le résumé est dans `data/oracle-diffs.json` (les taux et ce
  comparatif ; les écarts eux-mêmes restent dans `oracle/positions.jsonl`).

## Pousser le cœur dans le sens de l'oracle (03/10)

**L'idée de Sami** : des bonus qui alignent le cœur sur les écarts de l'oracle,
testés un par un puis ensemble, en cœur contre cœur (machine libre, 3 min 30
de calcul en tout).

**Les idées** (`src/sim/oracle-ideas.js`) : `stay`, une carte sur un côté déjà
commencé ; `noAnswer`, un malus pour répondre à une borne adverse ;
`noBlindOpen`, un malus pour ouvrir une borne vierge sans rien en main pour y
bâtir. Les côtés sans figure sont `junk` à poids négatif, et les jokers libres
un cœur sans l'habitude `joker`.

| Cœur | Contre le cœur du 0.9 |
| --- | --- |
| `stay` 0,1 / 0,2 | 48,6 % / 50,9 % (puis 49,7 % et 50,1 %) |
| **`stay` 0,4** | **51,9 %, 50,7 %, 52,1 %** |
| `stay` 0,8 | 44,5 %, 45,8 % |
| `noAnswer` 0,1 / 0,2 | 50,4 % (puis 50,2 %, 50,3 %) / 50,0 % |
| `noBlindOpen` 0,1 / 0,2 | 50,0 % / 50,3 % |
| `junk` à −0,1 / −0,2 (des côtés sans figure, comme l'oracle) | **44,3 % / 38,8 %** |
| sans l'habitude `joker` | 48,9 % |
| tout ensemble (0,1 / 0,2), sans `junk` négatif | 45,5 % / 47,8 % ; 49,1 % |

- **Rester sur ses côtés déjà entamés paie, au bon poids** : `stay` à 0,4 gagne
  sur les trois jeux de donnes ; à 0,8 il perd nettement.
- **Les côtés sans figure de l'oracle font perdre le cœur** (44 % et 39 %) : ils
  donnent raison à `junk`. Si l'oracle voit juste, c'est qu'il les bâtit pour
  une raison que le cœur ne voit pas (sacrifier une borne) ; la confirmation de
  ce soir le dira.
- **Le reste est neutre** : répondre ou non, ouvrir sans figure prévue.
- **Avec `jkx`** (cœur `jkxs` : junk 0,2, outbid 0,2, exposure 0,2, stay 0,4) :
  51,6 %, 52,1 %, 52,0 % contre `jkx`, et **55,5 %, 54,7 %, 54,5 %** contre le cœur
  du 0.9 — le meilleur cœur à ce jour. Deux duels longs dans l'arbre sont au
  backlog de ce soir (`duel-jkxs-0`, `-1`), avant ceux de `jkx`.

## `stay` dans l'arbre, et la variante gagnante : `stfig` (03/10)

**Dans l'arbre, à 400 itérations, en miroir** (chaque donne jouée des deux
sièges), 10 min :
- le 0.9 avec `stay` 0,4 contre le 0.9 : **58,3 % (52,1 – 64,6)**, 96 paires ;
- le 0.9 avec `stfig` 0,6 contre le 0.9, sur d'autres donnes : 54,9 %
  (47,8 – 61,9), 72 paires.
- Deux tendances positives, mais à ± 7 points : les tris de 10 min ont déjà
  trompé (57-60 % retombés à 49 %). Les duels longs de ce soir trancheront.

**Depuis le tour 10** (`npm run core-test -- … --from 10`, 100 parties) :
`stay` 0,4 fait −0,5 ± 6,0 points. Si son effet est réel, il se joue avant le
tour 10, quand on choisit entre approfondir et ouvrir : une partie entière est
la bonne mesure.

**Les variantes de `stay`, cœur contre cœur** (paramètres de
`src/sim/oracle-ideas.js`) :

| Cœur | Contre le cœur du 0.9 |
| --- | --- |
| `stay` 0,3 / 0,4 / 0,5 | 50,8 % / 51,9 % / 52,6 % |
| seulement la 2e carte / seulement la 3e | 50,9 % / **44,6 %** |
| jusqu'au tour 20 / à partir du tour 20 | 51,9 % / 49,1 % |
| seulement si l'adversaire a entamé autant de bornes ou plus | 52,2 % |
| **seulement si le côté peut encore devenir un brelan ou une suite de couleur (`stfig`)** | 0,4 : 55,1 %, 55,6 %, 56,8 % |
| **`stfig` 0,6** | **58,0 %, 57,9 %, 58,0 %** |
| `stfig` 0,8 / 1,0 / 1,2 / 1,5 | 57,0 % / 56,6 % / 55,5 % / 55,5 % |
| `jkx` + `stfig` 0,6 (`jkxf6`) | 57,9 %, 58,0 %, 57,6 % ; contre `stfig6` : 50,8 %, 49,2 % |

- **`stfig` 0,6 est le plus gros gain du cœur à ce jour : +8 points**, régulier
  sur trois jeux de donnes. Rester sur ses côtés entamés paie, à condition
  qu'ils gardent une figure possible.
- **`jkx` ne s'y ajoute plus** : `stfig` couvre ce que faisait `junk` (ne pas
  bâtir de côté sans figure), par l'autre bout.
- **Compléter un côté pour le compléter fait perdre** (seulement la 3e carte :
  44,6 %).
- **Au backlog de ce soir** : quatre duels longs de `stfig6` dans l'arbre (environ
  300 paires), à la place de ceux de `jkx` et `jkxs`.

## Des bonus seulement aux tours 1 à 10 (03/10)

**L'idée de Sami** : l'arbre est faible au début de la partie (trop de coups à
examiner) et fort ensuite. Des bonus écartés alors qu'ils gagnaient 51 % ou plus
pourraient aider aux tours 1 à 10 et nuire après. Chaque bonus est donc testé
**actif seulement aux tours 1 à 10** (`earlyIdeas`, `earlyUntil`,
`src/sim/tuning.js` : les idées s'ajoutent tant que `state.turn < 10`, dans les
vrais coups comme dans les simulations de l'arbre).

**Dans l'arbre, à 400 itérations, en miroir, 10 min par duel** (240 parties) :

| Cœur | Bonus aux tours 1-10 | Contre le 0.9 |
| --- | --- | --- |
| `jk2e10` | `junk` 0,2 | 47,9 % (42,0 – 53,9) |
| `obexe10` | `outbid` + `exposure` 0,2 | 52,1 % (46,4 – 57,8) |
| `jkxe10` | les trois | 48,8 % (42,7 – 54,8) |
| `wholee10` | `whole` | 49,2 % (43,3 – 55,1) |
| **`stay4e10`** | **`stay` 0,4** | **55,4 % (49,5 – 61,3)** |
| `stfig6e10` | `stfig` 0,6 | 51,7 % (45,5 – 57,8) |

- **Seul `stay` limité au début passe le seuil du tri (55 %).** Deux duels longs
  à 800 itérations sont au backlog de ce soir (`duel-stay4e10-0`, `-1`), comme le
  veut la règle 400 / 800.
- **`junk`, `obex`, `whole` limités au début ne gagnent rien** : leur faiblesse
  n'était pas de nuire en fin de partie.
- `stfig6` sur toute la partie (au backlog ce soir) dira si limiter `stfig` au
  début lui fait perdre ou non : ici 51,7 %.

## Les bonus du 0.9 limités aux tours 1 à 10 (03/10)

**L'idée de Sami** : les bonus du cœur du 0.9 jouent toute la partie. Les couper
après le tour 10, quand l'arbre voit assez loin, l'améliore-t-il ? Chacun est
gardé pour les tours 1 à 10 seulement (`earlyIdeas`, et pour les habitudes
`earlyHabits`, `src/sim/tuning.js`), un à la fois. `certain` n'est pas testé :
ce n'est pas un bonus, mais la connaissance exacte des bornes déjà perdues.

**Dans l'arbre, 400 itérations, en miroir, 10 min par duel** :

| Bonus gardé aux tours 1-10 seulement | Contre le 0.9 |
| --- | --- |
| `middle` (le centre seulement avec un départ solide) | 50,7 % (45,0 – 56,4) |
| `spread` (pas deux valeurs seules pareilles) | 50,0 % (44,4 – 55,6) |
| `connector` (ne pas casser un départ de suite) | 49,0 % (43,5 – 54,5) |
| habitude `joker` (le joker pour un brelan seulement) | 49,7 % (44,4 – 54,9) |
| habitude `opening` (ouvrir au milieu, une couleur nouvelle) | 50,9 % (46,1 – 55,7) |
| habitude `suited` (deux cartes qui se suivent en couleur) | 50,3 % (45,5 – 55,1) |

- **Rien ne bouge.** Couper ces bonus après le tour 10 ne gagne ni ne perd : à
  partir de là, l'arbre décide, et le cœur ne pèse presque plus (comme le
  banc depuis le tour 23 l'avait montré pour les variantes du cœur).
- Rien ne part en validation de nuit.
- Ces duels jouent 288 à 336 parties en 10 min, contre 240 pour la série
  précédente : le chemin rapide de l'évaluateur (côtés complets, paires de
  jokers) fait encore gagner environ 7 %. Remesuré sur machine libre, le 0.9
  tourne à 1 000 itérations par seconde (556 la veille).

## Les bonus du 0.9 à partir du tour 15, connector, et les simulations tronquées (03/10)

**Le coût de chaque bonus** (temps par itération de l'arbre, le bonus retiré) :
`middle` 6,6 %, `spread` 8,8 %, `connector` 13,7 %, habitude `joker` 5,2 %,
`opening` 9,9 %, `suited` 8,8 % ; les six ensemble 24,8 %. Au-delà de 3 %, une
variante se compare à temps égal (règle écrite dans `CLAUDE.md`).

**Chaque bonus actif seulement à partir du tour 15** (`lateIdeas`, `lateHabits`,
`lateFrom`, `src/sim/tuning.js` ; arbre, 400 itérations, en miroir, 10 min) :

| Bonus | Seulement aux tours 1-10 | Seulement à partir du tour 15 |
| --- | --- | --- |
| `middle` | 50,7 % | 49,3 % |
| `spread` | 50,0 % | 49,0 % |
| `connector` | 49,0 % | 54,5 % (49,5 – 59,5) |
| habitude `joker` | 49,7 % | 50,0 % |
| habitude `opening` | 50,9 % | 50,9 % |
| habitude `suited` | 50,3 % | **41,1 % (35,5 – 46,8)** |

- **`suited` sert au début** : coupée avant le tour 15, le cœur perd nettement.
  C'est le premier bonus du 0.9 dont on voit le travail.
- **`connector` à partir du tour 15** semblait gagner (54,5 %). Repris **à temps
  égal** (`@t400`), à partir des tours 11, 15 et 19 : **48,7 %, 48,5 %, 48,9 %**.
  Le 54,5 % était du bruit ; le moment où on l'active ne change rien.
- Les autres sont neutres dans les deux sens.

**Les simulations tronquées** (`ismcts+trunc=N`, `src/sim/truncate.js`, l'idée de
Sami) : une simulation s'arrête dès qu'une borne de plus est décidée (côtés
pleins, gagnant exact), après au moins N coups et tant que la pioche dure ; la
chance de gagner la partie selon le cœur (4 bornes, ou 3 côte à côte, sur les 128
façons dont les bornes peuvent tomber) tient lieu de résultat.
- Les simulations ne revendiquent jamais de borne (elles règlent tout à la fin,
  pour la vitesse) : il a fallu compter une borne « décidée » dès que ses deux
  côtés sont pleins, sinon rien n'était jamais coupé.
- **Le gain de vitesse** : 79-80 % des simulations coupées jusqu'au tour 12, pour
  17 à 27 % de temps en moins par itération ; rien après la pioche vide.
- **À temps égal** (`@t400`) contre le 0.9 : `trunc=5` **41,1 % (35,0 – 47,3)**,
  `trunc=8` **45,6 % (41,7 – 49,6)**. Plus on coupe tôt, plus on perd : juger la
  partie avant sa fin coûte plus que les ~20 % d'itérations gagnées — la même
  leçon que la valeur de position apprise (40,3 %, le 01/10).

**Le cœur dépouillé, à temps égal** (backlog du soir, `@t800` contre le 0.9
`@t800`, deux jeux de donnes chacun, réunis par paires avec `npm run versus`) :

| Cœur | Ce qu'il garde | Duels | Réunis |
| --- | --- | --- | --- |
| `nobonus` | `certain` seul | 36,9 % puis 42,6 % | **39,7 % (36,3 – 43,2)**, 672 parties |
| `lean` | `suited` et `certain` | 39,9 % puis 43,3 % | **41,9 % (38,7 – 45,1)**, 816 parties |

- **Les bonus valent bien plus que leur temps.** Sans eux, l'arbre fait un tiers
  d'itérations en plus et perd quand même nettement.
- **`suited` seul ne rachète presque rien** : deux points, dans le bruit. Coupée
  avant le tour 15, elle coûtait neuf points ; gardée seule, elle n'en rend que deux. Les
  six bonus travaillent ensemble, et aucun ne se retire sans perte.
- On le voit dans les coups : sans les autres bonus, le cœur ne pose presque plus
  de 2e carte au début (0,2-0,4 % contre 5,5 %), ne bâtit plus de suite de
  couleur avant le tour 12, et finit avec plus de côtés sans figure (2,44 contre
  2,08 pour `lean`).
- Piste close : on ne simplifie pas le cœur pour gagner du temps.

## La chance des jokers (03/10)

**La question de Sami** : quel taux de victoire avec deux jokers, un, aucun ?

Chaque partie gardée note maintenant les jokers de chaque joueur
(`src/replay/jokers-held.js`, dans l'analyse des duels et dans l'index) : ceux
de la main de départ (les 6 premières cartes du paquet pour le siège 0, les 6
suivantes pour le siège 1) et ceux piochés ensuite. `npm run jokers` en tire
les taux de victoire.

**Robots de même force** (4 008 parties, les deux côtés) :

| Jokers | obtenus dans la partie | dans la main de départ |
| --- | --- | --- |
| 0 | 36 % (1 991) | 48 % (5 870) |
| 1 | 50 % (4 038) | 56 % (2 076) |
| 2 | **64 %** (1 987) | 57 % (70) |

- **Un joker vaut environ 14 points de chances de gagner** : avoir les deux
  contre aucun, c'est 64 % contre 36 %. Presque toutes les parties vont
  jusqu'à la pioche vide, si bien que les deux jokers sont presque toujours
  tirés : « 1 joker » veut dire « un chacun » (4 034 cas sur 4 038).
- **Un joker dès la main de départ** donne 56 % au lieu de 48 %. Deux jokers en
  main de départ sont rares (70 cas) ; leur 57 % est trop incertain pour dire
  que le second ajoute peu.

**Sami contre les robots** (72 parties, son côté) : 28 % sans joker (18), 50 %
avec un (38), 56 % avec les deux (16) — la même pente, sur trop peu de parties
pour aller plus loin (± 20 points environ par case).

## Expérimental 1.0 : rester sur ses côtés tant qu'une figure y est possible (03/10)

**Ce qui change** : le cœur du 0.9 plus `stfig` 0,6 (`stay` avec `stayFigure`,
`src/sim/oracle-ideas.js`). Une carte posée sur un de mes côtés déjà commencés
reçoit 0,6, si ce côté peut encore devenir un brelan ou une suite de couleur.
Moteur : `ismcts+widen=3+depth=5+core=stfig6@800`. Le 0.9 reste `ismcts+widen=3+depth=5@800`,
et `EXPERIMENT` reste son cœur : les replays, l'oracle et les bancs qui lisent les
parties du 0.9 gardent leur sens. Les tests à venir se font contre le 1.0, avec `core=stfig6`.

**Ce qui l'a décidé** :
- l'oracle reste sur ses côtés entamés bien plus que le cœur (2e carte : 65 % de ses
  coups contre 51 %) ;
- en cœur contre cœur, `stfig` 0,6 fait 58,0 / 57,9 / 58,0 % sur trois jeux de donnes ;
- dans l'arbre, quatre duels longs à 800 itérations : 53,8 / 58,3 / 51,7 / 60,8 %,
  soit **56,1 % (53,2 – 59,1) sur 480 donnes jouées des deux côtés** (`npm run versus`).

**Le coût** : `stfig` demandait `shapeOf` à chaque coup de chaque simulation,
et l'arbre allait 24,5 % plus lentement par itération. `keepsFigure` donne la même
réponse sur les 65 763 côtés possibles, avec la même empreinte du 1.0
(`152e2a9c9d66170c`, `npm run fingerprint -- "ismcts+widen=3+depth=5+core=stfig6@150,greedy" 40`).
Le surcoût tombe à 2 % : sous les 3 % de la règle du temps égal, les duels à
itérations égales valent aussi au temps.

**Ce qu'il joue autrement** (`npm run versus`, 960 parties contre le 0.9) :

| | 1.0 | 0.9 |
| --- | --- | --- |
| tours 1-12 : pose une 2e carte | 18 % | 6 % |
| tours 1-12 : ouvre une borne vierge | 49 % | 60 % |
| tours 1-12 : bâtit une suite de couleur | 16 % | 6 % |
| tours 13-24 : répond à une borne adverse | 28 % | 17 % |
| tours 13-24 : bâtit un côté sans figure | 10 % | 20 % |
| bornes entamées au tour 10 | 4,3 | 4,9 |
| côtés complets sans figure à la fin | 1,95 | 2,29 |
| bornes gagnées | 2,97 | 2,63 |

Il approfondit au début au lieu d'ouvrir, garde ses figures possibles, et répond
plus tard, quand l'adversaire a déjà montré son jeu. Son gain ne dépend ni du
siège (54,8 % quand il commence, 57,5 % sinon) ni des jokers.

**Ce qu'en dit l'oracle** (`npm run oracle -- --disagree stfig6 --minutes 40`) :
- dans les 960 parties contre le 0.9, aux tours 5 à 16, 4 311 positions où les deux cœurs
  préfèrent un coup différent ; 470 lues, 280 où ses deux recherches s'accordent ;
- il joue le coup du 1.0 dans **13,9 %**, celui du 0.9 dans **3,6 %**, un troisième dans 82,5 % ;
- l'écart est le plus net au début : aux tours 5-8, 34 % contre 0 % ;
- reclassées par le cœur du 1.0 (`--summary --core stfig6`), ses 4 331 positions mettent
  son coup dans le top 8 dans **66 %** des cas, contre 54 % avec le cœur du 0.9 : l'arbre,
  qui n'examine que ce top 8, regarde plus souvent le coup de l'oracle.

Entre les deux cœurs, l'oracle penche nettement pour le 1.0. Mais il joue le plus
souvent un troisième coup (son favori n'a que 18 % des visites en médiane) : la
confirmation par le jeu reste ce qui dira s'il voit juste.

**Écarté le même jour** : `stay` limité aux tours 1-10 (`stay4e10`) : 55,4 % au tri à
400, puis 50,6 % (47,1 – 54,2) en deux duels longs. Les autres essais du 0.9 sont
dans `out/changelog-exp-1.0.html` (« Changelog Exp v1.0 »).

**La leçon** : les tris de 10 minutes à 400 itérations ont promu trois idées qui
n'ont pas tenu (stay 0,4 à 58,3 %, connector dès 15 à 54,5 %, stay4e10 à 55,4 %). Un
tri écarte, il ne promeut plus : voir la règle dans `CLAUDE.md` et `docs/validation.md`.

**Les versions passent à deux chiffres** (Sami) : `experimental@1.0`,
`stratege@2.1`, `basique@1.0`. Les parties enregistrées avant, en `x.y.0`, comptent
pour la même version (`shortTag`, `src/config/bots.js`).

## La base de référence V1 + Oracle : les pilotes de la nuit (04/10)

L'idée de Sami : faire de l'oracle un étalon — ses parties entières, les parties
du V1 relues par lui et inversement — pour juger une idée en minutes avant de lui
donner des duels longs. Avant d'y mettre des nuits, des pilotes. L'oracle est figé
en **version 1** (`ORACLE.version`, empreinte `c87b8b524dede38b`) ; les replays des
duels gardent désormais les 5 meilleurs candidats d'une recherche et leurs visites.

**L'oracle confirmé par le jeu** (`oracle-confirm-1`, 1 144 écarts des tours 14-26
rejoués jusqu'au tour 30 par le 0.9, 4 graines) : son coup tient **+6,3 ± 1,8 points**
de plus que le favori du cœur, **+3,1 ± 1,8** de plus que le coup du 0.9. Sûr de lui
(marge ≥ 0,15) : +3,7 ; hésitant : +1,0 ± 3,3, rien de prouvé. Au milieu de partie,
ses écarts sont de vraies leçons.

**Le banc oracle** (`npm run oracle -- --bench …`) : la part des positions où le coup
de l'oracle entre dans le top 8 d'un cœur classe les 8 cœurs mesurés en duels longs
comme les duels (corrélation de rang 0,93 ; top 1 et top 3 : 0,60). Ses positions
vont des tours 14 à 26 : il ne voit pas une idée qui agit plus tôt (stay4e10).

**Ce que coûte un coup de l'oracle** (`oracle-cost`, médiane sur 23 fils) : 97 s au
tour 2, 65 s au 10, 41 s au 18, 18 s au 26. Une partie Oracle contre 1.0 : une vague
de 22 parties en 12,6 min, soit environ 105 parties par heure.

**L'oracle au début de partie : le doute de Sami était fondé.**
- Ses deux recherches s'accordent dans **36 %** des positions des tours 2 à 12
  (10 % au tour 2, 17 % au 4, 30 % au 6, 43 % au 8, 60 % au 10, 53 % au 12), contre
  68-70 % aux tours 14-26. Son favori n'a que 10 % des visites en médiane.
- À 80 000 itérations (18 positions), le favori rejoint l'un des deux de 20 000 dans
  2 cas sur 6 aux tours 2 et 6, 6 sur 6 au tour 10.
- Avant le tour 10, l'oracle n'est pas une référence ; ses positions de début ne
  servent pas d'étalon. (Les pilotes ne lisaient que des tours pairs, donc le joueur
  qui commence second ; rien n'indique que l'autre siège diffère.)

**En parties entières** (22 parties chacun, une vague) :

| Pilote | Score contre le 1.0 | Fourchette par paires |
| --- | --- | --- |
| l'oracle | 45,5 % | 24,8 – 66,2 % |
| l'oracle jusqu'au tour 12, puis le 1.0 | 63,6 % | 44,5 – 82,7 % |

Trop peu de parties pour conclure, mais une surprise : rien ne dit encore que
l'oracle bat le V1 en partie entière. Il cherche avec le cœur du 0.9 (réponses et
simulations), le V1 avec celui du 1.0. Les deux questions partent ce matin en
110 parties de plus chacune (`ref-oracle-v1-0/1`, `ref-phase12-0`).

**Le V1 relit les 22 parties de l'oracle** (`npm run shadow`) : il joue le même coup
dans 4,5 % des cas aux tours 1-4, 16 % aux 9-12, 27 % aux 17-20, 38 % après le 25 ;
le coup de l'oracle est dans le top 8 de son cœur 23 % du temps au début, 75-83 %
à la fin.

**Pour la suite** : la base de référence part des tours 12 et plus (`ref-annotate-0` :
l'oracle relit les parties du 1.0 aux tours 12-28, deux recherches, classées par le
cœur du 1.0). Oracle contre Oracle attend : son début de partie n'est pas fiable.

### Le matin du 04/10 : l'oracle bat le V1

**La confirmation complète** (`oracle-confirm-1` et `-2`, les 2 300 écarts) : le coup
de l'oracle tient **+2,4 ± 1,3 points** de plus que celui du 0.9 au tour 30, +4,6 ± 1,2
de plus que le favori du cœur. Sûr de lui (marge ≥ 0,15, 1 269 écarts) : +3,5 ± 1,8 ;
hésitant : +1,1 ± 1,8.

**Oracle contre 1.0, réunis par paires** (`npm run versus`, pilote + deux passes) :

| | Parties | Score | Fourchette par paires |
| --- | --- | --- | --- |
| l'oracle | 242 | **57,4 %** | 51,7 – 63,1 % |
| l'oracle jusqu'au tour 12, puis le 1.0 | 132 | 59,1 % | 50,9 – 67,3 % |

La fourchette basse passe 50 % : l'oracle est plus fort que le V1, il peut servir
d'étalon — à partir du tour 10-12, où ses recherches sont stables. Et chercher
large au début rapporte autant que chercher large partout.

**Ce que l'oracle joue autrement** (sur ses 242 parties contre le 1.0) :
- au début (tours 1-12), il **ouvre moins de bornes vierges** (44 % de ses coups
  contre 60 %), **répond plus aux bornes adverses** (33 % contre 23 %), joue plus au
  centre (45 % contre 36 %) et bâtit plus tôt ses brelans ;
- au milieu, il répond encore plus (31 % contre 21 %), accepte des côtés sans figure
  (20 % contre 11 %) et bâtit moins de suites de couleur (26 % contre 34 %) ;
- à la fin, il joue à côté de ses bornes gagnées (41 % contre 31 %) ;
- au tour 10, il a entamé 4,08 bornes contre 4,37 ; il en gagne 3,02 contre 2,69.

Le constat sur les parties entières contredit en partie celui des écarts de la
veille (l'oracle « répondait » moins dans ses écarts, d'où `noAnswer`) : ici, sur
tous ses coups, il répond plus.

**Pour copier l'oracle, deux pistes en tri ce matin** :
- **regarder plus de coups** : son coup est dans le top 8 du cœur du 1.0 dans 66 % des
  positions, le top 12 dans 77,6 %, le top 16 dans 84 % (au début : 42, 62 et 73 %).
  Tris à temps égal : `candidates=12`, `candidates=16`, et 16 jusqu'au tour 12 ;
- **jouer comme lui** : quatre cœurs sur le 1.0 (`v1ans1/2` : un bonus pour répondre ;
  `v1blind1/2` : un coût pour ouvrir à l'aveugle), triés cœur contre cœur.

**La vitesse** : deux optimisations à coups identiques (les trois empreintes inchangées) —
la carte seule sur un côté vide calculée une fois par évaluation et non par borne vide,
et plus de tableau alloué pour la clé de la mémoire des paires — font environ 5 % de
temps en moins pour la recherche du 1.0. Le reste du temps est dans l'évaluation des
côtés à une et deux cartes, déjà optimisée : un gain plus gros demanderait de revoir
sa structure.

**L'oracle relit les parties du 1.0** (`ref-annotate-0`, tours 12 à 28, 2 159 positions,
deux recherches, classées par le cœur du 1.0) : ses deux recherches s'accordent dans
57 % des positions au tour 12, 65-71 % ensuite. Ses écarts face au cœur du 1.0 (1 035,
hors de son top 3) : il **bâtit un côté sans figure** dans 37 % de ses coups contre 2 %
pour le cœur, **complète un côté** (3e carte) 32 % contre 15 %, **joue un joker** 14 %
contre 2 % ; le cœur du 1.0, lui, bâtit une suite de couleur (46 % contre 18 %) et pose
une 2e carte (69 % contre 52 %) — stfig en fait peut-être trop. Ces positions
(`oracle/positions-v1ref.jsonl`) sont la base du banc des versions V1+ : sur elles, le
coup de l'oracle est dans le top 8 du cœur du 1.0 dans 60,6 % des cas, le top 16 dans 82 %.

**Le V1 relit toutes les parties de l'oracle** (`ref-shadow`, 242 parties) : même coup
dans 4 % des cas aux tours 1-4, 12 % aux 9-12, 20 % aux 17-20, 43 % après le 25 ; le
coup de l'oracle est dans le top 8 de son cœur 24 % du temps au début, 83 % à la fin.

**Copier l'oracle dans le cœur** (cœur contre cœur du 1.0, 6 000 à 8 000 parties, quelques
secondes) :

| Cœur (sur le 1.0) | Jeu de donnes 0 | 1 | 2 |
| --- | --- | --- | --- |
| `v1ans1` / `v1ans2` : un bonus pour répondre | 46,9 % / 45,8 % | | |
| `v1blind1` : ouvrir à l'aveugle coûte 0,1 | 51,1 % | 49,3 % | |
| `v1blind2` : 0,2 | 50,7 % | | |
| `v1jneg1` / `v1jneg2` : un côté sans figure accepté (junk -0,1 / -0,2) | 50,4 % / 51,0 % | — / 50,4 % | |
| `v1freejk` : sans l'habitude du joker | 47,5 % | | |
| **`v1bj`** : `noBlindOpen` 0,1 et `junk` -0,2 ensemble | **52,0 %** | **52,1 %** | **51,5 %** |

Répondre plus, comme l'oracle le fait dans ses parties entières, fait perdre le cœur :
il répond quand c'est juste, pas par principe. Seul `v1bj` tient sur trois jeux de donnes,
mais le banc oracle ne lui voit rien (top 8 : 60,0 % contre 60,6 % sur les positions du
1.0, 64,7 % contre 66,0 % sur celles du 0.9). Il passe un tri dans l'arbre à temps égal
ce matin (`screen-v1bj`) ; s'il n'est pas écarté, ses quatre duels longs ce soir.

**Regarder plus de coups, à temps égal** (`screen-copy-oracle`, tris à `@t400` contre le 1.0) :

| Variante | Score | Fourchette par paires |
| --- | --- | --- |
| `candidates=12` | 38,2 % | 31,3 – 45,0 % |
| `candidates=16` | 42,5 % | 36,9 – 48,1 % |
| 16 jusqu'au tour 12, puis 8 | 46,6 % | 42,7 – 50,4 % |

Les trois sont écartées. Le coup de l'oracle est bien plus souvent dans le top 12 ou 16
du cœur, mais à budget égal, l'arbre qui regarde plus de coups en creuse chacun moins
— et perd. L'oracle peut chercher large parce qu'il a 25 fois plus d'itérations : la
largeur ne se copie pas sans le budget qui va avec. Ce qui se copie, c'est le choix
du cœur (quels coups mettre dans le top 8), d'où les cœurs `v1…`.

**`v1bj` dans l'arbre** (`screen-v1bj`, `@t400` contre le 1.0, 528 parties) : **46,0 %**
(42,3 – 49,8) — écarté. Ses 52 % en cœur contre cœur ne passent pas dans l'arbre, et le
banc oracle l'avait annoncé (top 8 : 60,0 % contre 60,6 %). C'est le premier cas où le
banc tranche contre un tri du cœur : avant de donner un tri d'arbre à une idée, le banc
d'abord.

**Le 1.0 contre lui-même** (`ref-v1-self-0/1`, 2 × 336 parties gardées) : 50,0 % et 53,0 %,
comme attendu d'un miroir — le corpus V1 contre V1 de la base de référence.

**Le bilan de la nuit et du matin** : l'oracle est un étalon solide à partir du tour 12
(57,4 % contre le 1.0, ses écarts confirmés par le jeu), pas avant. Aucune variante du
1.0 n'a tenu : regarder plus de coups perd à temps égal, et les traits de l'oracle
copiés un par un dans le cœur ne passent pas dans l'arbre. La piste qui reste ouverte :
le début de partie, où l'oracle jusqu'au tour 12 gagne 59,1 % — c'est son budget, pas
sa largeur, qui gagne ; un 1.0 qui réfléchit plus longtemps aux premiers coups (temps,
pas largeur) est le prochain essai.
