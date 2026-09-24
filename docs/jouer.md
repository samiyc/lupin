# Jouer contre les robots

## Lancer

```bash
npm run play      # puis ouvrir http://127.0.0.1:4742/
```

Un petit serveur local, sans dépendance, sert la page et enregistre les replays. Il
n'écoute que sur ta machine (127.0.0.1). Live Server ne suffit pas : il ne peut
pas écrire de fichier. `Ctrl+C` arrête le serveur.

Les règles sont celles de la fiche : le jeu de 52 cartes sans figures (As à 10),
les 2 jokers sans couleur et 7 bornes. Les bornes se règlent **en fin de partie**,
dans l'ordre où elles se sont complétées. Le premier à avoir 4 bornes, ou 3 côte à
côte, gagne. C'est le même vainqueur qu'avec la règle officielle, où l'on revendique
en cours de partie ; un test le vérifie.

## Les trois onglets

**Jouer.** « Nouvelle partie » : choisis de jouer premier ou second, ton
adversaire et ton prénom.
- **Poser une carte** : glisse-la de ta main vers une borne. Autre façon : clique
  la carte, puis la borne, ou tape 1 à 7. Échap annule la sélection.
- **Ranger ta main** : glisse une carte sur une autre, ou utilise « Trier par
  couleur » (♠ ♥ ♣ ♦, noir et rouge en alternance, jokers à la fin) ou « par
  valeur ». Tu peux ranger ta main même pendant le tour du robot.
- **Lire les piles** : chaque carte porte sa valeur et sa couleur dans le coin
  haut gauche, la partie qui reste visible quand les cartes se chevauchent.
  Survole une carte d'une pile pour la voir en entier.
- **Compter les couleurs** : en haut à droite, un bouton par couleur donne le
  nombre de cartes de cette couleur que tu vois, sur le plateau et dans ta main,
  sur 10 (« ♥ 6/10 »), puis les jokers sur 2 (« JK 1/2 »). Maintiens un bouton,
  à la souris ou avec Entrée : les cartes de cette couleur (ou les jokers)
  s'allument, les autres passent en gris.
- **À gauche** : la pioche (grisée une fois vide), le numéro du tour et un
  chronomètre discret : le temps du coup en cours et celui de la partie. Il
  s'arrête quand la fenêtre n'est plus active, pour une note prise ailleurs par
  exemple, et reprend à ton retour.
- **En fin de partie** : les bornes se règlent une à une. Chacune glisse vers son
  gagnant, verte si elle est à toi, rouge sinon, et la combinaison s'affiche de
  chaque côté.
- **Enregistrement** : la partie s'enregistre toute seule dans `replays/`. Le nom
  du fichier finit par le score, en bornes, premier joueur d'abord : `_4-3`.
  Une victoire par 3 bornes côte à côte remplace le chiffre du gagnant par un B :
  `_B-2`.
- **« Recommencer »** : demande confirmation, puis abandonne la partie sans rien
  enregistrer.

**Observer.** Deux robots de la gamme s'affrontent, avec les deux mains visibles.
- Boutons début ⏮, coup précédent <, lecture et pause, coup suivant >, fin ⏭
  (les bornes réglées), et vitesse. Les touches Début et Fin font la même chose.
  Depuis la fin, < revient au coup d'avant. La pioche est vide pendant les 12
  derniers coups : c'est normal, il n'y a plus rien à piocher.
- Le Stratège réfléchit une fraction de seconde par coup : la partie se calcule
  coup par coup avant de démarrer (« Les robots jouent… tour 12 / 42 »).
- Les deux mains sont triées par couleur à la distribution, et les cartes piochées
  arrivent à droite, comme en jeu. « Trier : par couleur / par valeur » range les
  deux mains à partir du coup affiché.
- Le compteur affiche le tour du coup montré, comme les journaux et le panneau de
  droite.
- La **graine** identifie la partie : remets la même pour la revoir.
- Le panneau de droite dit ce que le robot avait en main, où il a joué, ce qu'il y
  avait en face, et ses meilleures options avec leur gain estimé.
- « Enregistrer cette partie » la range dans `replays/`.

**Replays.** La liste des parties récentes (`replays/`) et gardées
(`data/replays/`), cinq visibles à la fois.
- Chaque partie tient sur deux lignes :
  - « (W) Sami -vs- Stratège 2.1.0 » : le (W) est du côté du gagnant, et le
    bouton est vert si tu as gagné, rouge sinon ;
  - en dessous, le score (ou « 3 bornes connectées »), la durée et la date.
- Même lecteur que l'Observer.
- Pour chacun de tes coups, le panneau donne le temps que tu as mis (« Joue 5♥
  sur la borne 2 en 2 min 30 s »). Il dit aussi ce que le **Stratège 1.2**
  aurait joué, et l'écart avec son meilleur coup. C'est le Stratège sans son
  anticipation, assez rapide pour juger chaque coup. Un joker posé hors d'une
  paire est signalé à part : il ne le jouerait jamais, il n'y a donc pas
  d'écart à mesurer.
- « Garder pour l'analyse » copie la partie dans `data/replays/`, qui est versionné.

