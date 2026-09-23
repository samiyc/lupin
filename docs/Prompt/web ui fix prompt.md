
### UX / UI
-je ZOOM l'ui à 125%. ce serai bien que ce soit comme ça en 100%. j'ai du mal a lire les textes/cartes en petit
-BUG: Pb de drag & drop déplacement de la mauvaise carte sur le board, ok via clic sur la carte, puis clic dans la colonne de destination. Au début ça fonctionnais bien, pb de reset entre game ?
-symboles des cartes cachés dans les piles de 3 cartes
	-améliorer hover info text => plus visuel.
	-hold-bouton highlight rapide des cartes de la couleur pique/coeur/trefle/carreau, en haut a droite, sur la ligne des cartes de l'adversaire ?
		-Compter/afficher le nombre de carte de chaque couleurs en jeux (10 cartes par couleurs)
	-ou encore plus simple afficher en haut a droit de la carte caché le symbol uniquement si le symbole est différent de la carte du dessus
-tri par couleur alterner les Rouge/Noir, pique, coeur, trefle, carreau, joker
-pioche à 0 cartes => griser la pioche (pioche vide)
-timer par coup/game (discret), stop si changement de fenètre active (prise de note), pour identifier les coup les plus long dans les logs
-score dans le nom du fichier ? xxx_4-3.json ; remplacer le chiffre par un 'B' si victoire par trois bornes consécutive xxx_B-4.json

### Replay
-Bouton start/end du replay (pour checker le résultat à la fin et le reset vers le début)

### Strats
-deuxième joueur. contré bornes adverse. avec un valeur supérieur si possible. poser sur une case vide c'est potentiellement être contré par l'adversaire avec la même formule légèrement supérieur 456 vs 567, 444 vs 555.
-best move priority sur les trois bornes du milieu. utiliser uniquement ces emplacement si les trois cartes du brelan son garantie en mains ou deux carte qui se suivent de la même couleur pour la suite+couleur, avec deux bout non utilisé sur le bord (combinaison forte > supérieur a couleur simple). ex:777 ou 45 de coeur si 3 et 6 de coeur ne sont pas présent sur le board.
	-Utiliser les bornes sur les deux bord si la main n'est pas prométeuse, et que l'indice de confiance est faible. Eviter d'avoir plusieur fois le même chiffre dans plusieur colonnes si il n'y a qu'une carte dans ces colonnes => potentiel brelan raté.

### Analyse des parties jouées
-Analyser des 15 dernier replays
