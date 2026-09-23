
-- Test IRL to WEB
J'aimerai jouer dans le navigateur contre le/les bot en local, avec les régles officiel (4*10+2 Joker inc.). Ca permettra d'avoir un suivi tour par tour plus rigoureux.
Dans une IHM Simple/Sobre. J'aimerai pouvoir drag&drop les cartes depuis la main vers une des 7 bornes, et déplacer les carte dans ma main pour les organiser par couleur etc.
Il me faudrais également un bouton reset avec validation, pour recommencer la partie (en cas de reset pas besoin de sauvegarder le replay).
Je te laisse le choix des technologies web, pour que ça s'intégre bien avec le reste du projet.

Il faut afficher le numéro du tour et le nombre de cartes restantes dans la pioche
Il faut pouvoir sélectionner si l'on est le premier joueur ou le second en début de partie.
On ne check les bornes et les point uniquement en fin de partie. il faut déplacer les bornes vers le joueurs qui a remporter la section de la frontière. la borne devient verte si c'est gagné, rouge si perdu, par défaut les bornes sont grises. ce serai bien d'avoir un dos de carte avec des zebra (similaire au html des règles) pour la pioche et la main adverse (cachée).

-- Mode observateur des Bots
J'aimerai aussi pouvoir regarder les bots jouer entre eux à une vitesse résonable, avec un bouton lecture/pause et une option next step, pour identifier visuellement si il y a des erreur majeurs de stratégie. Si l'on est en mode observateur les mains des deux joueurs sont visible.

-- Replay
Pour chaque parti joué contre le bot j'aimerai qu'une log éxostive soit générer et sauvegarder automatiquement pour cibler les point fort/faible des deux joueurs.
par exemple, au tour X avec ces 6 cartes en main, le joueur choisi de jouer la carte X dans la colonne n°1-7 qui étais vide ou non et dire si il y avais des cartes de l'autre coté de la borne, etc. ça permettera de compléter les analyse et de renforcer la stratégie du bot. Je te laisse choisir le contenu des logs, suivi des cartes pioché, les actions.
J'aimerai pouvoir relire en mode observateur le replay des logs d'une partie précédente, lecture/pause/nextStep. Je pense qu'il faudra exclure les replays de git, sauf si un replay important doit être conservé pour les analyses / stats / Cas particuliers.

-- Versions
Je pense qu'il va falloir nommé/versionner les versions du Bot pour que l'on puis comparer les différente générations et les variantes ?
Honnetement je pense que dans un premier temps on peut garder trois versions majeurs:
-Une version basic, recherche de la meilleur valeur a l'instant T.
-Une version stratégique, long terme, stable
-Une version test/expérimental (test des nouvelles stratégies)

-- Doc & Tests
Le projet commence a grossir, il va falloir être vigilant sur les bonnes pratiques pour que code reste lisible et maintenable au long term.
