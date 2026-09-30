
## Analyse Experimental 0.5
très fort dans l'ensemble. 25 replay disponibles. Je n'ai pas trouvé de failles évidentes.
Quand je gagne, c'est principalement du a des bonnes pioches j'ai l'impression, à confirmer.
La différence de niveau entre le bot stratége et expérimental est importante.
Le fait que le bot cherche durant mon tour rend la partie très fluide et agréable à jouer. quand le bot prend 10s c'est pas trop génant non plus.
Pour information, j'ai déplacer les anciens replays dans /replays/OLD/

## Identification des win-pattern sur les bornes
Identifier les pattern utilisé par le bot Experimental 0.5 sur 1000+ parties contre lui même, limité la recherche à 20mn.
L'idée étant d'extraire des condition déterministic qui permettent de jouer un coup gagnant sur une borne sans avoir a calculer toute la partie.
une fois ces partterns trouvé est validé (théoreme), il faut les implémenter dans le core, ce qui permettera d'optimiser les 10s de recherche
uniquement sur les coups qui en ont le plus besoin. De la même manières tu peut aussi optimiser l'algorithm de pruning de l'arbre lors de la recherche,
sur les coups les moins bon.

## Plus de temps = meilleur ?
je suis aussi curieux de voir la progression entre un bot qui recherche avec une limite de 5, 10, 15, 20 et 30 secondes max par coups,
pour voir si il y a un gain de niveau significatif ou si le bruit prend le dessus sur des coups plus évident à court terme.
idem utiliser un budget de temps pour les tests de 20 min.

## evolutions
-selection de la carte du prochain coup pendant le tour adverse, desactiver le deselect de fin de tour adverse
	ça permet de pre-move et d'enchainer les coups quand j'ai une suite-couleur en main par exemple
-puzzle de fin de partie avec pioche vide (tour 30+). Ajouter un nouvel onglet et proposer des fin parties déterminées et calculable similaire a des puzzle au echecs.
	ici on peut calculer la main de l'adversaire en analysant ce qui est en jeux. l'idée étant de trouver les meileurs coups, qui mêne a la victoire.
	Idéalement une seul solution, avec par exemple trois bornes connectés. Si trop simple ajouter quelque cartes dans la pioche de manière déterminées.
	Prendre les 50 meilleurs fin de partie dans les tests les bot experimental (tests précédent)
	ou il y a un changement de situation inatendu ou des fin de partie très riche en calcule. puzzle générable a la volée ?
	en terme d'ihm il faut les bouton:
		-Révéler le coup gagnant
		-Passer au puzzle suivant
-est ce qu'il y aurais moyen de calculer les classement en ELO pour les différents bots et le joueur ?
