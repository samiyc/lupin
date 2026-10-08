# Prompt 08/10/2026 : Bilan 1.2, Passage v1.2, et Roadmap 1.3

## A. Loi de Monte Carlo Tree Search : Cœurs déterministes vs diversité
- Loi classique de Monte Carlo Tree Search : Déterminisme vs Rollout stochastique.
- À documenter en markdown (`docs/strategie.md`) et dans le changelog HTML : pourquoi un cœur tactiquement strict améliore le bench statique (45,6 % de pièges évités) mais dégrade la convergence MCTS dans l'arbre entier (51,4 % vs 52,7 % pour ExactEnd12 seul).

## B. Passage officiel en Expérimental 1.2
- Promotion officielle de `ExactEnd12` (`ismcts+widen=7+depth=5+core=stfig6+exact=12@2000`) comme bot Expérimental v1.2.
- Célébration courte.
- Finalisation du changelog 1.2 et initialisation du carnet 1.3.

## C. Mode mains révélées (Information ouverte sans brouillard de guerre)
- Option de lancement humain/bot, bot/bot et duels offline pour jouer avec les mains révélées pendant toute la partie.
- La pioche reste cachée (seule part d'aléatoire).
- Supprime le brouillard de guerre sur les mains en début/milieu de partie.

## D. Dé-duplication des données dans les changelogs HTML
- Nettoyer les changelogs HTML pour qu'ils présentent principalement les changements et tentatives propres à chaque version plutôt que de répéter tout l'historique ou le banc oracle à chaque page.

## E. Focus 1.3 : Diversification du Top 8 à la racine de l'arbre
- Analyse des coups de l'oracle absents du top 8 du cœur à la racine.
- Problème identifié : au début de partie (peu d'informations), le cœur propose souvent la même meilleure carte sur plusieurs bornes différentes (ex: 7 bornes), saturant le top 8 et éliminant la diversité des cartes de la main.
- Statistiques des coups oracle absents du top 8.
- Piste : forcer/encourager la sélection de cartes différentes dans le top 8 (idéalement les 6 cartes de la main si les évaluations sont proches) pour élargir la recherche MCTS.

## F. Équilibrage Extension : Nouvelle règle pour le Valet de Trèfle (V♣)
- Remplacement complet de la règle surpuissante (qui gagnait 62,4 % des parties avec "la plus faible gagne").
- Nouvelle règle :
  1. Sur la borne : en cas d'égalité, applique un malus de -10 points sur la borne (inverse du Roi de Carreau qui donne +10).
  2. Effet immédiat à la pose : le joueur choisit une carte de sa main, la défausse, pioche une nouvelle carte en remplacement, puis mélange la carte défaussée dans la pioche. En fin de tour, pioche normale pour remplacer le Valet de Trèfle joué et revenir à 6 cartes en main.
