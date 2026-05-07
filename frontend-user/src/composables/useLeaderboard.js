const STORAGE_KEY = 'sokoban_leaderboard'

function loadLeaderboard() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
    return {}
  }
}

function saveLeaderboard(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save leaderboard:', e)
  }
}

export function useLeaderboard() {
  const getLeaderboardForLevel = (levelIndex) => {
    const leaderboardData = loadLeaderboard()
    const levelKey = `level_${levelIndex}`
    const records = leaderboardData[levelKey] || []
    return [...records].sort((a, b) => a.steps - b.steps)
  }

  const submitRecord = (levelIndex, nickname, steps) => {
    const leaderboardData = loadLeaderboard()
    const levelKey = `level_${levelIndex}`
    const trimmedNickname = nickname.trim()

    if (!trimmedNickname) {
      return { success: false, message: '昵称不能为空' }
    }

    if (!leaderboardData[levelKey]) {
      leaderboardData[levelKey] = []
    }

    const existingIndex = leaderboardData[levelKey].findIndex(
      record => record.nickname === trimmedNickname
    )

    if (existingIndex !== -1) {
      const existingRecord = leaderboardData[levelKey][existingIndex]
      if (steps < existingRecord.steps) {
        leaderboardData[levelKey][existingIndex] = {
          nickname: trimmedNickname,
          steps,
          timestamp: Date.now()
        }
        saveLeaderboard(leaderboardData)
        return { success: true, isNewRecord: true, message: '恭喜！刷新个人最佳记录！' }
      } else {
        return {
          success: false,
          isNewRecord: false,
          message: `当前最佳记录为 ${existingRecord.steps} 步，本次 ${steps} 步未能超越`
        }
      }
    }

    leaderboardData[levelKey].push({
      nickname: trimmedNickname,
      steps,
      timestamp: Date.now()
    })

    saveLeaderboard(leaderboardData)
    return { success: true, isNewRecord: true, message: '记录提交成功！' }
  }

  const clearLeaderboard = (levelIndex = null) => {
    if (levelIndex === null) {
      saveLeaderboard({})
    } else {
      const leaderboardData = loadLeaderboard()
      const levelKey = `level_${levelIndex}`
      delete leaderboardData[levelKey]
      saveLeaderboard(leaderboardData)
    }
  }

  const hasRecordForLevel = (levelIndex) => {
    return getLeaderboardForLevel(levelIndex).length > 0
  }

  const getBestStepForLevel = (levelIndex) => {
    const records = getLeaderboardForLevel(levelIndex)
    return records.length > 0 ? records[0].steps : null
  }

  return {
    getLeaderboardForLevel,
    submitRecord,
    clearLeaderboard,
    hasRecordForLevel,
    getBestStepForLevel
  }
}
