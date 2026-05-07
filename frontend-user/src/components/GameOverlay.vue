<script setup>
import { ref, computed, watch } from 'vue'
import { Trophy, Medal, Send, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useLeaderboard } from '../composables/useLeaderboard'

const props = defineProps({
  isGameWon: {
    type: Boolean,
    required: true
  },
  steps: {
    type: Number,
    required: true
  },
  hasNextLevel: {
    type: Boolean,
    required: true
  },
  levelIndex: {
    type: Number,
    required: true
  }
})

defineEmits(['reset', 'nextLevel'])

const { getRanking, submitScore, getRank } = useLeaderboard()

const nickname = ref('')
const submitted = ref(false)
const submitFailed = ref(false)
const showLeaderboard = ref(true)

watch(() => props.isGameWon, (val) => {
  if (val) {
    nickname.value = ''
    submitted.value = false
    submitFailed.value = false
    showLeaderboard.value = true
  }
})

const ranking = computed(() => getRanking(props.levelIndex))

const currentRank = computed(() => {
  if (!props.isGameWon) return null
  return getRank(props.levelIndex, props.steps)
})

const handleSubmit = () => {
  const name = nickname.value.trim()
  if (!name) return
  const ok = submitScore(props.levelIndex, name, props.steps)
  if (ok) {
    submitted.value = true
  } else {
    submitFailed.value = true
  }
}

const handleKeydownInput = (e) => {
  if (e.key === 'Enter') {
    handleSubmit()
  }
}

const rankIcon = (index) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return null
}

const rankClass = (index) => {
  if (index === 0) return 'text-amber-400'
  if (index === 1) return 'text-slate-300'
  if (index === 2) return 'text-amber-600'
  return 'text-slate-500'
}

const formatTime = (ts) => {
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 scale-75 translate-y-4"
    enter-to-class="opacity-100 scale-100 translate-y-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 scale-100 translate-y-0"
    leave-to-class="opacity-0 scale-75 translate-y-4"
  >
    <div v-if="isGameWon" class="absolute inset-0 flex items-center justify-center z-20 bg-black/30">
      <div class="p-6 lg:p-8 rounded-3xl bg-slate-800/95 backdrop-blur-2xl border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/20 text-center max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar">

        <div class="flex items-center justify-center gap-3 mb-2">
          <Trophy class="w-10 h-10 text-amber-400 animate-bounce" />
          <span class="text-3xl font-bold text-emerald-400 bg-clip-text">恭喜通关！</span>
        </div>
        <p class="text-slate-300 mb-1 text-lg">耗时 <span class="text-amber-400 font-bold text-xl">{{ steps }}</span> 步</p>
        <p v-if="currentRank" class="text-slate-400 text-sm mb-4">当前排名第 <span class="text-cyan-400 font-bold">{{ currentRank }}</span> 名</p>

        <div v-if="!submitted" class="mb-4">
          <div class="flex gap-2">
            <input
              v-model="nickname"
              @keydown="handleKeydownInput"
              placeholder="输入昵称提交成绩"
              maxlength="12"
              class="flex-1 px-4 py-2 rounded-xl bg-slate-700/60 border border-slate-600/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 text-sm"
            />
            <button
              @click="handleSubmit"
              :disabled="!nickname.trim()"
              class="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Send class="w-4 h-4" />
              提交
            </button>
          </div>
          <p v-if="submitFailed" class="text-amber-400/80 text-xs mt-2">未刷新纪录，你的历史最优步数更好</p>
        </div>
        <div v-else class="mb-4 flex items-center justify-center gap-1 text-emerald-400 text-sm">
          <span>✓ 成绩已提交</span>
        </div>

        <div class="mb-4">
          <button
            @click="showLeaderboard = !showLeaderboard"
            class="flex items-center justify-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors w-full"
          >
            <Medal class="w-4 h-4" />
            <span>排行榜</span>
            <ChevronDown v-if="!showLeaderboard" class="w-4 h-4" />
            <ChevronUp v-else class="w-4 h-4" />
          </button>
        </div>

        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2 max-h-0"
          enter-to-class="opacity-100 translate-y-0 max-h-96"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 max-h-96"
          leave-to-class="opacity-0 -translate-y-2 max-h-0"
        >
          <div v-if="showLeaderboard" class="mb-4">
            <div v-if="ranking.length === 0" class="text-slate-500 text-sm py-4">暂无记录，成为第一个！</div>
            <div v-else class="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              <div
                v-for="(record, index) in ranking"
                :key="index"
                :class="[
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  index < 3 ? 'bg-slate-700/40' : 'bg-slate-800/30'
                ]"
              >
                <span :class="['w-6 text-center font-bold text-xs', rankClass(index)]">
                  {{ rankIcon(index) || (index + 1) }}
                </span>
                <span class="flex-1 text-left text-slate-300 truncate">{{ record.nickname }}</span>
                <span class="text-amber-400 font-bold tabular-nums">{{ record.steps }}步</span>
                <span class="text-slate-600 text-xs">{{ formatTime(record.timestamp) }}</span>
              </div>
            </div>
          </div>
        </Transition>

        <div class="flex gap-4 justify-center">
          <button @click="$emit('reset')" class="px-6 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">重玩</button>
          <button v-if="hasNextLevel" @click="$emit('nextLevel')" class="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/30 transition-colors">下一关</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
