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
  la feuille de route (`out/roadmap-experimental.html`), pas un acquis du 0.6.
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
