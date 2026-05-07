<script setup>
import { ref, computed, watch } from 'vue'
import { Trophy, X, Medal, Star } from 'lucide-vue-next'
import { useLeaderboard } from '../composables/useLeaderboard'
import { LEVELS } from '../data/levels'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  currentLevelIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close'])

const { getLeaderboardForLevel } = useLeaderboard()

const currentLevel = computed(() => LEVELS[props.currentLevelIndex])

const leaderboard = ref([])

const refreshLeaderboard = () => {
  leaderboard.value = getLeaderboardForLevel(props.currentLevelIndex)
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    refreshLeaderboard()
  }
}, { immediate: true })

const getRankIcon = (index) => {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return null
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="handleClose">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 scale-75 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-75 translate-y-4"
      >
        <div v-if="visible" class="relative bg-slate-800/95 backdrop-blur-2xl border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div class="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <Trophy class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">排行榜</h3>
                <p class="text-xs text-slate-400">{{ currentLevel?.name }}</p>
              </div>
            </div>
            <button 
              @click="handleClose"
              class="p-2 rounded-xl hover:bg-slate-700/50 transition-colors"
            >
              <X class="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div class="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div v-if="leaderboard.length === 0" class="text-center py-12">
              <div class="flex justify-center mb-4">
                <Star class="w-16 h-16 text-slate-600" />
              </div>
              <p class="text-slate-400 font-medium">暂无记录</p>
              <p class="text-slate-500 text-sm mt-1">快来成为第一个上榜的玩家吧！</p>
            </div>

            <div v-else class="space-y-3">
              <div 
                v-for="(record, index) in leaderboard" 
                :key="index"
                class="flex items-center gap-4 p-3 rounded-2xl transition-colors"
                :class="{
                  'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30': index === 0,
                  'bg-gradient-to-r from-slate-400/20 to-slate-300/10 border border-slate-400/30': index === 1,
                  'bg-gradient-to-r from-orange-600/20 to-amber-700/10 border border-orange-600/30': index === 2,
                  'bg-slate-700/30 border border-slate-700/50': index > 2
                }"
              >
                <div 
                  class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                  :class="{
                    'bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30': index === 0,
                    'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-lg shadow-slate-400/30': index === 1,
                    'bg-gradient-to-br from-orange-600 to-amber-700 text-white shadow-lg shadow-orange-600/30': index === 2,
                    'bg-slate-600/50 text-slate-300': index > 2
                  }"
                >
                  <Medal v-if="getRankIcon(index)" class="w-5 h-5" />
                  <span v-else>{{ index + 1 }}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <p class="font-medium text-white truncate">{{ record.nickname }}</p>
                  <p class="text-xs text-slate-400">{{ formatDate(record.timestamp) }}</p>
                </div>

                <div class="text-right flex-shrink-0">
                  <p 
                    class="text-xl font-bold"
                    :class="{
                      'text-amber-400': index === 0,
                      'text-slate-300': index === 1,
                      'text-orange-400': index === 2,
                      'text-slate-200': index > 2
                    }"
                  >
                    {{ record.steps }} <span class="text-xs font-normal text-slate-400">步</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