`?debug` dans l'adresse expose les commandes du jeu dans la console
(`window.__lopin`), pour piloter une partie par script.

## Les robots

| Robot | Version | Ce qu'il fait |
|---|---|---|
| **Basique** | 1.0.0 | Joue la carte qui vaut le plus à l'instant T, face à ce que l'adversaire construit. |
| **Stratège** | 2.1.0 | **Il anticipe.** Il prend ses 4 meilleurs coups selon son cœur, le Stratège 1.2 (plus bas). Pour chacun, il rejoue 16 fois la fin de la partie en distribuant au hasard les cartes qu'il ne voit pas. Il garde le coup qui gagne le plus souvent, en tenant un peu compte de l'avis du cœur. Le 2.0 battait le cœur 1.1 dans 74 % des parties, et le 2.1 bat le 2.0 dans 55 %. |
| Stratège 1.2 | (cœur du 2.1) | Le Basique, plus les trois habitudes de Sami : garder le joker pour un Brelan, ouvrir au milieu une couleur à la fois, préférer une suite de même couleur à une paire. Plus trois idées tirées des parties en ligne : les trois bornes du milieu seulement pour un départ solide ; jamais la même valeur seule sur deux bornes ; ne jamais séparer deux cartes de même couleur qui se suivent (1.2). C'est lui qui joue les statistiques du rapport : le 2.1 est trop lent pour un million de parties. Le détail : `docs/strategie.md`. |
| **Expérimental** | 0.5.0 | **Il cherche plus loin.** Même cœur que le Stratège 2.1, mais il part de 8 coups au lieu de 4. Il rejoue des fins de partie par rondes et élimine à chaque fois la moitié la moins bonne, jusqu'à 10 s par coup ; un coup évident part tout de suite. **Il réfléchit pendant ton tour** : il prépare sa réponse sans connaître ton coup, et tout ce temps compte à moitié. Si tu as réfléchi 20 s, il répond aussitôt. Avec 1 s par coup, il bat déjà le Stratège 2.1 dans 62 % des parties (`docs/validation.md`). C'est aussi le banc d'essai des idées (`src/sim/experimental.js`, `search.js`, `ponder.js`). |

**Versions.** Tout changement de comportement change le numéro :
- dernier chiffre : un réglage ;
- chiffre du milieu : une nouvelle règle ;
- premier chiffre : une autre façon de penser.

Chaque replay enregistre le robot et sa version (`stratege@2.1.0`), donc les
générations restent comparables. L'historique des versions et les mesures
qui les justifient sont dans `docs/analyse-replays.md`.

**Tester une idée :**

```bash
npm run duel -- idea:counter strategist            # une idée du cœur : moins d'une minute
npm run duel -- experimental:400 stratege           # profil rapide : 5 min au plus
npm run duel -- experimental:400 stratege --long    # profil long : 20 min au plus
```

Le duel joue par rondes, les mêmes paquets des deux côtés, et s'arrête dès que
le résultat est net ou que le temps du profil est écoulé. Il affiche le taux de
victoire avec sa fourchette à 95 %. `experimental:N` est l'Expérimental avec N
fins de partie par coup. Si l'Expérimental gagne nettement en profil long, l'idée
passe dans le Stratège, avec une nouvelle version. Détails et durées :
`docs/validation.md`.

## Les replays

Un replay est un fichier JSON lisible, cartes notées « 7♥ » et « JK », bornes
numérotées de 1 à 7 :

- **en-tête** : dates, règles, joueurs (humain ou `robot@version`, et leur place),
  graine, et **l'ordre complet du paquet**, qui permet de rejouer la partie à
  l'identique ;
- **chaque tour** :
  - la main (6 cartes) et la taille de la pioche ;
  - la carte jouée et la borne ;
  - ce qu'il y avait des deux côtés de la borne avant le coup, si la borne était
    vide, si le coup la complète ;
  - la carte piochée, si c'était un joker ;
  - pour toi, le temps de réflexion (`thinkMs`, en millisecondes, chronomètre
    arrêté quand la fenêtre n'est pas active) ;
  - pour un robot, ses 5 meilleurs coups avec leur gain ;
- **la fin** : pour chaque borne, les deux côtés, les combinaisons, les sommes, le
  gagnant, ce qui a départagé et l'ordre de complétion ; le vainqueur, le type
  de victoire et la durée de jeu (`activeMs`).

Relire un replay rejoue la partie coup par coup et vérifie chaque coup et chaque
pioche : un fichier abîmé est refusé.

```bash
npm run replays   # bilan de toutes les parties enregistrées
```

Le bilan donne tes résultats contre chaque robot, les combinaisons faites de
chaque côté et l'usage des jokers. Il donne aussi le pourcentage de tes coups
identiques au meilleur choix du Stratège 1.1, tes plus grands écarts avec lui, et tes
coups les plus longs à jouer.
C'est la matière pour améliorer le robot, ou ton jeu.

`replays/` est ignoré par git ; `data/replays/` est versionné, pour les parties
qu'on veut garder : cas particuliers, parties marquantes, preuves d'une faiblesse du
robot.
