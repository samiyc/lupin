
## evol-exp-070-prompt.md

## git
tu peut me redonné le process et les commandes pour upload le projet sur mon
gitlab personnel (https://github.com/samiyc/) et push ?

## Plafond de verre ??? Projet dernière chance, pour ISMCTS et TLC
on va essayer d'aller plus loin avec les deux première candidats ISMCTS et TLC (tirent leur coup)
je pense que le budget de simulations par coup à 400sim/1s par coup limite les algorithms
à la version 0.7 (plafond de verre ?). il faudrait re-tester avec 800sim/2s par coup pour être sûr.
il faut relancer des essais assez court sur 200 parties, et viser une limite de 10min pour voir
si les scores montes significativement. puis si le min de la fourchette est proche de 50% confirmation sur 20min.
si toujours KO, test avec 2000sim/5s sur 100 parties et 5 min ? ou faut-il commencer par ce test 5s vs 2s (précédent) ?
Est ce que cette approche à déjà été testé ?

## Stratégie long terme des montée de versions
au dela de ces deux candidats, je pense que long terme, il nous faut de nouveau cas spécifiques puzzle/tests,
pour couvrire les derniers 5% des cas particulier qui pause problèmes,
beaucoup d'évaluations identiques par exemple à la fin du budget temps. et cela pour chaque monté de version.
pour couvrire les 3%, puis 2% puis 1% des cas restant etc...

une fois ces nouveau test/puzzle ajouté au mix et analyser en profondeur offline, il faut ajuster
les policys/règles de la nouvelle version live du bot avec le budget limité,
pour essayer de battre la version courante du bot (ici la 0.7).
version courante qui en théorie devrais se retrouvé obligé de choisir aléatoirement face aux situation complex.

## Mixture of expert
pour ce dernier point je suis un peut hésitant (gain vs complexité).
on ppourrais prendre l'approche mixture of expert des IA ?
l'idée est de spécialiser le bot en trois expert distinct optimisé pour le début, milieu
et fin de partie. pour les tours 1-14, 15-29 et 30+ par exemple, à définir. de cette manière on évite de calculer
trops de règles qui ne sont pas adapter a la situation ?

## Répertoire des ouvertures
il faudrait également créé le répertoire des ouvertures (500mo max dans un premier temps, ingoré de git)
il faut faire attention à la duplication des ouvertures (entre couleurs)
et à ce que le temps de recherche/récupération reste court.
si ça marche bien on pourra tester de monté jusqu'a 1Go+ ?

## self-play ou deeper tree search => Report
tu pourrais me présenté et comparer ces idées/potentiel à celle que j'ai listé au dessus ?
met tout ça dans un résumé bien présenté/intéractif en html.
