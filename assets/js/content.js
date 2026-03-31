(() => {
  "use strict";

  const SEARCH_INPUT_SELECTOR = 'input[aria-label*="ara" i], input[aria-label*="search" i]';
  const OPTION_SELECTOR = '[role="option"]';
  const STORAGE_KEY = "letterMappings";
  const FIRST_RUN_DEFAULTS = { i: { language: "İngilizce", delayMs: 500 } };
  const inputTimers = new WeakMap();
  let mappings = { ...FIRST_RUN_DEFAULTS };
  let languagePairs = [];

  function isLanguageSearchInput(el) {
    if (!(el instanceof HTMLInputElement)) return false;
    if (!el.matches(SEARCH_INPUT_SELECTOR)) return false;
    return true;
  }

  function isVisible(el) {
    if (!(el instanceof HTMLElement)) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getPanelRoot(inputEl) {
    return (
      inputEl.closest('[role="dialog"]') ||
      inputEl.closest('[jscontroller]') ||
      inputEl.parentElement ||
      document
    );
  }

  function normalizeTextTr(text) {
    return (text || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function normalizeTextEn(text) {
    return (text || "")
      .toLocaleLowerCase("en-US")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function optionTextMatchesLanguage(optionText, languageName) {
    const oTr = normalizeTextTr(optionText);
    const oEn = normalizeTextEn(optionText);
    const dTr = normalizeTextTr(languageName);
    const dEn = normalizeTextEn(languageName);
    if (dTr && (oTr.includes(dTr) || oEn.includes(dTr))) return true;
    if (dEn && (oTr.includes(dEn) || oEn.includes(dEn))) return true;
    return false;
  }

  function alternateLanguageLabels(stored) {
    const out = new Set();
    if (stored) out.add(stored);
    if (!stored || !languagePairs.length) return [...out];
    for (const p of languagePairs) {
      if (p.tr === stored || p.en === stored) {
        out.add(p.tr);
        out.add(p.en);
        break;
      }
    }
    return [...out];
  }

  function getOptionText(optionEl) {
    const labelEl = optionEl.querySelector(".Llmcnf");
    return labelEl ? labelEl.textContent || "" : optionEl.textContent || "";
  }

  function findMappedOptionForInput(inputEl, languageName) {
    const panelRoot = getPanelRoot(inputEl);
    const labels = alternateLanguageLabels(languageName);

    const scopedOptions = Array.from(panelRoot.querySelectorAll(OPTION_SELECTOR)).filter((el) => isVisible(el));
    for (const label of labels) {
      const scopedMatch = scopedOptions.find((optionEl) => optionTextMatchesLanguage(getOptionText(optionEl), label));
      if (scopedMatch) return scopedMatch;
    }

    const allOptions = Array.from(document.querySelectorAll(OPTION_SELECTOR)).filter((el) => isVisible(el));
    for (const label of labels) {
      const globalMatch = allOptions.find((optionEl) => optionTextMatchesLanguage(getOptionText(optionEl), label));
      if (globalMatch) return globalMatch;
    }
    return null;
  }

  function scheduleMappedSelect(inputEl) {
    const existingTimer = inputTimers.get(inputEl);
    if (existingTimer) {
      clearTimeout(existingTimer);
      inputTimers.delete(inputEl);
    }

    const inputValue = normalizeText(inputEl.value);
    if (inputValue.length !== 1) return;

    const rule = mappings[inputValue];
    if (!rule || !rule.language) return;
    const delayMs = Number.isFinite(rule.delayMs) ? Math.max(0, rule.delayMs) : 0;

    const timerId = window.setTimeout(() => {
      if (normalizeText(inputEl.value) !== inputValue) {
        inputTimers.delete(inputEl);
        return;
      }

      const mappedOption = findMappedOptionForInput(inputEl, rule.language);
      if (!mappedOption) return;
      mappedOption.scrollIntoView({ block: "nearest" });
      mappedOption.click();
      inputTimers.delete(inputEl);
    }, delayMs);

    inputTimers.set(inputEl, timerId);
  }

  function loadMappings() {
    if (!chrome.storage?.sync) return;
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const saved = result?.[STORAGE_KEY];
      if (saved !== undefined && saved !== null && typeof saved === "object") {
        mappings = { ...saved };
      } else {
        mappings = { ...FIRST_RUN_DEFAULTS };
      }
    });
  }

  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" || !Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) return;
      const next = changes[STORAGE_KEY].newValue;
      if (next !== undefined && next !== null && typeof next === "object") {
        mappings = { ...next };
      } else {
        mappings = {};
      }
    });
  }

  async function loadLanguagePairs() {
    if (!chrome.runtime?.getURL) return;
    try {
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
        languagePairs = raw.map((p) => ({ tr: String(p.tr), en: String(p.en) }));
      } else if (Array.isArray(raw) && raw.length && typeof raw[0] === "string") {
        languagePairs = raw.map((tr) => ({ tr, en: tr }));
      } else {
        languagePairs = [];
      }
    } catch {
      languagePairs = [];
    }
  }

  loadMappings();
  void loadLanguagePairs();

  document.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      if (!isLanguageSearchInput(target)) return;
      scheduleMappedSelect(target);
    },
    true
  );
})();
