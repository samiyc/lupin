
## UX/UI
-reorganisation du menu, Jouer, Observer, Puzzle, Replays, Stats
-dans l'encard de nouvelle partie
	-lors de la première ouverture après F5, la case a cocher devant 'moi' dans 'qui commence ?' est entouré d'un carré jaune => enlever
		(lors d'un clic dans le reste de la page le carré part)
	-pour la description des bots, remplacer les textes long et ajouter des informations chiffrés comme le ELO du bot
		et le nombre de coup visité 4/8 et les limites si il y en à, comme la limite des 10s et recherche pendant le tours adverse.
-en cours de partie, pour les bornes déjà gagné, affiché la borne comme gagné/perdu par le joueur en cours de partie au lieu d'attendre la fin de partie.
	s'alligner sur la règle officiel du jeu d'origine. ça permettera d'avoir une meilleur vision en fin de partie notamment qu'en il y a potentiellement 3 bornes connectées
	mettre fin a la partie si 3 bornes sont connectées sans que toutes les cartes soit jouées => fin de partie. ça evite une perte de temps, ok ?
-ne pas commencer toujours par le même puzzle, next puzzle => selection aléatoire

## What's next for Exp 0.6
-road map html pour le bot expérimental pour atteindre 2000+ Elo.
-0.6 and core algorithm optimisation. trim the fat. 
	every ms save in each step mean more power over the 10s budget ?
-utiliser les puzzles les plus complex comme benchmark/test pour le bot experimental afin de minimiser le nombre de coup explorer
	et comparer les temps de recherche en ms des bots, pour atteindre la solution parfaite (plusieurs itérations pour ignorer le bruit / reste du PC).
	ajouter des nouveau puzzles pour couvrir plus de cas, notamment win middle game garantie si 3 bornes aligné ?
-wider search space to sink oponent during search time ?
	même si l'on possède un power play en main qui gagne une borne on peut attendre, pour semer le doute, ou ne montrer qu'une partie de la suite.
	cacher la stratégie long term en main. à développer. j'ai l'impression que c'est déjà fait en 0.6, à vérifier.

## Replays & Stats
-le block player-prev/next est hors de l'écran dans l'onglet replays c'est pas pratique
	déplacer le ranking ELO des bots/joueurs dans une nouvelle page avec les statistiques
		-le nombre de partie jouées
		-winrate
		-proportion de chacune des 5 combinaisons utilisé pour gagner les bornes
