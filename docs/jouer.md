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
  couleur » ou « par valeur ». Tu peux ranger ta main même pendant le tour du
  robot.
- **En haut** : le numéro du tour et les cartes restantes dans la pioche.
- **En fin de partie** : les bornes se règlent une à une. Chacune glisse vers son
  gagnant, verte si elle est à toi, rouge sinon, et la combinaison s'affiche de
  chaque côté.
- **Enregistrement** : la partie s'enregistre toute seule dans `replays/`.
- **« Recommencer »** : demande confirmation, puis abandonne la partie sans rien
  enregistrer.

**Observer.** Deux robots de la gamme s'affrontent, avec les deux mains visibles.
- Boutons lecture, pause, coup précédent, coup suivant, et vitesse.
- La **graine** identifie la partie : remets la même pour la revoir.
- Le panneau de droite dit ce que le robot avait en main, où il a joué, ce qu'il y
  avait en face, et ses meilleures options avec leur gain estimé.
- « Enregistrer cette partie » la range dans `replays/`.

**Replays.** La liste des parties récentes (`replays/`) et gardées
(`data/replays/`).
- Même lecteur que l'Observer.
- Pour chacun de tes coups, le panneau dit ce que le **Stratège** aurait joué et
  l'écart avec son meilleur coup.
- « Garder pour l'analyse » copie la partie dans `data/replays/`, qui est versionné.

`?debug` dans l'adresse expose les commandes du jeu dans la console
(`window.__lopin`), pour piloter une partie par script.

## Les robots

| Robot | Version | Ce qu'il fait |
|---|---|---|
| **Basique** | 1.0.0 | Joue la carte qui vaut le plus à l'instant T, face à ce que l'adversaire construit. |
| **Stratège** | 1.0.0 | Le Basique, plus les trois habitudes de Sami : garder le joker pour un Brelan, ouvrir au milieu une couleur à la fois, préférer une suite de même couleur à une paire. C'est la référence des statistiques. |
| **Expérimental** | 0.1.0 | Banc d'essai. Au départ identique au Stratège ; on y teste une idée (`src/sim/experimental.js`). |

**Versions.** Tout changement de comportement change le numéro :
- dernier chiffre : un réglage ;
- chiffre du milieu : une nouvelle règle ;
- premier chiffre : une autre façon de penser.

Chaque replay enregistre le robot et sa version (`stratege@1.0.0`), donc les
générations restent comparables.

**Tester une idée :**

```bash
npm run duel -- experimental stratege 2000   # 2 000 parties de chaque côté
```

Le duel affiche le taux de victoire avec sa fourchette à 95 %. Si l'Expérimental
gagne nettement, l'idée passe dans le Stratège, avec une nouvelle version.

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
  - pour un robot, ses 5 meilleurs coups avec leur gain ;
- **la fin** : pour chaque borne, les deux côtés, les combinaisons, les sommes, le
  gagnant, ce qui a départagé et l'ordre de complétion ; le vainqueur et le type
  de victoire.

Relire un replay rejoue la partie coup par coup et vérifie chaque coup et chaque
pioche : un fichier abîmé est refusé.

```bash
npm run replays   # bilan de toutes les parties enregistrées
```

Le bilan donne tes résultats contre chaque robot, les combinaisons faites de
chaque côté et l'usage des jokers. Il donne aussi le pourcentage de tes coups
identiques au meilleur choix du Stratège, et tes plus grands écarts avec lui.
C'est la matière pour améliorer le robot, ou ton jeu.

`replays/` est ignoré par git ; `data/replays/` est versionné, pour les parties
qu'on veut garder : cas particuliers, parties marquantes, preuves d'une faiblesse du
robot.
