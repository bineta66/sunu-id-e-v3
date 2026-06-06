import { $ } from './ui.js'

export function mettreAJourCompteurs({ titre, description }) {
  const cTitre = $('counterTitre')
  const cDesc  = $('counterDescription')

  if (cTitre) {
    const restants = Math.max(0, 20 - titre.value.length)
    cTitre.textContent = `${restants} restant${restants !== 1 ? 's' : ''}`
    cTitre.style.color = restants <= 3 ? '#ef4444' : '#9ca3af'
  }

  if (cDesc) {
    const restants = Math.max(0, 255 - description.value.length)
    cDesc.textContent = `${restants} restant${restants !== 1 ? 's' : ''}`
    cDesc.style.color = restants <= 20 ? '#ef4444' : '#9ca3af'
  }
}

export function attacherCompteurs({ titre, description, validerTitre, validerDescription }) {
  titre?.addEventListener('input', () => {
    mettreAJourCompteurs({ titre, description })
    validerTitre(titre)
  })
  titre?.addEventListener('blur', () => validerTitre(titre))

  description?.addEventListener('input', () => {
    mettreAJourCompteurs({ titre, description })
    validerDescription(description)
  })
  description?.addEventListener('blur', () => validerDescription(description))
}
