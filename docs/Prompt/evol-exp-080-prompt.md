
## evol-exp-080-prompt.md

## Evols / Suivi
-git push down => projet lupin sur github
-idée de nom long pour le jeux : Les 7 Menhirs (ou Dolmens). Je suis en bretagne ou suis-je vraiment, il y a toujours un débat en tout cas pour Nantes.
	on pourrais même ajouter des règles marante par rapport duchesse anne + 3 autre reine/rois, une/un par couleurs
	par exemple reine + paire ou suite de la même couleur/non donne des nouvelles combinaisons
	calculer les proba par rapport au autres, brelan, couleurs, je pense que ça peut ajouter de la variété (30% suite couleur, 30% brelan, 30% couleur)
	il faut que ça soit différent des joker. sinon plus simple ce sont les jokers.
		une autre reine a trouver, pour en avoir deux. ça ajouterai du lore (fun fact historique).
	nouveau deck : 1-9 + Reine remplace le 10 pour rester sur 42 cartes
	a définir => propositions dans out/bretagne.html
	Ne rien modifier dans le jeux actuel, ça casserai probablement les bots/ihm.
-base ELO pour la version basic à 500 au lieu de 1000 (en tennis de table on commence à 500, ça me parlera plus)
	recalculer les autre ELO pour les bot plus fort
-Passer a l'étape deux du fichier next-steps.html dans les recommandations ?
	-Etape 1 - Pousser l'arbre => down ? (voir résultats des tests en suivant)
	-Etape 2 - Apprendre l'évaluation par auto-jeu (prévoir plusieurs lots => screen => validation)
		Budget de 2h pour commencé, soit 4 batchs/lots de 30 min, avec des analyse/ajustement intermédiaire.
		Autre setup/process ?

## Logs des tests ismcts @depth 4 & 5
PS E:\Dev\My projects\Lopin n°742> npm run duel -- ismcts+depth=4@800 ismcts@800 --long --page

> lopin-742@0.1.0 duel
> node scripts/duel.js ismcts+depth=4@800 ismcts@800 --long --page

  48 parties, ismcts+depth=4@800 58,3 % (41,6 % – 75,1 %), 383 s
  96 parties, ismcts+depth=4@800 55,2 % (44,2 % – 66,2 %), 747 s
  144 parties, ismcts+depth=4@800 53,5 % (47,2 % – 59,7 %), 1117 s
ismcts+depth=4@800 contre ismcts@800 — 144 parties (72 de chaque côté), règle claim-end, profil long, 1117.0 s
  ismcts+depth=4@800 gagne 53,5 %  (fourchette à 95 % par paires : 47,2 % – 59,7 % ; partie par partie : 45,3 % – 61,4 %)
  en commençant : 50,0 % · en second : 56,9 %
  paires : n = 72, moyenne 0.5347, écart-type 0.2697
  → pas de différence nette.
PS E:\Dev\My projects\Lopin n°742> npm run duel -- ismcts+depth=5@800 ismcts@800 --long --page

> lopin-742@0.1.0 duel
> node scripts/duel.js ismcts+depth=5@800 ismcts@800 --long --page

  48 parties, ismcts+depth=5@800 56,3 % (38,4 % – 74,1 %), 368 s
  96 parties, ismcts+depth=5@800 54,2 % (42,8 % – 65,6 %), 751 s
  144 parties, ismcts+depth=5@800 53,5 % (47,2 % – 59,7 %), 1135 s
ismcts+depth=5@800 contre ismcts@800 — 144 parties (72 de chaque côté), règle claim-end, profil long, 1134.8 s
  ismcts+depth=5@800 gagne 53,5 %  (fourchette à 95 % par paires : 47,2 % – 59,7 % ; partie par partie : 45,3 % – 61,4 %)
  en commençant : 51,4 % · en second : 55,6 %
  paires : n = 72, moyenne 0.5347, écart-type 0.2697
  → pas de différence nette.
PS E:\Dev\My projects\Lopin n°742> npm run duel -- ismcts+depth=4@1600 ismcts@1600 --long --page

> lopin-742@0.1.0 duel
> node scripts/duel.js ismcts+depth=4@1600 ismcts@1600 --long --page

  48 parties, ismcts+depth=4@1600 56,3 % (45,5 % – 67,0 %), 814 s
ismcts+depth=4@1600 contre ismcts@1600 — 48 parties (24 de chaque côté), règle claim-end, profil long, 814.0 s
  ismcts+depth=4@1600 gagne 56,3 %  (fourchette à 95 % par paires : 45,5 % – 67,0 % ; partie par partie : 42,3 % – 69,3 %)
  en commençant : 62,5 % · en second : 50,0 %
  paires : n = 24, moyenne 0.5625, écart-type 0.2683
  → pas de différence nette.
