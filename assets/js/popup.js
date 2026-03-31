(() => {
  "use strict";

  const STORAGE_KEY = "letterMappings";
  const UI_LANG_KEY = "uiLanguage";
  const defaultMappings = {
    i: { language: "İngilizce", delayMs: 500 }
  };
  const DEFAULT_DELAY_MS = 500;
  const uiTexts = {
    tr: {
      title: "FastLang",
      langLabel: "Dil",
      hint: "Harf yazildiginda secilecek dili belirle.",
      letterLabel: "Harf",
      letterPlaceholder: "Kisayol olacak harfi girin (orn: i)",
      languageLabel: "Dil",
      languagePlaceholder: "Kisayola baglanacak dili secin (orn: İngilizce)",
      delayLabel: "Gecikme (ms)",
      delayHelp: "Harf yazildiktan sonra dilin otomatik secilmesi icin beklenecek sure.",
      saveButton: "Kaydet / Guncelle",
      activeMappings: "Aktif Eslesmeler",
      empty: "Henuz kayitli eslesme yok.",
      deleteBtn: "Sil"
    },
    en: {
      title: "FastLang",
      langLabel: "UI",
      hint: "Set which language should be selected for a shortcut letter.",
      letterLabel: "Letter",
      letterPlaceholder: "Enter shortcut letter (e.g. i)",
      languageLabel: "Language",
      languagePlaceholder: "Choose language for this shortcut (e.g. English)",
      delayLabel: "Delay (ms)",
      delayHelp: "How long to wait after typing the letter before auto-selecting the language.",
      saveButton: "Save / Update",
      activeMappings: "Active Mappings",
      empty: "No mappings added yet.",
      deleteBtn: "Delete"
    }
  };

  const form = document.getElementById("mappingForm");
  const letterInput = document.getElementById("letterInput");
  const languageInput = document.getElementById("languageInput");
  const delayInput = document.getElementById("delayInput");
  const mappingsWrap = document.getElementById("mappings");
  const languageSuggestions = document.getElementById("languageSuggestions");
  const langTrBtn = document.getElementById("langTrBtn");
  const langEnBtn = document.getElementById("langEnBtn");

  const titleText = document.getElementById("titleText");
  const langLabel = document.getElementById("langLabel");
  const hintText = document.getElementById("hintText");
  const letterLabel = document.getElementById("letterLabel");
  const languageLabel = document.getElementById("languageLabel");
  const delayLabel = document.getElementById("delayLabel");
  const delayHelp = document.getElementById("delayHelp");
  const saveButton = document.getElementById("saveButton");
  const activeMappingsTitle = document.getElementById("activeMappingsTitle");

  let mappings = { ...defaultMappings };
  let currentUiLanguage = "tr";
  let allLanguagePairs = [];
  let allLanguages = [];

  function refreshDisplayLanguages() {
    allLanguages = allLanguagePairs.map((p) => (currentUiLanguage === "en" ? p.en : p.tr));
  }

  function normalizeLetter(value) {
    return (value || "").toLocaleLowerCase("tr-TR").trim().slice(0, 1);
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeForMatch(text) {
    const loc = currentUiLanguage === "en" ? "en-US" : "tr-TR";
    return (text || "")
      .toLocaleLowerCase(loc)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function displayLabelForStored(stored) {
    for (const p of allLanguagePairs) {
      if (p.tr === stored || p.en === stored) {
        return currentUiLanguage === "en" ? p.en : p.tr;
      }
    }
    return stored;
  }

  function filterLanguages(query) {
    const q = normalizeForMatch(query);
    if (!q) {
      return allLanguages.slice(0, 12);
    }
    return allLanguages.filter((name) => normalizeForMatch(name).includes(q)).slice(0, 20);
  }

  function hideLanguageSuggestions() {
    languageSuggestions.hidden = true;
    languageSuggestions.innerHTML = "";
  }

  function showLanguageSuggestions() {
    const items = filterLanguages(languageInput.value);
    if (!items.length) {
      hideLanguageSuggestions();
      return;
    }
    languageSuggestions.innerHTML = items
      .map(
        (name) =>
          `<button type="button" class="language-suggestion" data-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`
      )
      .join("");
    languageSuggestions.hidden = false;
  }

  function resolveCanonicalLanguage(raw) {
    const typed = (raw || "").trim();
    if (!typed || !allLanguages.length) return null;
    const exact = allLanguages.find((n) => n === typed);
    if (exact) return exact;
    const nt = normalizeForMatch(typed);
    const byNorm = allLanguages.filter((n) => normalizeForMatch(n) === nt);
    if (byNorm.length === 1) return byNorm[0];
    const includes = allLanguages.filter((n) => normalizeForMatch(n).includes(nt));
    if (includes.length === 1) return includes[0];
    return null;
  }

  function renderMappings() {
    const text = uiTexts[currentUiLanguage];
    const keys = Object.keys(mappings).sort();
    if (!keys.length) {
      mappingsWrap.innerHTML = `<div class="empty">${text.empty}</div>`;
      return;
    }

    mappingsWrap.innerHTML = keys
      .map((key) => {
        const item = mappings[key];
        return `
          <div class="item">
            <div><b>${escapeHtml(key)}</b> -> ${escapeHtml(displayLabelForStored(item.language))} (${item.delayMs}ms)</div>
            <button class="delete" data-key="${escapeHtml(key)}">${text.deleteBtn}</button>
          </div>
        `;
      })
      .join("");
  }

  function applyUiLanguage(lang) {
    currentUiLanguage = lang === "en" ? "en" : "tr";
    const text = uiTexts[currentUiLanguage];
    titleText.textContent = text.title;
    langLabel.textContent = text.langLabel;
    hintText.textContent = text.hint;
    letterLabel.textContent = text.letterLabel;
    languageLabel.textContent = text.languageLabel;
    delayLabel.textContent = text.delayLabel;
    delayHelp.textContent = text.delayHelp;
    saveButton.textContent = text.saveButton;
    activeMappingsTitle.textContent = text.activeMappings;
    letterInput.placeholder = text.letterPlaceholder;
    languageInput.placeholder = text.languagePlaceholder;
    langTrBtn.classList.toggle("active", currentUiLanguage === "tr");
    langEnBtn.classList.toggle("active", currentUiLanguage === "en");
    refreshDisplayLanguages();
    renderMappings();
  }

  function saveMappings() {
    return chrome.storage.sync.set({ [STORAGE_KEY]: mappings });
  }

  async function loadMappings() {
    const loaded = await chrome.storage.sync.get([STORAGE_KEY]);
    const savedMappings = loaded?.[STORAGE_KEY];
    if (savedMappings !== undefined && savedMappings !== null && typeof savedMappings === "object") {
      mappings = { ...savedMappings };
    } else {
      mappings = { ...defaultMappings };
      await saveMappings();
    }
    renderMappings();
  }

  async function loadUiLanguage() {
    const loaded = await chrome.storage.sync.get([UI_LANG_KEY]);
    const saved = loaded?.[UI_LANG_KEY];
    applyUiLanguage(saved === "en" ? "en" : "tr");
  }

  async function loadLanguages() {
    const url = chrome.runtime.getURL("assets/js/languages.json");
    const response = await fetch(url);
    const raw = await response.json();
    if (
      Array.isArray(raw) &&
      raw.length &&
      typeof raw[0] === "object" &&
      raw[0] !== null &&
      Object.prototype.hasOwnProperty.call(raw[0], "tr") &&
      Object.prototype.hasOwnProperty.call(raw[0], "en")
    ) {
      allLanguagePairs = raw.map((p) => ({ tr: String(p.tr), en: String(p.en) }));
    } else if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") {
      allLanguagePairs = raw.map((tr) => ({ tr, en: tr }));
    } else {
      allLanguagePairs = [];
    }
    refreshDisplayLanguages();
  }

  languageInput.addEventListener("input", () => {
    showLanguageSuggestions();
  });

  languageInput.addEventListener("focus", () => {
    showLanguageSuggestions();
  });

  languageInput.addEventListener("blur", () => {
    window.setTimeout(() => hideLanguageSuggestions(), 180);
  });

  languageSuggestions.addEventListener("mousedown", (event) => {
    const button = event.target.closest(".language-suggestion");
    if (!(button instanceof HTMLButtonElement)) return;
    event.preventDefault();
    const name = button.dataset.name;
    if (!name) return;
    languageInput.value = name;
    hideLanguageSuggestions();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const letter = normalizeLetter(letterInput.value);
    const language = resolveCanonicalLanguage(languageInput.value);
    const delayMs = Number.parseInt(delayInput.value || "0", 10);

    if (!letter || !language) return;
    mappings[letter] = {
      language,
      delayMs: Number.isFinite(delayMs) ? Math.max(0, delayMs) : 0
    };
    await saveMappings();
    renderMappings();
    letterInput.value = "";
    languageInput.value = "";
    delayInput.value = String(DEFAULT_DELAY_MS);
    hideLanguageSuggestions();
  });

  mappingsWrap.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const key = target.dataset.key;
    if (!key || !mappings[key]) return;
    delete mappings[key];
    await saveMappings();
    renderMappings();
  });

  langTrBtn.addEventListener("click", async () => {
    applyUiLanguage("tr");
    await chrome.storage.sync.set({ [UI_LANG_KEY]: "tr" });
  });

  langEnBtn.addEventListener("click", async () => {
    applyUiLanguage("en");
    await chrome.storage.sync.set({ [UI_LANG_KEY]: "en" });
  });

  (async function init() {
    await loadLanguages();
    await loadMappings();
    await loadUiLanguage();
  })();
})();
