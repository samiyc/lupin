# Replays gardés pour l'analyse

Chaque partie jouée contre un robot est enregistrée automatiquement dans
`replays/`, un dossier ignoré par git. Les parties qui méritent d'être gardées
atterrissent ici, versionnées, par le bouton « Garder pour l'analyse » de l'onglet
Replays, ou en y copiant le fichier à la main.

`npm run replays` fait le bilan des deux dossiers. Le format des fichiers est
décrit dans `docs/jouer.md`.
