import './style.css'
import {
  $,
  assainir,
  ouvrirModalFn      as _ouvrirModal,
  fermerModalFn      as _fermerModal,
  notification,
  confirmerSuppression,
  afficherChargementIA,
  carte              as creerCarte,
  afficherPagination,
} from './utils/ui.js'

import {
  reinitialiserValidation as _reinitialiserValidation,
  validerTitre,
  validerDescription,
  validerFormulaire,
} from './utils/validation.js'

import {
  mettreAJourCompteurs as _mettreAJourCompteurs,
  attacherCompteurs,
} from './utils/counter.js'

import {
  fetchIdees,
  insertIdee,
  updateIdee,
  deleteIdee,
  ecouterRealtime,
} from './api/supabase.js'

import { devinerCategorie } from './api/openrouter.js'


// =========================
// CATEGORIES VALIDES
// =========================
const CATS_VALIDES = ['Pédagogie', 'Événement', 'Vie de campus', 'Amélioration technique']

// =========================
// DOM
// =========================
const modal        = $('modal')
const form         = $('formeIdee')
const liste        = $('listeIdees')
const vide         = $('etatVide')
const compteur     = $('compteurIdees')

const ouvrirModal  = $('ouvrirModal')
const btnPartager  = $('btnPartager')
const btnVide      = $('btnVide')
const fermerModal  = $('fermerModal')
const annulerModal = $('annulerModal')

const titre        = $('titre')
const categorie    = $('categorie')
const description  = $('description')
const filtre       = $('filtreCategorie')
const search       = $('recherche')

// =========================
// STATE
// =========================
const editIdRef = { value: null }
let cache = []
let page  = 1

const PAGE_SIZE_DESKTOP = 8
const PAGE_SIZE_MOBILE  = 4

function obtenirTaillePage() {
  return window.matchMedia('(max-width: 768px)').matches
    ? PAGE_SIZE_MOBILE
    : PAGE_SIZE_DESKTOP
}

// =========================
// WRAPPERS (bind shared state)
// =========================
function mettreAJourCompteurs() {
  _mettreAJourCompteurs({ titre, description })
}

function reinitialiserValidation() {
  _reinitialiserValidation({ titre, description, mettreAJourCompteurs })
}

function ouvrirModalFn(idee = null) {
  _ouvrirModal({ idee, editIdRef, form, titre, description, categorie, mettreAJourCompteurs, reinitialiserValidation })
}

function fermerModalFn() {
  _fermerModal({ form, reinitialiserValidation, editIdRef })
}

// =========================
// HELPERS — formater une idée brute
// =========================
function formaterIdee(idee) {
  return { ...idee, date: new Date(idee.created_at).toLocaleDateString('fr-FR') }
}

// =========================
// EVENTS — MODAL
// =========================
[ouvrirModal, btnPartager, btnVide].forEach((btn) => {
  btn?.addEventListener('click', () => ouvrirModalFn())
})
fermerModal?.addEventListener('click',  fermerModalFn)
annulerModal?.addEventListener('click', fermerModalFn)
modal?.addEventListener('click', (e) => { if (e.target === modal) fermerModalFn() })

// =========================
// EVENTS — COMPTEURS + VALIDATION
// =========================
attacherCompteurs({ titre, description, validerTitre, validerDescription })

// =========================
// SUPPRESSION
// =========================
async function supprimer(id) {
  const ok = await confirmerSuppression()
  if (!ok) return

  try {
    await deleteIdee(id)
    cache = cache.filter((i) => i.id !== id)
    afficher()
    notification('Idée supprimée ', 'delete')
  } catch (err) {
    notification('Erreur lors de la suppression', 'delete')
    console.error(err)
  }
}

// =========================
// FILTRE
// =========================
function obtenirFiltrees() {
  let r = cache
  if (filtre?.value) r = r.filter((i) => i.categorie === filtre.value)
  if (search?.value) {
    const m = search.value.toLowerCase()
    r = r.filter(
      (i) => i.titre.toLowerCase().includes(m) || i.description.toLowerCase().includes(m)
    )
  }
  return r
}

