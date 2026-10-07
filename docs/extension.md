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
  adverse ne peut le battre, preuve faite avec les seules cartes de la table.
- La victoire : 4 bornes, ou 3 côte à côte.

## Ce qui s'ajoute

On choisit combien de cartes bonus on mélange à la pioche : **de 0 à 3** dans la page (tirées au
hasard parmi les six), toutes les six possibles sur table.

- **Une carte bonus se pioche comme une autre** et compte dans la main de 6 (décision de Sami).
- **La poser est le coup du tour** : on la pose, face visible, **à droite de ses trois cartes**,
  à côté d'une borne, puis on pioche. On ne pose pas de carte numérotée ce tour-là.
- **Une figure au plus par borne et par joueur** : 7 au plus pour chacun.
- Elle reste là jusqu'à la fin et montre que cette borne joue avec une autre règle.

## Les six cartes

| Carte | Effet sur sa borne | Pour qui |
| --- | --- | --- |
| **Valet de Trèfle** | **La plus faible gagne** : la combinaison la plus faible prend la borne. Interdit sur une borne déjà gagnée. | les deux côtés |
| **Valet de Carreau** | **La Somme** : les combinaisons ne comptent plus, la plus grosse somme gagne. | les deux côtés |
| **Dame de Cœur** | **L'Échange** : la borne (1 à 6) échange sa place avec sa voisine de droite, cartes et figures comprises. La Dame marque les deux colonnes. | les deux bornes |
| **Dame de Pique** | **Le Rappel** : reprendre en main une de ses propres cartes d'une borne non décidée. | celui qui la pose |
| **Roi de Pique** | **La Suite impaire** : trois impairs qui se suivent, d'une même couleur (1-3-5, 3-5-7, 5-7-9), forment une combinaison **au-dessus de la Suite couleur**. | celui qui le pose |
| **Roi de Carreau** | **+10** : à combinaison égale, une Suite ou une Suite couleur compte 10 de plus dans sa somme. 5-6-7 + 10 = 28 bat 8-9-10 = 27 ; 1-2-3 + 10 = 16 perd contre 8-9-10 mais bat 4-5-6. Le Brelan et la Suite couleur restent au-dessus d'une Suite. | celui qui le pose |

Le Valet rouge (La Somme) et la Dame noire (Le Rappel) ont été choisis par Sami le 07/10 parmi
trois propositions chacun : La Somme est le pendant simple du Valet de Trèfle, Le Rappel corrige
une erreur sans toucher au jeu adverse.

## Les points à valider (Sami)

1. **Le matériel.** Sur table, 7 figures servent de bornes et 6 deviennent des cartes bonus : il en
   faut 13, un paquet en a 12. Proposition : la 7e borne est n'importe quel autre repère (la carte
   publicitaire du paquet, un jeton). À préciser aussi : « ou la reine de carreau en offline »
   dans la feuille de route.
2. **L'Échange** ne déplace que des bornes **non décidées** : déplacer une borne gagnée changerait
   le « 3 côte à côte » après coup.
3. **Le Rappel** ne touche qu'une borne **non décidée** : une revendication reste définitive.
4. **Une égalité sous le Valet de Trèfle** se règle comme d'habitude, par le premier côté complet.
5. **Les jokers** gardent leur règle : sans couleur, ils prennent n'importe quelle valeur. Sous La
   Somme, un joker vaut la valeur qui l'arrange, comme ailleurs ; sous la Suite impaire, il ne fait
   pas la couleur, donc n'en fait jamais une.
6. **Une figure posée sur une borne dont son côté est déjà complet** est permise (sauf le Valet de
   Trèfle sur une borne gagnée) : c'est le moyen de retourner une borne mal partie.

## La suite

1. Le moteur : les figures comme cartes en plus du paquet, `border.figures`, un seul point de
   jugement par borne et par côté (`evaluatorFor`). Avec 0 carte bonus, les empreintes du jeu de
   base ne bougent pas.
2. L'équilibre : `npm run extension`, des parties robot contre robot avec 0, 1, 3 et 6 cartes
   bonus. Pour chaque carte : le taux de victoire de qui la pose, quand elle se pose. Une carte
   au-dessus de 60 % est trop forte. Les chiffres vont sur une page « Extension », qui remplace
   « Lore Exploration » dans le menu Versions.
3. La page : le choix du nombre de cartes bonus, la figure dessinée en petit à droite des cartes.
4. La règle imprimée : une page de plus, « L'extension ».
