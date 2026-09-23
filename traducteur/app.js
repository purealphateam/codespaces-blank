'use strict';

// Langues proposées : code de traduction, code de reconnaissance/synthèse vocale, nom affiché.
const LANGS = [
  { code: 'ar', speech: 'ar-SA', name: 'Arabe saoudien', rtl: true },
  { code: 'fr', speech: 'fr-FR', name: 'Français' },
  { code: 'en', speech: 'en-US', name: 'Anglais' },
  { code: 'es', speech: 'es-ES', name: 'Espagnol' },
  { code: 'de', speech: 'de-DE', name: 'Allemand' },
  { code: 'it', speech: 'it-IT', name: 'Italien' },
  { code: 'pt', speech: 'pt-PT', name: 'Portugais' },
  { code: 'nl', speech: 'nl-NL', name: 'Néerlandais' },
  { code: 'zh-CN', speech: 'zh-CN', name: 'Chinois (simplifié)' },
  { code: 'ja', speech: 'ja-JP', name: 'Japonais' },
  { code: 'ko', speech: 'ko-KR', name: 'Coréen' },
  { code: 'ru', speech: 'ru-RU', name: 'Russe' },
  { code: 'tr', speech: 'tr-TR', name: 'Turc' },
  { code: 'hi', speech: 'hi-IN', name: 'Hindi' },
  { code: 'sw', speech: 'sw-KE', name: 'Swahili' },
  { code: 'ln', speech: 'ln-CD', name: 'Lingala' },
  { code: 'pl', speech: 'pl-PL', name: 'Polonais' },
  { code: 'uk', speech: 'uk-UA', name: 'Ukrainien' },
  { code: 'vi', speech: 'vi-VN', name: 'Vietnamien' },
];

const $ = (id) => document.getElementById(id);
const els = {
  langA: $('lang-a'), langB: $('lang-b'), swap: $('swap'),
  textA: $('text-a'), textB: $('text-b'),
  titleA: $('title-a'), titleB: $('title-b'),
  micA: $('mic-a'), micB: $('mic-b'),
  autoSpeak: $('auto-speak'),
  listen: $('listen'), listenLabel: $('listen-label'),
  liveSrc: $('live-src'), liveDst: $('live-dst'),
  clear: $('clear'), status: $('status'),
  history: $('history'), historyEmpty: $('history-empty'),
  warning: $('support-warning'),
};

const side = {
  a: { select: els.langA, text: els.textA, title: els.titleA, mic: els.micA },
  b: { select: els.langB, text: els.textB, title: els.titleB, mic: els.micB },
};
const other = (s) => (s === 'a' ? 'b' : 'a');
const langOf = (s) => LANGS.find((l) => l.code === side[s].select.value);

function setStatus(msg) { els.status.textContent = msg; }

// ---------- Traduction ----------

const cache = new Map();

async function translateGoogle(text, from, to) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t'
    + `&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const data = await res.json();
  return data[0].map((part) => part[0]).join('');
}

async function translateMyMemory(text, from, to) {
  const url = 'https://api.mymemory.translated.net/get'
    + `?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json();
  return data.responseData.translatedText;
}

async function translate(text, from, to) {
  text = text.trim();
  if (!text) return '';
  if (from === to) return text;
  const key = `${from}|${to}|${text}`;
  if (cache.has(key)) return cache.get(key);
  let out;
  try {
    out = await translateGoogle(text, from, to);
  } catch {
    out = await translateMyMemory(text, from, to);
  }
  cache.set(key, out);
  return out;
}

// Ignore les réponses arrivées dans le désordre : seule la plus récente est affichée.
let requestSeq = 0;

async function translateInto(src, text) {
  const dst = other(src);
  const seq = ++requestSeq;
  try {
    const result = await translate(text, langOf(src).code, langOf(dst).code);
    if (seq === requestSeq) {
      side[dst].text.value = result;
      els.liveDst.textContent = result;
    }
    return result;
  } catch {
    if (seq === requestSeq) setStatus('Traduction impossible : vérifiez votre connexion Internet.');
    return null;
  }
}

