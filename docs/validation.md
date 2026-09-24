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
