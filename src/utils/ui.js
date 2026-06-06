// =========================
// CATEGORIES COULEURS / ICONES
// =========================
export const CATEGORIES = {
  "Pédagogie":              { couleur: "#FF6B6B", icone: "fa-book" },
  "Événement":              { couleur: "#FFA94D", icone: "fa-calendar" },
  "Vie de campus":          { couleur: "#51CF66", icone: "fa-building" },
  "Amélioration technique": { couleur: "#4C9AFF", icone: "fa-code" },
  "autres":                 { couleur: "#888888", icone: "fa-lightbulb" },
};

// =========================
// UTILS
// =========================
export const $ = (id) => document.getElementById(id);

export const assainir = (str) => {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
};

// =========================
// MODAL
// =========================
export function ouvrirModalFn({ idee = null, editIdRef, form, titre, description, categorie, mettreAJourCompteurs, reinitialiserValidation }) {
  editIdRef.value = idee?.id || null;
  reinitialiserValidation();

  if (idee) {
    titre.value       = idee.titre       || "";
    description.value = idee.description || "";
    categorie.value   = idee.categorie   || "";
  } else {
    form.reset();
  }

  mettreAJourCompteurs();
  $("modal").classList.add("modal--active");
}

export function fermerModalFn({ form, reinitialiserValidation, editIdRef }) {
  $("modal").classList.remove("modal--active");
  form.reset();
  reinitialiserValidation();
  editIdRef.value = null;
}

// =========================
// TOAST
// =========================
export function notification(msg, type = "success") {
  let c = document.querySelector(".toast-container");
  if (!c) {
    c = document.createElement("div");
    c.className = "toast-container";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// =========================
// CONFIRMATION SUPPRESSION
// =========================
export function confirmerSuppression() {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.5);
      display:flex; align-items:center; justify-content:center;
      z-index:9999;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      background:#fff; border-radius:16px; padding:32px 28px;
      max-width:360px; width:90%; text-align:center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    `;
    box.innerHTML = `
      <div style="font-size:2.5rem; margin-bottom:12px;"></div>
      <h3 style="margin:0 0 8px; font-size:1.2rem; color:#1e293b;">Supprimer cette idée ?</h3>
      <p style="color:#64748b; font-size:0.9rem; margin:0 0 24px;">Cette action est irréversible.</p>
      <div style="display:flex; gap:12px; justify-content:center;">
        <button id="confirmNon" style="padding:10px 24px; border-radius:8px; border:2px solid #e2e8f0; background:#fff; color:#475569; font-size:0.95rem; cursor:pointer; font-weight:600;">Annuler</button>
        <button id="confirmOui" style="padding:10px 24px; border-radius:8px; border:none; background:#ef4444; color:#fff; font-size:0.95rem; cursor:pointer; font-weight:600;">Supprimer</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const fermer = (result) => { overlay.remove(); resolve(result); };
    box.querySelector("#confirmOui").onclick = () => fermer(true);
    box.querySelector("#confirmNon").onclick = () => fermer(false);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) fermer(false); });
  });
}

// =========================
// LOADER IA (champ catégorie)
// =========================
export function afficherChargementIA(visible) {
  const select  = $("categorie");
  const wrapper = select?.parentElement;
  let   loader  = $("ia-loader");

  if (visible) {
    if (loader) return;
    if (select) select.style.display = "none";

    loader = document.createElement("div");
    loader.id = "ia-loader";
    loader.innerHTML = `
      <div class="ia-loader__inner">
        <span class="ia-loader__spinner"></span>
        <span class="ia-loader__text">L'IA choisit la catégorie…</span>
      </div>
    `;
    wrapper?.appendChild(loader);
  } else {
    loader?.remove();
    if (select) select.style.display = "";
  }
}

// =========================
// CARTE
// =========================
export function carte({ idee, cache, ouvrirModalFn, supprimer }) {
  const c = CATEGORIES[idee?.categorie] || CATEGORIES.autres;

  const div = document.createElement("div");
  div.className = "carte";
  div.style.setProperty("--cat-color", c.couleur);

  div.innerHTML = `
    <div class="carte__entete">
      <div class="carte__categorie">
        <i class="fas ${c.icone}"></i> ${idee?.categorie || "Autres"}
      </div>
      <span class="carte__date">${idee?.date || ""}</span>
    </div>
    <h3 class="carte__titre">${idee?.titre || ""}</h3>
    <p class="carte__description">${idee?.description || ""}</p>
    <div class="carte__actions">
      <button class="edit" title="Modifier"   type="button"><i class="fas fa-pen"></i></button>
      <button class="del"  title="Supprimer"  type="button"><i class="fas fa-trash"></i></button>
    </div>
  `;

  const id    = idee?.id;
  const idStr = id == null ? null : String(id);

  div.querySelector(".edit")?.addEventListener("click", () => {
    if (!idStr) { notification("Erreur : id manquant", "delete"); return; }
    const found = cache.find((x) => String(x?.id) === idStr);
    ouvrirModalFn(found || { id });
  });

  div.querySelector(".del")?.addEventListener("click", () => {
    if (!idStr) { notification("Erreur : id manquant", "delete"); return; }
    supprimer(id);
  });

  return div;
}

// =========================
// PAGINATION
// =========================
export function afficherPagination({ total, page, obtenirTaillePage, onPageChange }) {
  const paginationEl = $("pagination");
  if (!paginationEl) return page;

  const size       = obtenirTaillePage();
  const totalPages = Math.ceil(total / size);

  if (totalPages <= 1) {
    paginationEl.style.display = "none";
    paginationEl.innerHTML     = "";
    return page;
  }

  paginationEl.style.display = "flex";
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const creerBouton = (label, n, disabled = false, active = false) => {
    const b = document.createElement("button");
    b.type        = "button";
    b.textContent = label;
    if (disabled) b.disabled = true;
    if (active)   b.classList.add("active");
    if (!disabled) b.addEventListener("click", () => onPageChange(n));
    return b;
  };

  const pointsSuspension = () => {
    const s = document.createElement("span");
    s.textContent   = "…";
    s.style.cssText = "align-self:center; color:#64748b; font-weight:800;";
    return s;
  };

  const winSize = 5;
  let start = Math.max(1, safePage - Math.floor(winSize / 2));
  let end   = Math.min(totalPages, start + winSize - 1);
  start     = Math.max(1, end - winSize + 1);

  const parts = [];
  parts.push(creerBouton("←", safePage - 1, safePage <= 1));
  if (start > 1) parts.push(creerBouton("1", 1, false, safePage === 1));
  if (start > 2) parts.push(pointsSuspension());
  for (let n = start; n <= end; n++) parts.push(creerBouton(String(n), n, false, n === safePage));
  if (end < totalPages - 1) parts.push(pointsSuspension());
  if (end < totalPages)     parts.push(creerBouton(String(totalPages), totalPages, false, safePage === totalPages));
  parts.push(creerBouton("→", safePage + 1, safePage >= totalPages));

  paginationEl.innerHTML = "";
  parts.forEach((p) => paginationEl.appendChild(p));

  return safePage;
}