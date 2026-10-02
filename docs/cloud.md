# Faire tourner les calculs ailleurs : cloud, portable

Les traitements longs (`npm run backlog`) occupent tous les cœurs du PC fixe
pendant des heures. Ce document dit comment les envoyer sur un serveur loué à
l'heure, ou les confier au portable, et ce que cela coûte.

## Quand passer au cloud

- **Tant que le backlog tient dans les nuits**, le PC fixe suffit. Son
  refroidissement liquide (triple ventirad) supporte la charge sans souci.
- **Le cloud devient utile** quand le backlog reste plein d'une nuit à
  l'autre, ou quand le PC doit servir pendant un calcul.

## Ce que ça coûte

Ordres de grandeur relevés le 03/10/2026, **à vérifier sur les pages de
tarifs** avant de louer : ils changent souvent.

| Offre | Machine | Prix approximatif | Une nuit de 8 h |
| --- | --- | --- | --- |
| **Hetzner Cloud, vCPU dédiés (CCX)** — recommandé | 16 à 48 vCPU | ≈ 0,15 à 0,60 €/h | ≈ 1,5 à 5 € |
| AWS ou Google Cloud, instances « spot » | 32 vCPU | ≈ 0,5 à 0,8 $/h | ≈ 4 à 7 $ |
| AWS ou Google Cloud, à la demande | 32 vCPU | ≈ 1,3 à 1,8 $/h | ≈ 10 à 15 $ |

- **Repère** : le PC fixe (Ryzen 9 3900X, 12 cœurs, 24 fils) fait à peu près le
  travail d'une machine de 32 vCPU dédiés ; une de 48 vCPU va environ 1,5 fois
  plus vite.
- **Choisir des vCPU dédiés.** Sur des vCPU partagés, le voisin ralentit le
  calcul, et les temps des duels « à la montre » (`@t1400`) deviennent faux.
- **Une instance « spot »** est moins chère mais peut être coupée à tout moment.
  Ça passe ici : un traitement ne dure pas plus de 2 h, et l'oracle reprend là
  où il s'est arrêté. Une coupure perd au pire le traitement en cours.
- **Un serveur se paie tant qu'il existe, même éteint** (chez Hetzner
  notamment). À la fin d'un lot, on le **supprime**, on ne se contente pas de
  l'éteindre.
- **La carte graphique ne sert à rien ici.** Le moteur est une recherche en
  arbre écrite en JavaScript, pleine de branchements. Une carte graphique
  n'aiderait que pour un réseau de neurones, ce qui serait un autre projet.

## Ce qu'il faut sur le serveur

Presque rien :
- **Le projet ne dépend d'aucun paquet pour tourner.** Les dépendances npm ne
  servent qu'aux tests et au lint, donc pas besoin de `npm ci` pour calculer.
- **Node 20.**
- **Le code** : le dépôt git, ou une copie du dossier.
- **Les parties gardées** : `duels/`, environ 37 Mo, absent de git. Il faut le
  copier à part.

Ce qui revient du serveur après un lot :
- `backlog-runs/` (les sorties) ;
- `oracle/` (les positions lues) ;
- `data/backlog.json` (les statuts) ;
- les fichiers de `data/` que les traitements réécrivent (`error-impact.json`,
  `oracle-diffs.json`…).

## Mise en place, une seule fois

**Ce que fait Sami** (Claude n'a pas le droit de le faire à sa place) :
1. **Créer le compte** chez l'hébergeur et y entrer le moyen de paiement.
2. **Ajouter la clé SSH publique** dans la console de l'hébergeur. Claude peut
   générer la paire de clés sur le PC (`ssh-keygen -t ed25519 -f
   ~/.ssh/lopin_cloud`), et Sami colle la partie publique (`.pub`) dans la
   console. La partie privée ne quitte jamais le PC.
3. **Pour que Claude puisse créer et supprimer les serveurs lui-même** :
   installer l'outil de l'hébergeur (`hcloud` pour Hetzner) et le connecter
   avec un jeton d'API, en le tapant soi-même (`hcloud context create lopin`).
   Claude ne manipule jamais le jeton.
   Sans cet outil, Sami crée et supprime le serveur depuis la console web.

**Le serveur** : Ubuntu 24.04, la clé SSH ci-dessus, et un pare-feu qui
n'ouvre que le port 22. Node 20 s'installe ainsi :

```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs tmux
```

## Un lot, pas à pas

**Ce que Claude peut faire seul** une fois la clé en place, puisque ce sont des
commandes `ssh`, `scp` et `tar` lancées depuis le PC :

1. **Envoyer le code et les parties**, depuis le dossier du projet :

   ```sh
   tar czf - --exclude=node_modules --exclude=.git . | ssh -i ~/.ssh/lopin_cloud root@<ip> "mkdir -p lopin && tar xzf - -C lopin"
   ```

2. **Lancer le backlog** dans une session `tmux`, qui survit à la
   déconnexion :

   ```sh
   ssh -i ~/.ssh/lopin_cloud root@<ip> "cd lopin && tmux new -d -s backlog 'npm run backlog 2>&1 | tee backlog.log'"
   ```

3. **Suivre l'avancée** : `ssh … "cd lopin && npm run backlog -- --list"`.
4. **Rapatrier les résultats** à la fin :

   ```sh
   ssh -i ~/.ssh/lopin_cloud root@<ip> "cd lopin && tar czf - backlog-runs oracle data" | tar xzf -
   ```

5. **Relire, intégrer, faire le commit** sur le PC, comme pour un lot de nuit
   local.

**Ce qui demande l'accord de Sami à chaque fois** :
- **créer un serveur**, parce que ça engage de l'argent ;
- **le supprimer**, parce que c'est définitif.

Claude annonce la machine, le prix horaire et la durée prévue, puis attend un
oui.

**La sécurité** :
- connexion par clé seulement, sans mot de passe ;
- aucun secret dans le dépôt, ni dans ce qui part sur le serveur ;
- le serveur supprimé dès le lot fini.

## Le portable

Le portable (4 cœurs, 8 fils) fait environ le tiers du travail du PC fixe. Pour
qu'il ne chauffe pas trop sur la durée, on limite le nombre de fils de calcul
avec **`LOPIN_THREADS`**, qui vaut pour tous les scripts :

```sh
LOPIN_THREADS=4 npm run backlog
```

- **Sur 4 fils**, il garde de la marge. On surveille la température les
  premières fois, avec l'outil du fabricant ou HWiNFO.
- **Sur une surface dure**, jamais sur un lit ou un canapé.
- **Il faut lui donner un travail à part.** Deux machines ne se partagent pas
  automatiquement la même file. On lui confie un traitement qui ne dépend pas
  du reste, par exemple une passe `error-impact`, avec sa propre copie du
  projet et de `duels/`. On rapporte ensuite son fichier de `data/`.

Le même réglage sert au PC fixe : `LOPIN_THREADS=16` laisse quelques cœurs
libres pour travailler pendant un calcul.
