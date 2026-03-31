(() => {
  "use strict";

  const SEARCH_INPUT_SELECTOR = 'input[aria-label*="ara" i], input[aria-label*="search" i]';
  const OPTION_SELECTOR = '[role="option"]';
  const STORAGE_KEY = "letterMappings";
  const inputTimers = new WeakMap();
  let mappings = {
    i: { language: "İngilizce", delayMs: 500 }
  };

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

  function normalizeText(text) {
    return (text || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getOptionText(optionEl) {
    const labelEl = optionEl.querySelector(".Llmcnf");
    return labelEl ? labelEl.textContent || "" : optionEl.textContent || "";
  }

  function findMappedOptionForInput(inputEl, languageName) {
    const panelRoot = getPanelRoot(inputEl);
    const desired = normalizeText(languageName);

    const scopedOptions = Array.from(panelRoot.querySelectorAll(OPTION_SELECTOR)).filter((el) => isVisible(el));
    const scopedMatch = scopedOptions.find((optionEl) => normalizeText(getOptionText(optionEl)).includes(desired));
    if (scopedMatch) return scopedMatch;

    const allOptions = Array.from(document.querySelectorAll(OPTION_SELECTOR)).filter((el) => isVisible(el));
    return allOptions.find((optionEl) => normalizeText(getOptionText(optionEl)).includes(desired)) || null;
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
      if (saved && typeof saved === "object") {
        mappings = { ...mappings, ...saved };
      }
    });
  }

  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "sync" || !changes[STORAGE_KEY]?.newValue) return;
      mappings = { i: { language: "İngilizce", delayMs: 500 }, ...changes[STORAGE_KEY].newValue };
    });
  }

  loadMappings();

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
