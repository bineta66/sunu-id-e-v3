import { $ } from "./ui.js";

// =========================
// HELPERS
// =========================
function definirMessage(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
}

function definirEtatChamp(inputEl, errId, msg, ok) {
  if (inputEl) {
    inputEl.classList.toggle("field--error",   !ok);
    inputEl.classList.toggle("field--success",  ok);
  }
  definirMessage(errId, ok ? "" : msg);
}

// =========================
// RESET
// =========================
export function reinitialiserValidation({ titre, description, mettreAJourCompteurs }) {
  [titre, description].forEach((el) => {
    if (!el) return;
    el.classList.remove("field--error", "field--success");
  });
  definirMessage("errTitre",       "");
  definirMessage("errDescription", "");
  mettreAJourCompteurs();
}

// =========================
// TITRE
// =========================
export function validerTitre(titre) {
  const val = titre.value.trim();

  if (!val) {
    definirEtatChamp(titre, "errTitre", "Ce champ est obligatoire.", false);
    return false;
  }
  if (val.length < 5) {
    definirEtatChamp(titre, "errTitre", "Minimum 5 caractères requis.", false);
    return false;
  }
  if (val.length > 20) {
    definirEtatChamp(titre, "errTitre", "Maximum 20 caractères autorisés.", false);
    return false;
  }

  definirEtatChamp(titre, "errTitre", "", true);
  return true;
}

// =========================
// DESCRIPTION
// =========================
export function validerDescription(description) {
  const val = description.value.trim();

  if (!val) {
    definirEtatChamp(description, "errDescription", "Ce champ est obligatoire.", false);
    return false;
  }
  if (val.length < 30) {
    definirEtatChamp(description, "errDescription", "Minimum 30 caractères requis.", false);
    return false;
  }
  if (val.length > 255) {
    definirEtatChamp(description, "errDescription", "Maximum 255 caractères autorisés.", false);
    return false;
  }

  definirEtatChamp(description, "errDescription", "", true);
  return true;
}

// =========================
// FORMULAIRE COMPLET
// =========================
export function validerFormulaire({ titre, description }) {
  const okT = validerTitre(titre);
  const okD = validerDescription(description);
  return okT && okD;
}