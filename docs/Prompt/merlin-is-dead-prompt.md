
## merlin-is-dead-prompt.md

## Clean up
bon les recherche au niveau du coup d'ouverture ne semble pas donner des résultats significatif a ce niveau de ELO.
je pense qu'il y a d'autre moyen d'amélioré l'efficacité du bot avec un cout plus légé en compléxité.
de ce fait met a jours les documentations avec les tentatives ratés, qu'il y est une trace.
puis nétoye le code mort, et le repépertoire des ouvertures. garde 10 versions de bots max avec les trois version base/stratege/exp,
tu peut supprimer les version les plus ancienne elle resteron sur le git. 3 bots * 3 dernières versions + Moi => max 10

## Points charnières
Je pense que l'on peut amélioré le bot en dépenssant plus de budget (x4) temps/sim sur les bons tour/coups chanières.
Je pense notamment au tour 30-31 (suivant celui qui commence), avec la pioche vide, c'est le bon moment pour aller plus loin.
et de vraiment prendre le temps d'analyser la situation, pour prendre les devant sur la phase suivante.
pioche vide => on connais la main adverse => solution parfaite "trouvable"

autre transition dans les phases du jeux, l'adversaire rempli ses 7 colonnes (minimum un carte sur chaque bornes).
Impossible pour lui de sortir du chapeau 3 nouvelles cartes gagnantes (8-9-10) sur une bornes.
avec une cartes en jeux dans chaque colonnes on peut déjà avoir une analyse qui limite le bruit.
c'est le moment idéal pour lancer une recherche aprofondi. le tout combiné/vérouillé avec des bon puzzle je pense que c'est optimisable.

D'autre idée de transition de phase ou la compléxité diminue drastiquement ?
sur une partie entière si l'on consomme un budget x4 sur 2-3 tours l'impact en terme de temps est négligable,
quite a même tester ça en combinaison avec une profondeur plus grande à 4 ou 5 coups d'avances.

je te laisse lancer des tests pour optimiser/confirmer.

## Prunning Opti
Tu peut me faire plusieurs proposition sur ce point.
Est-ce qu'il y aurais des moyen d'optimiser l'algo de prunning des branche lors du parcours de l'arbre
pour avoir une profondeur plus grande sans avoir a simuler trops de coups ? si l'on pouvait être a 5 coups d'avance au lieu de 3,
pour le même budget temps, ça devrais aider ?

de mémoire au echec ou il y a un espace de recherche assez grands il arrive a aller a plus de 10 coups d'avances assez vite.
quel est la différence, l'inconnu de la pioche + main adverse ?