// Limite la fréquence des traductions pendant qu'on parle ou qu'on tape.
function throttle(fn, wait) {
  let timer = null;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      fn(...lastArgs);
    }, wait);
  };
}
const liveTranslate = throttle(translateInto, 350);

// ---------- Synthèse vocale ----------

function pickVoice(speechLang) {
  const voices = speechSynthesis.getVoices();
  const base = speechLang.split('-')[0];
  return voices.find((v) => v.lang === speechLang)
    || voices.find((v) => v.lang.replace('_', '-').startsWith(base));
}

function speak(text, lang, onDone) {
  if (!('speechSynthesis' in window) || !text) { onDone?.(); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang.speech;
  const voice = pickVoice(lang.speech);
  if (voice) u.voice = voice;
  u.onend = u.onerror = () => onDone?.();
  speechSynthesis.speak(u);
}

// ---------- Historique ----------

function addHistory(src, original, translated) {
  const dstLang = langOf(other(src));
  const li = document.createElement('li');
  li.className = `from-${src}`;
  const srcEl = document.createElement('span');
  srcEl.className = 'src';
  srcEl.textContent = `${langOf(src).name} : ${original}`;
  const dstEl = document.createElement('span');
  dstEl.className = 'dst';
  dstEl.textContent = translated;
  srcEl.dir = dstEl.dir = 'auto';
  const replay = document.createElement('button');
  replay.className = 'replay';
  replay.type = 'button';
  replay.title = 'Réécouter';
  replay.setAttribute('aria-label', 'Réécouter la traduction');
  replay.textContent = '🔊';
  replay.addEventListener('click', () => speak(translated, dstLang));
  li.append(srcEl, replay, dstEl);
  els.history.prepend(li);
  els.historyEmpty.hidden = true;
}

// ---------- Reconnaissance vocale ----------

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeSide = null;   // côté qui écoute ('a' ou 'b'), ou null
let pausedForSpeech = false;

function updateMics() {
  for (const s of ['a', 'b']) {
    const on = activeSide === s;
    side[s].mic.classList.toggle('listening', on);
    side[s].mic.setAttribute('aria-pressed', String(on));
    side[s].mic.querySelector('.mic-label').textContent = on ? 'Arrêter' : 'Parler';
  }
  const ambient = activeSide === 'a';
  els.listen.classList.toggle('listening', ambient);
  els.listen.setAttribute('aria-pressed', String(ambient));
  els.listenLabel.textContent = ambient ? "Arrêter l'écoute" : 'Écouter autour de moi';
}

// Garde l'écran allumé pendant l'écoute (sinon le téléphone se verrouille et coupe le micro).
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
    }
  } catch { /* non pris en charge */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && activeSide) keepAwake(true);
});

function startListening(s) {
  stopListening();
  activeSide = s;
  const rec = new SpeechRecognition();
  recognition = rec;
  recognition.lang = langOf(s).speech;
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) commitSentence(s, r[0].transcript);
      else interim += r[0].transcript;
    }
    if (interim) {
      side[s].text.value = interim;
      els.liveSrc.textContent = interim;
      liveTranslate(s, interim);
    }
  };

  recognition.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      setStatus("Accès au micro refusé. Autorisez-le dans les réglages du navigateur.");
      activeSide = null;
    } else if (e.error === 'no-speech') {
      setStatus('Aucune parole détectée…');
    } else if (e.error !== 'aborted') {
      setStatus(`Erreur de reconnaissance : ${e.error}`);
    }
  };

  // Chrome coupe l'écoute après un silence : on relance tant que l'utilisateur n'a pas arrêté.
  recognition.onend = () => {
    if (activeSide === s && !pausedForSpeech) {
      // Petit délai pour éviter une boucle rapide en cas d'erreur réseau répétée.
      setTimeout(() => {
        if (activeSide === s && recognition === rec && !pausedForSpeech) {
          try { rec.start(); } catch { /* déjà relancée */ }
        }
      }, 250);
      return;
    }
    if (!pausedForSpeech && activeSide === s) activeSide = null;
    updateMics();
  };

  try {
    recognition.start();
    keepAwake(true);
    setStatus(`Écoute en ${langOf(s).name}…`);
  } catch {
    activeSide = null;
  }
  updateMics();
}

