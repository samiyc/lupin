

## evol-exp-090-prompt.md


## 0.9 evols
- l'élargissement progressif combiné au 0.9
- faire réfléchir le robot de la page sur plusieurs fils en parallèle
- tester dans chrome, ouvert actuellement.
	j'ai fait un match 0.9vs0.9 + ReplaySave => ça ma l'air ok
- d'autre évolutions que j'aurais pu avoir oublié et que l'on ai pas encore testé ?

## bot replay fix
- ajouter les infos concernant les tour de transition/charnières, remplissage des 7 collones
pour le joueur A/B tour T, première borne gagné par A/B + tour T,
la pioche est vide => pas besoin de renseigné, toujours tour n°30.
	- Est ce que les tours charnières sont déjà renseigné dans les replays des bots ?
	- par exemple, l'idée est de pouvoir retrouver rapidement 100 replays
	perdant en fin de partie et de tester/comparer depuis la prise de la première borne
	avec un nouvel algo/core etc.
	- ou filtrer sur la puissance des main de départ puis partir d'une autre phase/transition
	- Ce qui évite de recalculer les début de partie, pour les duel long
- est ce que tu compare les seed avant de sauvegarder un nouveau replay ?
	j'aimerai éviter les doublons
	
## implémenter et tester mid-game start => Test changement de stratégie
-rejouer une partie a partie a partir d'un tour de transition en milieu de partie
	puis vérifier que l'a fin de partie ce déroule de la même manière pour comparer.
	choisir une autre carte/borne (un mauvais coup) que celle du replay et vérifier
	que la fin change bien.
-par curiosité a quel tour une erreur dans le choix de la carte
	serai le plus impactant sur la fin de partie ?
	La question soujacente est, si c'est un tour/situation important/critique
	par rapport a la fin de partie,	il faudra problement faire attention
	lors des partie futur si c'est une situation qui reviens souvent,
	et que l'on arrive a filtrer

## clean up
-clean up du code, maj des docs
-supprimer le dossier 'real life test' et son contenu
-checker/supprimer les autres dossiers ancien/inutile
