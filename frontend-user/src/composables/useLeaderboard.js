import { ref, computed } from 'vue'

const STORAGE_KEY = 'sokoban-leaderboard'

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useLeaderboard() {
  const records = ref(loadAll())

  const getRanking = (levelIndex) => {
    const list = records.value[levelIndex] || []
    return [...list].sort((a, b) => a.steps - b.steps)
  }

  const submitScore = (levelIndex, nickname, steps) => {
    const all = loadAll()
    if (!all[levelIndex]) {
      all[levelIndex] = []
    }
    const existing = all[levelIndex].findIndex(r => r.nickname === nickname)
    if (existing !== -1) {
      if (steps >= all[levelIndex][existing].steps) {
        records.value = all
        return false
      }
      all[levelIndex][existing].steps = steps
      all[levelIndex][existing].timestamp = Date.now()
    } else {
      all[levelIndex].push({
        nickname,
        steps,
        timestamp: Date.now()
      })
    }
    all[levelIndex].sort((a, b) => a.steps - b.steps)
    if (all[levelIndex].length > 50) {
      all[levelIndex] = all[levelIndex].slice(0, 50)
    }
    saveAll(all)
    records.value = all
    return true
  }

  const getRank = (levelIndex, steps) => {
    const ranking = getRanking(levelIndex)
    const idx = ranking.findIndex(r => r.steps > steps)
    return idx === -1 ? ranking.length + 1 : idx + 1
  }

  return {
    records,
    getRanking,
    submitScore,
    getRank
  }
}
