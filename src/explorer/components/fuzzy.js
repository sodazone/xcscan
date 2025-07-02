function levenshtein(a, b) {
  const m = a.length,
    n = b.length
  const dp = Array.from({ length: m + 1 }, (_, _i) => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return dp[m][n]
}

function fuzzyFilter(input, list, maxDistance = 3) {
  const query = input.trim().toLowerCase()

  return list
    .map((item) => {
      const lower = item.toLowerCase()

      if (lower == query) return { item, score: 0 }
      if (lower.startsWith(query)) return { item, score: 1 }
      if (lower.includes(query)) return { item, score: 2 }

      const words = lower.split(/\s+/)
      const minDistance = Math.min(
        ...words.map((word) => levenshtein(query, word))
      )

      return { item, score: minDistance + 3 }
    })
    .filter(({ score }) => score <= maxDistance + 3)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.item.length - b.item.length // tie-break
    })
    .map(({ item }) => item)
}

export function createFuzzySearch({
  container,
  items,
  maxDistance = 3,
  onFilter,
}) {
  const el = document.createElement('div')
  el.className = 'relative w-full'

  el.innerHTML = `
    <input class="fuzzy-input w-full py-2 pl-4 pr-8 bg-[#121212]/90 text-white placeholder-white/40 
                   focus:outline-none focus:bg-teal-300/10 focus:border-teal-300/20 
                   transition duration-200"
           type="text" placeholder="Search..." />
    <button type="button" class="clear-btn absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white hidden cursor-pointer">
      ✕
    </button>
  `

  const input = el.querySelector('input')
  const clearBtn = el.querySelector('.clear-btn')
  container.appendChild(el)

  function updateMatches() {
    const query = input.value.trim().toLowerCase()
    const matches = query ? fuzzyFilter(query, items, maxDistance) : items

    clearBtn.classList.toggle('hidden', !query)

    if (onFilter) onFilter(matches)
  }

  input.addEventListener('input', updateMatches)

  // Select all text when input gains focus
  input.addEventListener('focus', () => {
    input.select()
  })

  // Clear on ✕ button click
  clearBtn.addEventListener('click', () => {
    input.value = ''
    updateMatches()
    input.focus()
  })

  return input
}
