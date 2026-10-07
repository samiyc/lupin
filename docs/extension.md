# L'extension : six cartes bonus

Première mouture (Sami, 07/10, `docs/Prompt/roadmap-1.2-and-extension.md`). Le jeu de base ne
change pas : l'extension **ajoute** des cartes à la pioche, et chacune change la règle **d'une
borne**. Le but de cette mouture est d'en vérifier la faisabilité et de **mesurer l'équilibre**
avant de toucher à la page ou à la règle imprimée.

## Ce qui ne change pas

- 42 cartes (As à 10 dans quatre couleurs, 2 jokers), 7 bornes, 3 cartes par côté, une main de 6.
- Les combinaisons et leur ordre : Suite couleur, Brelan, Couleur, Suite, Somme. À égalité de
  combinaison, la plus grosse somme ; à égalité de somme, le premier côté complet.
- La revendication : on gagne une borne dès que son côté est complet et qu'aucune fin du côté
  adverse ne peut le battre, preuve faite avec les seules cartes de la table. **Une borne
  revendiquée ou gagnée est définitive** : aucune carte bonus ne la touche plus.
- La victoire : 4 bornes, ou 3 côte à côte.

## Ce qui s'ajoute

On choisit combien de cartes bonus on mélange à la pioche : **de 0 à 6**, dans la page comme sur
table (tirées au hasard parmi les six quand on en prend moins).

- **Une carte bonus se pioche comme une autre** et compte dans la main de 6.
- **La poser est le coup du tour** : on la pose, face visible, **à droite de ses trois cartes**,
  à côté d'une borne, puis on pioche. On ne pose pas de carte numérotée ce tour-là.
- **Seulement à côté d'une borne non décidée** (ni revendiquée, ni gagnée). Elle peut aller à côté
  d'un côté déjà complet : c'est le moyen de retourner une borne mal partie.
- **Une figure au plus par borne et par joueur** : 7 au plus pour chacun.
- Elle reste là jusqu'à la fin et montre que cette borne joue avec une autre règle.

**Le matériel** (Sami, 07/10) : les 12 figures du paquet ne suffisent pas pour 7 bornes et 6 cartes
bonus. Les bornes deviennent des jetons, ou les figures d'un autre paquet.

## Les six cartes

| Carte | Effet | Pour qui |
| --- | --- | --- |
| **Valet de Trèfle** | **La plus faible gagne** : sur sa borne, la combinaison la plus faible prend la borne. À égalité, le premier côté complet, comme d'habitude. | les deux côtés |
| **Valet de Carreau** | **La Somme** : sur sa borne, les combinaisons ne comptent plus, la plus grosse somme gagne. | les deux côtés |
| **Dame de Cœur** | **L'Échange** : sa borne échange sa place avec **n'importe quelle autre borne non décidée**, cartes et figures des deux joueurs comprises. La Dame reste avec la borne à côté de laquelle on l'a posée : elle n'occupe que cette place-là, l'autre borne garde sa place libre pour une figure. | les deux bornes |
| **Dame de Pique** | **Le Rappel** : reprendre en main une de ses propres cartes d'une borne non décidée. | celui qui la pose |
| **Roi de Pique** | **La Couleur impaire** : sur sa borne, trois cartes **impaires** d'une même couleur, qui se suivent ou non (1-3-7, 3-5-9, 1-7-9), forment une combinaison **au-dessus de la Suite couleur**. Un joker, sans couleur, ne peut pas en faire partie. | celui qui le pose |
| **Roi de Carreau** | **+10** : sur sa borne, à combinaison égale, une Suite ou une Suite couleur compte 10 de plus dans sa somme. 5-6-7 + 10 = 28 bat 8-9-10 = 27 ; 1-2-3 + 10 = 16 perd contre 8-9-10 mais bat 4-5-6. Le Brelan et la Suite couleur restent au-dessus d'une Suite. | celui qui le pose |

Choisis par Sami le 07/10 : La Somme (le pendant simple du Valet de Trèfle) et Le Rappel (corriger
une erreur sans toucher au jeu adverse), parmi trois propositions chacun ; l'Échange vers
n'importe quelle borne non décidée, parce qu'il est moins fort que les autres ; la Couleur impaire
sans suite, parce que trois impairs d'une couleur sont déjà assez rares.

**Les jokers** gardent leur règle : sans couleur, ils prennent n'importe quelle valeur. Sous La
Somme, un joker vaut la valeur qui l'arrange, comme ailleurs.

## Les points encore ouverts

1. **Deux figures sur une même borne.** Chaque joueur peut en poser une : que se passe-t-il quand
   elles se rencontrent ? Proposition : elles se cumulent dans un ordre fixe.
   - les Rois d'abord : chacun change ce que vaut le côté de celui qui l'a posé ;
   - puis La Somme : on ne compare plus que les sommes ;
   - puis le Valet de Trèfle : il inverse le résultat.

   Exemples : Valet de Trèfle et La Somme ensemble, la plus petite somme gagne. Valet de Trèfle
   contre un Roi de Carreau : le +10 devient un handicap pour celui qui l'a posé.
2. **Le Rappel : piocher ou non ?** Poser la Dame est le coup du tour, puis on pioche. Mais la carte
   rappelée revient en main : on finirait à 7 cartes. Proposition : **pas de pioche** après un
   Rappel, la main reste à 6. Et la Dame se pose à côté de la borne d'où l'on reprend la carte.
3. **Le Rappel sur un côté complet** : permis ? Le côté redevient incomplet, et quand il se
   complète à nouveau, c'est cette nouvelle fois qui compte pour départager une égalité.
   Proposition : oui.
4. **Le Roi de Pique : son nom.** Sans suite, ce n'est plus une « Suite impaire » : je propose
   « la Couleur impaire ». Et entre deux Couleurs impaires, la plus grosse somme gagne, comme
   ailleurs.

## La suite

1. Le moteur : les figures comme cartes en plus du paquet, `border.figures`, un seul point de
   jugement par borne et par côté (`evaluatorFor`). Avec 0 carte bonus, les empreintes du jeu de
   base ne bougent pas.
2. L'équilibre : `npm run extension`, des parties robot contre robot avec 0, 1, 3 et 6 cartes
   bonus. Pour chaque carte : le taux de victoire de qui la pose, quand elle se pose. Une carte
   au-dessus de 60 % est trop forte. Les chiffres vont sur une page « Extension », qui remplace
   « Lore Exploration » dans le menu Versions.
3. La page : le choix du nombre de cartes bonus (0 à 6), la figure dessinée en petit à droite des
   cartes.
4. La règle imprimée : une page de plus, « L'extension ».
