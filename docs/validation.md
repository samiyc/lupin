# Valider vite, valider bien

Pourquoi les dernières tâches duraient plus d'une heure, ce qui a changé, et quelle
commande lancer selon ce qu'on veut savoir. Objectif : **une tâche complète en
moins de 30 minutes**.

## Où partait le temps

| Poste | Avant | Pourquoi |
|---|---|---|
| Tests (`npm test`) | 9 s | ce n'était pas le problème |
| Rapport (`npm run build`) | 3,5 min | un million de parties, relancé à chaque changement du Stratège |
| Duel entre deux robots rapides | 10 à 30 s | rien à redire |
| **Duel avec le Stratège 2** | **10 à 25 min chacun**, 4 ou 5 par tâche | chaque partie rejoue 64 fins de partie par coup ; 800 parties d'office, même quand l'écart était net au bout de 200 |
| Attentes navigateur | quelques minutes | onglet en arrière-plan : les minuteries sont ralenties à 1 s |

Les duels du Stratège 2 faisaient donc l'essentiel de l'heure. Ils étaient chers
pour deux raisons :
- le cœur, qui joue chaque fin de partie simulée, recalculait beaucoup pour rien ;
- rien n'arrêtait un duel dont le résultat était déjà clair.

## Ce qui a changé

**1. Le cœur est 2,4 fois plus rapide, et joue exactement les mêmes coups.** Le
profil montrait qu'un seul coup demandait environ 500 fois la même estimation,
pour une quarantaine de paires de cartes différentes. Il recopiait aussi tout le
contexte pour chaque carte essayée.
- Une mémoire par coup, la main passée sans copie : 19,3 → 8,0 ms par partie du
  cœur, et 8,5 → 3,5 s par partie du Stratège 2.
- **Garantie** : `npm run fingerprint` joue des parties à graine fixe et calcule
  une empreinte de chaque coup. Une optimisation doit la laisser identique.

| Empreinte de référence (150 parties, 3 pour le Stratège 2) | Valeur |
|---|---|
| `strategist,greedy` | `abf3bc51801c81b4` |
| `strategist,strategist:1.1` | `61af1f11a5c2e46d` |
| `lookahead,strategist` | `9225bb33224f2147` |

**2. Les duels ont deux profils, avec arrêt anticipé et plafond de temps**
(`scripts/lib/duel-plan.js`, testé).

| Profil | Pour quoi faire | Robots rapides | Robots qui cherchent | Plafond |
|---|---|---|---|---|
| `--quick` (par défaut) | trier des idées | 1 000 à 4 000 parties par côté | 30 à 100 | **5 min** |
| `--long` | décider une version | 4 000 à 12 000 | 150 à 400 | **20 min** |

- Le duel joue par rondes et s'arrête dès que le résultat est net. Pendant qu'il
  regarde en cours de route, il exige une fourchette à 99 %, parce que regarder
  plusieurs fois flatterait le hasard.
- À la fin, il donne la fourchette à 95 % de ce qu'il a eu le temps de jouer.
- Le plafond est vérifié entre deux rondes : la dernière ronde peut le dépasser
  d'une minute environ.
- `--games N` joue exactement N parties par côté, sans limite de temps.

**3. Donnes en miroir.** Chaque paquet est joué deux fois, chaque robot à son tour
en premier, comme au bridge en « duplicate ».
- La chance des cartes s'annule, et un écart devient net plus tôt.
- La fourchette affichée ignore ce gain, elle est donc plutôt prudente.

## Quelle commande pour quoi

| Je veux… | Commande | Durée |
|---|---|---|
| vérifier le code | `npm run check` | 20 s |
| savoir si une optimisation change le jeu | `npm run fingerprint -- strategist,greedy 150` | 2 s |
| trier une idée du cœur | `npm run duel -- idea:X strategist` | < 1 min |
| trier une idée du Stratège 2 ou de l'Expérimental | `npm run duel -- experimental:400 stratege` | ≤ 5 min |
| décider une nouvelle version | `npm run duel -- A B --long` | ≤ 20 min |
| régénérer rapport et fiche | `npm run build && npm run pdf` | 4 min |
| savoir si plus de temps de réflexion aide | `npm run time-study` | 8 min |
| faire jouer l'Expérimental contre lui-même | `npm run selfplay` | 20 min au plus |

**Règle de conduite.**
1. Une idée se trie d'abord en `--quick`, sur le cœur si possible (secondes plutôt
   que minutes).
2. Seuls les finalistes passent en `--long`, une fois.
3. Le rapport ne se régénère que si le cœur (`strategist`) change de coups : ce
   n'est pas le cas pour le Stratège 2 ni pour l'Expérimental.

## Premier résultat sous ce régime

- L'Expérimental avec 400 fins de partie par coup (environ 1 s par coup) bat le
  Stratège 2.1 dans **62,5 %** des parties (fourchette 52,5 % – 71,5 %).
- Mesure : 96 parties en 6 minutes, profil rapide avec donnes en miroir.
- Dans le navigateur, il dispose de 10 s par coup, et il réfléchit aussi pendant
  ton tour (`docs/jouer.md`).

