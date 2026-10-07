
## roadmap-1.2-and-extension.md

## Config
-18 thread max partout jour/nuit par défaut pour éviter de satturer le PC, soit 3 coeurs laissé libre.
	1/2 si inférieur à 6 coeurs. 1/2, 2/4, 3/6, 5/8, 7/10, 9/12
	tu peut enlever l'idées des pause de 15 min.
	si besoin d'aller plus vite ou sur serveur on peut toujour configurer via un param
	pour target maxCpuCore - 1

## Roadmap 1.2
finaliser changelog-exp-1.1.html et créér changelog-exp-1.2.html

combien de temps ça a pris pour trouver les 100 nouveau puzzle ?
et pour combien de ces puzzle le core tombe dans un piège (victoire adverse) en jouant sont 1er coup favoris ?

c'est une réflexion par rappport aux fin de parties dans l'arbre. je me demande combien de puzzle
il faudrait générer pour pouvoir définir les tendance et trouver quel sont les puzzles/pièges les plus
récurrent, 1000, 5000, Plus ? Ensuite on ajout une/des règles supplémentaire dans le coeur 1.2 pour
couvrir ces cas. Puis test contre la 1.1

Je peut aussi me porter volontaire pour verifier les puzzles. avec d'avantage de tracking, temps,
erreurs, utilisation des solutions, bref tout ce qui te semble utile. ça permettera peut-être de
disstingué les plus simple des vraiment difficile. de plus j'aurais peut-être moi aussi mon avis sur les cas
les plus récurrent. Actuellement, j'ai un peut de mal à gagner contre le bot
stratége 2.1, alors ne parlons pas de expérimental 1.1 c'est compliqué. Les puzzles c'est plus
rapide. Je peut en faire une bonne quantité sur la même période de temps qui me serait nécessaire
pour gagner une seul partie contre l'expérimental 1.1

## Extension
Je pense que tu peut reset/rename la page lore-exploration.html dans le menu. Pas besoin de garder l'ancienne version.
Dans cette première mouture de l'extension. on ne change pas le jeux de base.
L'idée est d'explorer la faisabilité de l'extention et de calculer les stats pour garantir l'équilibrage.

Plutot que de remplacer des cartes, je voudrais plutot partir sur des cartes supplémentaire à ajouter à la pioche de base.
Ce qui gongle la pioche de quelque cartes. Et pour chaque nouvelles cartes avoir des effets.
Le jeux reste le même que dans la version de base.
On peut choisir combien de cartes bonus on ajoute dans le deck.
par souscis de simplification d'ihm on vas dire trois max dans la version web ?
Il faudra ajouter un/des page(s) supplémentaire dans le pdf des règles, pour parler de l'extension

il faut placer la carte figure en petit sur la droite a coté de nos trois cartes de la bornes,
1 max par borne, 7 pour chaque joueur. Ca montre que cette colonne/borne utilise des règles différentes.

Les effets
- ValetTrefle: La bornes est gagné avec la combinaison la plus faible. ne peut pas être placé sur une borne déjà gagné
- DameCoeur: Interverti deux bornes et les cartes qui y sont associées. ajouter la figure sur les deux colonnes impacté
	ou la reine de carreau en offline. Selection colonnes 1-6 puis intervertir avec la colonne de droite.
- RoiPic: Débloquer la suite de trois nombre impaire dans une couleur. si accompli, en terme de point,
	c'est suppérieur à la suite de couleur.
- RoiCarreau: Ajoute 10 point a la combinaison en cas d'égalité pour les suite/suite-couleur
	1-2-3 + 10 vs 8-9-10 perdant mais vs 4-5-6 c'est gagnant. 5-6-7 + 10 => 28 ou suppérieur devient imbattable.
	Le brelan et la suite-couleur sont toujours suppérieur a la suite simple.

j'aimerai bien avoir 6 cartes bonus pour que ça reste lisible (valet/dame/roi 3x2 rouge/noir)
tu peut me faire des propositions pour le valet rouge, et la dame noir ?
