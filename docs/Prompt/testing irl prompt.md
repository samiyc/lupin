
-- Test IRL
J'ai fait des tests en reel, j'ai séparé le deck de 42 cartes (4x10 + 2) en deux puis j'ai jouer la main de 6 + pioche jusqu'a la fin, dans les 7 colonnes. puis j'ai fait la même chose avec l'autre moitier du paqué de carte, en essaillant de maximiser le score. de cette manière je peux reproduire dans les grande ligne une partie sans avoir a alterner entre la main des deux joueurs. je n'ai pas joué pour gagner les bornes mais plutot pour maximiser le score par groupe de 3 cartes, sur les 7 bornes. Il y a une différence cependant pour la ligne du haut je n'ai pas d'information sur ce qu'il reste dans la pioche. Pour la deuxième partie, du bas, je voie une grande quantité des cartes sur la table, je peux les compter et je peut patienter pour obtenir les bouts qui manque pour finir mes suites coloré.

-- Analyse des images
Tu pourrais faire une analyse des images tu devrais pouvoir récupérer 10 (images) x 2 (lignes) x 7 (bornes) => 140 séquences de trois cartes.
L'idée serai de voir il y a des grosse différence par rapport au math et aux simulations via les bots.

-- Ressenti en jeu
La combinaison couleur et beaucoup plus présente dans cette version, par rapport a la version rapide (6x7) ou les brelan étais plus présent.
ce qui confirme les statistiques. Le joker n'a de sens que pour les brelan. les combinaison suite/somme sont minoritaire.
Je commence souvent par poser des cartes dans chacune des des 4 couleurs en évitant les bout (1 et 10) afin de maximiser les chances de suite dans les quatres couleurs.
Je garde le joker jusqu'au moment ou j'ai une pair pour faire un brelan. en général si j'ai le choix entre des pairs sans joker et des cartes qui se suivent dans une même couleur, je n'hésite pas, je part sur la combinaison couleur en priorité, a moins qu'il n'y ai plus de cartes de cette couleurs dans la pioche. J'ai l'impression que c'est un peut plus simple de faire des suite de la même couleur que dans la version rapide (6x7). Tu pourrais ajouter certaine de ces stratégies dans le code du bot, ou c'est déjà pris en compte ?

-- Dans le PDF
tu peut enlever la section concernant la version qui utilise le jeux de tarot, cette version avec le jeux de 52 cartes marche bien. Je préfèrerai remplacer cette section par des informations sur les statistiques que l'on a déjà calculer comme les valeurs 'Part des bornes gagnées, par rang de la combinaison' et les pourcentage pour 3 / 6 cartes au hasard. J'ajouterai également la tips que le joker doit être réserver pour les brelans en priorité.