function stopListening() {
  activeSide = null;
  keepAwake(false);
  pausedForSpeech = false;
  if (recognition) {
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }
  updateMics();
}

async function commitSentence(s, transcript) {
  const text = transcript.trim();
  if (!text) return;
  side[s].text.value = text;
  els.liveSrc.textContent = text;
  const translated = await translateInto(s, text);
  if (translated == null) return;
  addHistory(s, text, translated);
  if (!activeSide) setStatus('Traduit.');

  if (!els.autoSpeak.checked) return;
  // Met le micro en pause pendant la lecture pour qu'il n'entende pas la traduction.
  const listening = activeSide === s && recognition;
  if (listening) { pausedForSpeech = true; recognition.stop(); }
  speak(translated, langOf(other(s)), () => {
    if (listening && pausedForSpeech && activeSide === s) {
      pausedForSpeech = false;
      try { recognition.start(); } catch { /* déjà relancée */ }
      setStatus(`Écoute en ${langOf(s).name}…`);
    }
  });
}

// ---------- Interface ----------

function fillSelects() {
  for (const s of ['a', 'b']) {
    for (const l of LANGS) side[s].select.add(new Option(l.name, l.code));
  }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('traducteur-langs-v2') || '{}'); } catch { /* ignoré */ }
  els.langA.value = LANGS.some((l) => l.code === saved.a) ? saved.a : 'ar';
  els.langB.value = LANGS.some((l) => l.code === saved.b) ? saved.b : 'fr';
}

function onLangChange() {
  for (const s of ['a', 'b']) {
    side[s].title.textContent = langOf(s).name;
    side[s].text.dir = langOf(s).rtl ? 'rtl' : 'ltr';
  }
  try {
    localStorage.setItem('traducteur-langs-v2', JSON.stringify({ a: els.langA.value, b: els.langB.value }));
  } catch { /* ignoré */ }
  if (activeSide) startListening(activeSide);
  if (els.textA.value.trim()) translateInto('a', els.textA.value);
}

fillSelects();
onLangChange();

els.langA.addEventListener('change', onLangChange);
els.langB.addEventListener('change', onLangChange);

els.swap.addEventListener('click', () => {
  [els.langA.value, els.langB.value] = [els.langB.value, els.langA.value];
  [els.textA.value, els.textB.value] = [els.textB.value, els.textA.value];
  onLangChange();
});

for (const s of ['a', 'b']) {
  side[s].text.addEventListener('input', () => {
    const value = side[s].text.value;
    if (value.trim()) liveTranslate(s, value);
    else side[other(s)].text.value = '';
  });
  side[s].mic.addEventListener('click', () => {
    if (activeSide === s) { stopListening(); setStatus('Écoute arrêtée.'); }
    else startListening(s);
  });
}

els.listen.addEventListener('click', () => {
  if (activeSide === 'a') { stopListening(); setStatus('Écoute arrêtée.'); }
  else startListening('a');
});

els.clear.addEventListener('click', () => {
  els.history.replaceChildren();
  els.historyEmpty.hidden = false;
  els.liveSrc.textContent = '';
  els.liveDst.textContent = '';
});

if (!SpeechRecognition) {
  els.warning.hidden = false;
  els.micA.disabled = true;
  els.listen.disabled = true;
  els.micB.disabled = true;
}

// Certains navigateurs chargent les voix de façon asynchrone.
if ('speechSynthesis' in window) speechSynthesis.getVoices();
