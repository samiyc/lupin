
## Evolutions
- debut de partie. tri auto des cartes dans la main de base par couleur
- Lors de la lecture du replay. idem, tri auto des cartes dans les mains de base par couleur, puis ajouter les bouton Trier, par couleur ou par valeur (les mains des deux joueurs)
	Ajout des nouvelle cartes sur la droite de la main => Parfait/RAS
- Ajouter hold-button + counter 0/2 pour les Joker en haut a droite juste après carreau

### analyse des replay de Stratège 2.0
J'aimerai que tu ajoute/modifie les tests et les doc concernant la stratégie/estimation des main/cartes pour couvrire les cas suivant.
j'ai repéré quelque erreurs dans la stratégie du bot, en regardant des replays.

2026-09-24_11-28-41_sami-vs-stratege_B-3.json 
	Tour 1-9: Le bot à une brelan en main de départ 22J, un deuxième 33J (tour 5), et un troisième 88J (tour 9) avec les deux joker et ne les joue pas.
		les joker n'ajoute aucune valeur pour les suite couleur, il faut jouer les brelan pour vider la main et obtenir des nouvelle cartes
		je pense que c'est ok de jouer les brelan sur les bornes 2-3-5-6. J'aurais tendance a placer mes suite couleur sur les bornes 3-4-5
		et les suite/sommes sur les bornes 1 et 7.
	Tour 9: Jouer un 10Coeur en plein milieu c'est très mauvais avec la main actuel. 10 est un bout.
		la seul solution pour faire une suite couleur c'est d'obtenir les cartes 8 et 9 de coeur. 10=max. même logique pour un 1.
		on a le 8 de coeur en main, mais attendre le 9 de coeur c'est une seul carte dans toute la pioche.
		si je place un cartes sur les bornes 3-4-5, il me faut deux cartes qui se suivent en main entre le 2 et le 9, 23 jusqu'a 89.
		il faut également faire attention que le 1 ou le 4 de la série 23 ne soit pas déjà sur le terrain.
		c'est le meilleur moyen d'avoir 2 cartes dans la pioche qui débloque soit 123 ou bien 234.
		si ces deux cartes arrivent chez mon adversaire je part sur une simple couleurs (sans suite), pour sauver la situation.

2026-09-24_12-05-14_stratege-vs-sami_3-B.json
	Tour 14: Le bot rempli toutes les 7 bornes. c'est une grave érreur aussi tot dans la partie. on prend le risque de piocher une suite couleur ou un brelan dans le reste de la pioche
		qui ne matchera pas avec les cartes déjà posé. A voir ce que je fait dans les parties que je gagne pour être sûr des valeur mais de mémoire je garde toujours
		deux bornes de vide en début-milieu de partie. puis une seul de libre vers la fin de partie. ça offre plus de flexibilité
	Tour 6: Grave erreur de jouer le 9Pic sur la borne 5 quand le 8Pic est sur la borne 4.
		Garder la carte en main peut être ok pour cacher à l'adversaire que l'on à une suite couleur de planifié, dans une colonne. ce qui limite les contres.
		actuellement on à le 8 et le 9 de pic en main. ce qui offre les option 7-8-9 et 8-9-10 à pic (meilleur score possible !). Ce sont litérallement les meilleurs cartes de la main.
		a ne pas confondre avec les cartes 9-10 de coeur qui dépent d'une carte unique pour obtenir la suite, le 8 de coeurs (dans la main adverse !)

2026-09-24_12-50-13_sami-vs-stratege_3-B.json
	Tour 11: le joker est en main, la logique change. comment on peut faire un brelan avec cette main. 11J sur les bornes 3-4-5 ou 88J sur la borne 6, ou 22J sur la borne 1.
		Au lieu de bloqué une nouvelle bornes pour un brelan faible de 11J, je prérères les autre option. Je partirai plutot sur 22J sur la borne 1 pour vider la main
		et garder les 8 car ce sont des cartes forte en cas de litige couleur vs couleur par exemple. Au contraire je partirai sur 88J si je vois qu'en jeu
		les 6 et 9 de trefles sont déjà joué. dans ce cas je ne peut plus faire de suite-couleur (7-8 max), le brelan devient le meilleur score possible pour cette borne 6.
