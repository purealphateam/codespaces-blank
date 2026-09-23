# Traducteur en direct

Application web qui traduit la voix en temps réel :

1. Par défaut : **arabe (Arabie saoudite, ar-SA) → français**. Vous pouvez changer les langues (19 au choix).
2. Appuyez sur **Parler** du côté de la personne qui parle.
3. Le texte s'affiche pendant que vous parlez et sa traduction s'affiche en même temps de l'autre côté.
4. À la fin de chaque phrase, la traduction est lue à voix haute et ajoutée à l'historique de la conversation.

Vous pouvez aussi taper du texte dans l'un ou l'autre des panneaux : la traduction se fait pendant la saisie.

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