// =========================
// RENDU
// =========================
function afficher() {
  const data = obtenirFiltrees()
  compteur.textContent = data.length

  if (!data.length) {
    liste.innerHTML    = ''
    vide.style.display = 'flex'
    afficherPagination({ total: 0, page, obtenirTaillePage, onPageChange: () => {} })
    return
  }

  vide.style.display = 'none'

  const size     = obtenirTaillePage()
  const start    = (page - 1) * size
  const pageData = data.slice(start, start + size)

  liste.innerHTML = ''
  pageData.forEach((idee) =>
    liste.appendChild(creerCarte({ idee, cache, ouvrirModalFn, supprimer }))
  )

  page = afficherPagination({
    total: data.length,
    page,
    obtenirTaillePage,
    onPageChange: (n) => { page = n; afficher() },
  })
}

filtre?.addEventListener('change', () => { page = 1; afficher() })
search?.addEventListener('input',  () => { page = 1; afficher() })

// =========================
// SOUMISSION FORMULAIRE
// =========================
form?.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (!validerFormulaire({ titre, description })) return

  const titreVal = assainir(titre.value.trim())
  const descVal  = assainir(description.value.trim())

  const btnSubmit = form.querySelector('[type=submit]')
  btnSubmit.disabled    = true
  btnSubmit.textContent = 'Validation...'

  try {
    let catVal = categorie.value

    // Si aucune catégorie choisie → laisser l'IA décider
    if (!catVal || !CATS_VALIDES.includes(catVal)) {
      btnSubmit.textContent = 'Analyse IA en cours...'
      afficherChargementIA(true)
      catVal = await devinerCategorie(titreVal, descVal, CATS_VALIDES)
      afficherChargementIA(false)
    }

    btnSubmit.textContent = 'Enregistrement...'

    if (editIdRef.value) {
      // Modification
      const updated = await updateIdee(editIdRef.value, { titre: titreVal, description: descVal, categorie: catVal })
      const idx = cache.findIndex((i) => i.id === editIdRef.value)
      if (idx !== -1) cache[idx] = formaterIdee(updated)
      notification('Idée modifiée ')
    } else {
      // Création
      const nouvelle = await insertIdee({ titre: titreVal, description: descVal, categorie: catVal })
      cache.unshift(formaterIdee(nouvelle))
      notification(`Ajoutée — ${catVal}`)
    }

    fermerModalFn()
    afficher()
  } catch (err) {
    console.error(err)
    notification('Erreur : ' + err.message, 'delete')
  } finally {
    btnSubmit.disabled    = false
    btnSubmit.textContent = 'Soumettre'
  }
})

// =========================
// REALTIME
// =========================
function demarrerTempsReel() {
  ecouterRealtime(
    // INSERT
    (nouvelle) => {
      if (!cache.find((i) => i.id === nouvelle.id)) {
        cache.unshift(formaterIdee(nouvelle))
        afficher()
      }
    },
    // UPDATE
    (modifiee) => {
      const idx = cache.findIndex((i) => i.id === modifiee.id)
      if (idx !== -1) {
        cache[idx] = formaterIdee(modifiee)
        afficher()
      }
    },
    // DELETE
    (supprimee) => {
      if (cache.find((i) => i.id === supprimee.id)) {
        cache = cache.filter((i) => i.id !== supprimee.id)
        afficher()
      }
    }
  )
}

// =========================
// BURGER MENU
// =========================
function initBurger() {
  const burger   = $('burger')
  const navLinks = document.querySelector('.navbar__links')
  burger?.addEventListener('click', () => navLinks?.classList.toggle('active'))
}

// =========================
// INIT
// =========================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await fetchIdees()
    cache = data.map(formaterIdee)
  } catch (err) {
    console.error('Erreur chargement initial :', err)
    notification('Impossible de charger les idées', 'delete')
  }

  mettreAJourCompteurs()
  afficher()
  demarrerTempsReel()
  initBurger()
})