<script setup>
import { ref, watch } from 'vue'
import { Trophy, Award, BarChart3 } from 'lucide-vue-next'
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
  currentLevelIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['reset', 'nextLevel', 'showLeaderboard'])

const { submitRecord } = useLeaderboard()
const nickname = ref('')
const submitStatus = ref(null)
const isSubmitted = ref(false)

watch(() => props.isGameWon, (newVal) => {
  if (!newVal) {
    nickname.value = ''
    submitStatus.value = null
    isSubmitted.value = false
  }
})

const handleSubmit = () => {
  const result = submitRecord(props.currentLevelIndex, nickname.value, props.steps)
  submitStatus.value = result
  if (result.success) {
    isSubmitted.value = true
  }
}

const handleShowLeaderboard = () => {
  emit('showLeaderboard')
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
    <div v-if="isGameWon" class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
      <div class="pointer-events-auto p-6 lg:p-8 rounded-3xl bg-slate-800/95 backdrop-blur-2xl border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/20 text-center transform transition-all">
        <div class="flex items-center justify-center gap-3 mb-3">
          <Trophy class="w-10 h-10 text-amber-400 animate-bounce" />
          <span class="text-3xl font-bold text-emerald-400 bg-clip-text">恭喜通关！</span>
        </div>
        <p class="text-slate-300 mb-6 text-lg">耗时 <span class="text-amber-400 font-bold text-xl">{{ steps }}</span> 步</p>

        <div v-if="!isSubmitted" class="mb-6">
          <p class="text-slate-400 text-sm mb-3">提交成绩到排行榜</p>
          <div class="flex gap-2 justify-center">
            <input
              v-model="nickname"
              type="text"
              placeholder="输入昵称"
              maxlength="10"
              class="px-4 py-2 rounded-xl bg-slate-700/80 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors w-36"
              @keyup.enter="handleSubmit"
            />
            <button 
              @click="handleSubmit" 
              class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-medium transition-colors flex items-center gap-1"
            >
              <Award class="w-4 h-4" />
              提交
            </button>
          </div>
          <p v-if="submitStatus" class="text-sm mt-2" :class="submitStatus.success ? 'text-emerald-400' : 'text-orange-400'">
            {{ submitStatus.message }}
          </p>
        </div>

        <div v-if="isSubmitted" class="mb-6">
          <p class="text-emerald-400 flex items-center justify-center gap-2">
            <Award class="w-5 h-5" />
            {{ submitStatus?.message }}
          </p>
        </div>

        <div class="flex gap-3 justify-center flex-wrap">
          <button @click="handleShowLeaderboard" class="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors flex items-center gap-1">
            <BarChart3 class="w-4 h-4" />
            排行榜
          </button>
          <button @click="$emit('reset')" class="px-5 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">重玩</button>
          <button v-if="hasNextLevel" @click="$emit('nextLevel')" class="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/30 transition-colors">下一关</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
