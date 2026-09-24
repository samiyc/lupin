
## Test
-le bug drag & drop à bien été corrigé

## Replay
-Character ⏪⏩ coloré en bleu pour les step avant/arrière => Remplacé par les Charactères < et > 
-aller a la fin de partie puis faire retour d'un pas en arrière, la pioche reste vide (ok le reste du temps / cas particulier)
-Titre des replay a condenser. éviter les retour à la ligne si possible
	-Agrandir la side bar de gauche vers la droite de 20%
	-original:24/09/2026 01:57 · Sami contre Stratège 1.1.0 · Sami gagne
	-new     :(W) Sami -vs- Stratège 1.1.0								// Partie gagné => affiché le bouton en vert
			  Score:4-3. Durée:21min. 24/09/26 à 01h57          		// deuxième ligne en plus petit
			  ---
		      Sami -vs- Stratège 1.1.0 (W)								// Partie perdu afficher en rouge
			  Trois bornes connectés. Durée:21min. 24/09/26 à 01h57		// idem. deuxième ligne en plus petit
-6 replays dans la liste des parties récentes => 5 max (sans le scroll) ; ça permet de remonté les bouton de controle du replay actuellement en dessous, hors de l'écran.

## Timer
-Verifier que les temps sont enregistré dans les 3 derniers replay
-afficher les temps dans le récapitulatif, sous la gestion de la vitesse de lecture du replays
	-original: Joue 5♥ sur la borne 2 (borne vide ; rien en face).
	-new     : Joue 5♥ sur la borne 2 en 2min 30s (borne vide ; rien en face).

## AI bot
-Niveau du bot moyen/incertain, il faut effectuer plus de tests
