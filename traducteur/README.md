# Traducteur en direct

Application web de sous-titres en direct : le téléphone écoute les gens qui parlent autour de vous et affiche la traduction au fur et à mesure.

Par défaut : **arabe saoudien (ar-SA) → français**. Vous pouvez choisir d'autres langues (19 au choix).

## Mode écoute (principal)

1. Appuyez sur **Écouter autour de moi** et posez le téléphone près des personnes qui parlent.
2. La phrase en cours et sa traduction s'affichent en grand pendant qu'elle est prononcée.
3. Chaque phrase terminée est ajoutée à la liste **Déjà traduit**, les plus récentes en haut.
4. L'écoute continue sans interruption jusqu'à ce que vous appuyiez sur **Arrêter l'écoute**. L'écran reste allumé pendant l'écoute.

La lecture à voix haute est désactivée par défaut, pour que le micro ne manque rien pendant que le téléphone parle.

## Conversation à deux et saisie au clavier

Cette section se déplie sous la liste. Chaque personne a son propre bouton micro, et vous pouvez aussi taper du texte, qui est traduit pendant la saisie.

## Lancer l'application

Aucune installation n'est nécessaire. Le micro ne fonctionne que sur `https://` ou `localhost`, donc lancez un petit serveur local :

```bash
cd traducteur
python3 -m http.server 8000
```

Ensuite, ouvrez http://localhost:8000 dans **Chrome**, **Edge** ou **Safari**. Firefox ne gère pas la reconnaissance vocale, mais la saisie au clavier y fonctionne.

## Technologies

- **Reconnaissance vocale** : API Web Speech (`SpeechRecognition`) du navigateur
- **Traduction** : point d'accès public de Google Translate, avec MyMemory en secours (connexion Internet requise, sans clé API)
- **Synthèse vocale** : `speechSynthesis` du navigateur