## Plus de temps = meilleur ? (`npm run time-study`)

Des parties entières à 30 s par coup ne tiennent pas en 20 minutes : il en
faudrait des centaines pour voir une différence. La question se pose donc **coup
par coup**, sur 160 positions tirées de l'auto-jeu.

La recherche peut s'arrêter à tout moment. Une seule recherche va donc jusqu'à
une référence de 60 s, et on note le coup qu'elle jouerait à 5, 10, 15, 20 et
30 s.
- Les temps sont convertis en simulations au débit mesuré dans le navigateur :
  164 simulations par seconde.
- Les notes de la référence disent ce que coûte un autre coup.
- Durée totale de l'étude : 7,6 minutes.

| Temps par coup | Même coup que la référence (60 s) | Perte moyenne par coup | Arrêt anticipé (coup évident) |
|---|---|---|---|
| 5 s | 90,0 % | 0,11 point de victoire | 27 % |
| **10 s** | **92,5 %** | **0,05** | 36 % |
| 15 s | 94,4 % | 0,03 | 37 % |
| 20 s | 95,6 % | 0,03 | 41 % |
| 30 s | 97,5 % | 0,01 | 44 % |

**Lecture.**
- Sur une partie de 21 coups, passer de 5 à 10 s gagne environ 1 point de
  probabilité de victoire.
- De 10 à 30 s, moins d'un point : le bruit reprend le dessus sur des coups déjà
  bien jugés.
- Un tiers des coups sont évidents : la recherche s'arrête d'elle-même avant la
  limite.
- **La limite reste à 10 s.** Plus de temps n'apporterait presque rien.
- Limite de la méthode : la « perte » est estimée par la référence elle-même, qui
  a son propre bruit. Un duel 10 s contre 20 s demanderait plus d'une heure pour
  la confirmer.

**Le duel qui tranche** (Sami, 30/09, `npm run duel -- experimental:4000
experimental:400 --long`, 48 parties en 13 minutes) : 4 000 simulations par coup
gagnent **37,5 %** (fourchette 25,2 – 51,6 %) contre 400. Dix fois plus de
simulations ne rapportent rien, et peut-être moins. La page (10 s, soit 3 000 à
5 000 simulations) n'est donc pas plus forte que le classement mesuré à 400.

**Pourquoi** (`npm run bench -- 4000`, contre `-- 400`) :
- **Sur les puzzles difficiles**, la recherche trouve le coup gagnant **30 fois
  sur 60**, à 400 comme à 4 000. À 4 000, elle s'arrête même plus tôt, sûre
  d'elle, sur le mauvais coup. Le budget amplifie le jugement des simulations ;
  il ne le corrige pas.
- **En milieu de partie**, à 4 000 simulations, les trois graines choisissent
  encore des coups différents dans 4 positions sur 12. Les meilleurs candidats
  se valent à quelques pour cent près : les départager ne change pas la partie.

**L'étalon de la politique** (`npm run policy`) : sur 400 fins de partie
décisives de l'auto-jeu (9 cartes ou moins, vérité donnée par le solveur), la
politique qui joue les simulations garde le coup gagnant dans **94,3 %** des cas,
et **87,5 %** sur les positions délicates, où la moitié des coups ou moins
gagnent. C'est la mesure de départ de la 0.8, qui travaille la qualité des
simulations et non leur nombre.

**Les duels à la règle de la page** (`--page`) ne coûtent rien de plus : 190,8 s
contre 194,1 s pour les mêmes 48 parties. Les parties plus courtes paient les
preuves de revendication.

## Des duels plus courts ? (profil `--screen`, fourchette par paires)

Pour essayer plus d'idées, deux pistes ont été mesurées le 30/09 sur un même duel,
`experimental@200` contre `experimental@400`, 10 minutes, règle de la page.

- **Trier à 200 simulations** : 200 contre 400 gagne **45,8 %** (38,4 – 53,3 %),
  soit pas de différence nette. Le budget change peu le classement, comme le
  disait déjà le duel 4000 contre 400. Le tri des idées se fait donc à 200
  simulations : deux fois plus de parties dans le même temps.
- **La fourchette par paires** (chaque donne jouée des deux côtés, la paire
  comme unité, `pairedInterval`) : 14,9 points de large contre 16,1 partie par
  partie. Seulement **8 % plus étroite** : entre deux robots proches, la chance
  des donnes pèse moins que prévu. Elle reste la fourchette de décision, car
  c'est la bonne analyse d'un plan apparié, mais elle ne suffit pas à diviser la
  durée par deux.

**Protocole retenu.**
- **Tri** : `npm run duel -- candidat@200 référence@200 --screen --page`, 10
  minutes au plus. Un candidat passe s'il atteint 52 % ou plus.
- **Confirmation** : `npm run duel -- candidat référence --long --page`, 20
  minutes au plus, 400 simulations. La version monte si la borne basse de la
  fourchette par paires dépasse 50 %.

Les identifiants de moteur se combinent :
- `experimental+sample=0.05+prior=0.15`, pour les variantes ;
- `experimental:0.8-lite@200`, pour le budget ;
- `ismcts+depth=2`, pour la recherche en arbre.
