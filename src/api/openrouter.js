const CATEGORIES_DEFAUT = [
  'Amélioration technique',
  'Pédagogie',
  'Événement',
  'Vie de campus',
  'Ressources',
  'Collaboration',
  'autres',
]

const FALLBACK_CATEGORIE = 'Amélioration technique'

function normaliser(str) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

/**
 * Demande à l'IA de catégoriser une idée via OpenRouter
 * Retourne toujours une catégorie valide (jamais d'exception non gérée)
 */
export async function devinerCategorie(titre, description, categories = CATEGORIES_DEFAUT) {
  const prompt = `Tu es un assistant qui classe des idées soumises par des étudiants dans une plateforme communautaire.

Voici l'idée à classer :
- Titre : "${titre}"
- Description : "${description}"

Catégories disponibles :
${categories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Réponds UNIQUEMENT avec le nom exact de la catégorie la plus appropriée, sans explication, sans ponctuation supplémentaire.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Sunu-Idées Cloud',
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:freem',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`)

    const data   = await response.json()
    const texte  = data.choices?.[0]?.message?.content?.trim() || ''
    const trouvee = categories.find((c) => normaliser(c) === normaliser(texte))
    return trouvee || FALLBACK_CATEGORIE

  } catch (err) {
    console.warn('IA indisponible, catégorie par défaut utilisée :', err.message)
    return FALLBACK_CATEGORIE
  }
}