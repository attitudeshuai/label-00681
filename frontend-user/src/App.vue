<script setup>
/**
 * 推箱子 (Sokoban) 游戏主组件
 * 
 * 技术栈: Vue 3 (Script Setup) + Tailwind CSS + Lucide Vue Next
 * 
 * 数据结构说明:
 * - 地图使用二维数组表示
 * - 0: 地板 (floor)
 * - 1: 墙壁 (wall)
 * - 2: 箱子 (box)
 * - 3: 终点 (target)
 * - 4: 玩家 (player)
 * - 5: 箱子在终点上 (box on target)
 * - 6: 玩家在终点上 (player on target)
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RotateCcw, Undo2, Settings, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy, Gamepad2 } from 'lucide-vue-next'

// ==================== 关卡数据 ====================
// 三个经典推箱子关卡：简单、中等、困难

const LEVELS = [
  {
    name: '第一关 - 入门',
    difficulty: '简单',
    map: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 2, 0, 0, 0, 1],
      [1, 0, 0, 0, 3, 0, 1],
      [1, 0, 0, 4, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    name: '第二关 - 进阶',
    difficulty: '中等',
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 2, 0, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 1],
      [1, 0, 3, 0, 3, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1]
    ]
  },
  {
    name: '第三关 - 挑战',
    difficulty: '困难',
    map: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 2, 0, 2, 0, 2, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 4, 0, 0, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 3, 0, 3, 0, 3, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
]

// ==================== 游戏状态 ====================

const currentLevelIndex = ref(0) // 当前关卡索引
const gameMap = ref([]) // 当前游戏地图
const steps = ref(0) // 步数统计
const history = ref([]) // 历史状态记录（用于撤销）
const playerPos = ref({ x: 0, y: 0 }) // 玩家位置
const isGameWon = ref(false) // 游戏胜利状态
const showSettings = ref(false) // 设置面板显示状态
const isMoving = ref(false) // 是否正在移动（用于动画锁定）

// ==================== 计算属性 ====================

// 当前关卡信息
const currentLevel = computed(() => LEVELS[currentLevelIndex.value])

// 检查是否胜利：所有终点都有箱子
const checkWin = computed(() => {
  for (let y = 0; y < gameMap.value.length; y++) {
    for (let x = 0; x < gameMap.value[y].length; x++) {
      // 如果存在没有箱子的终点（值为3），则未胜利
      if (gameMap.value[y][x] === 3 || gameMap.value[y][x] === 6) {
        return false
      }
    }
  }
  return true
})

// ==================== 核心方法 ====================

/**
 * 深拷贝地图数据
 * @param {Array} map - 地图二维数组
 * @returns {Array} 拷贝后的新数组
 */
const deepCopyMap = (map) => {
  return map.map(row => [...row])
}

/**
 * 初始化关卡
 * @param {number} levelIndex - 关卡索引
 */
const initLevel = (levelIndex = currentLevelIndex.value) => {
  currentLevelIndex.value = levelIndex
  isGameWon.value = false
  steps.value = 0
  history.value = []
  
  // 深拷贝原始地图
  gameMap.value = deepCopyMap(LEVELS[levelIndex].map)
  
  // 查找玩家初始位置
  for (let y = 0; y < gameMap.value.length; y++) {
    for (let x = 0; x < gameMap.value[y].length; x++) {
      if (gameMap.value[y][x] === 4 || gameMap.value[y][x] === 6) {
        playerPos.value = { x, y }
        return
      }
    }
  }
}

/**
 * 保存当前状态到历史记录（用于撤销）
 */
const saveHistory = () => {
  history.value.push({
    map: deepCopyMap(gameMap.value),
    playerPos: { ...playerPos.value },
    steps: steps.value
  })
}

/**
 * 撤销上一步操作
 */
const undo = () => {
  if (history.value.length === 0 || isMoving.value) return
  
  const lastState = history.value.pop()
  gameMap.value = lastState.map
  playerPos.value = lastState.playerPos
  steps.value = lastState.steps
  isGameWon.value = false
}

/**
 * 重置当前关卡
 */
const resetLevel = () => {
  initLevel(currentLevelIndex.value)
}

/**
 * 移动玩家
 * @param {number} dx - x方向移动量 (-1, 0, 1)
 * @param {number} dy - y方向移动量 (-1, 0, 1)
 */
const movePlayer = (dx, dy) => {
  if (isGameWon.value || isMoving.value) return
  
  const newX = playerPos.value.x + dx
  const newY = playerPos.value.y + dy
  
  // 检查边界
  if (newY < 0 || newY >= gameMap.value.length || 
      newX < 0 || newX >= gameMap.value[0].length) {
    return
  }
  
  const targetCell = gameMap.value[newY][newX]
  
  // 目标是墙壁，无法移动
  if (targetCell === 1) return
  
  // 保存历史状态
  saveHistory()
  
  // 获取当前位置的底层（可能是地板或终点）
  const currentCell = gameMap.value[playerPos.value.y][playerPos.value.x]
  
  // 目标是箱子或箱子在终点上
  if (targetCell === 2 || targetCell === 5) {
    // 计算箱子推动后的位置
    const boxNewX = newX + dx
    const boxNewY = newY + dy
    
    // 检查箱子推动后的位置是否有效
    if (boxNewY < 0 || boxNewY >= gameMap.value.length ||
        boxNewX < 0 || boxNewX >= gameMap.value[0].length) {
      history.value.pop() // 撤销保存的历史
      return
    }
    
    const beyondCell = gameMap.value[boxNewY][boxNewX]
    
    // 箱子后面是墙壁或另一个箱子，无法推动
    if (beyondCell === 1 || beyondCell === 2 || beyondCell === 5) {
      history.value.pop() // 撤销保存的历史
      return
    }
    
    // 移动箱子
    // 箱子新位置：如果是终点(3)则变成箱子在终点(5)，否则变成普通箱子(2)
    gameMap.value[boxNewY][boxNewX] = beyondCell === 3 ? 5 : 2
    
    // 箱子原位置变成玩家
    // 如果箱子原来在终点上(5)，则玩家现在在终点上(6)，否则玩家在普通地板(4)
    gameMap.value[newY][newX] = targetCell === 5 ? 6 : 4
    
    // 玩家原位置：如果玩家原来在终点上(6)，则恢复为终点(3)，否则恢复为地板(0)
    gameMap.value[playerPos.value.y][playerPos.value.x] = currentCell === 6 ? 3 : 0
    
    // 更新玩家位置
    playerPos.value = { x: newX, y: newY }
    steps.value++
    
    // 添加移动动画锁定
    isMoving.value = true
    setTimeout(() => {
      isMoving.value = false
    }, 150)
    
    // 检查胜利
    if (checkWin.value) {
      isGameWon.value = true
    }
    
    return
  }
  
  // 目标是地板或终点，直接移动
  if (targetCell === 0 || targetCell === 3) {
    // 玩家新位置：如果是终点(3)则变成玩家在终点(6)，否则变成普通玩家(4)
    gameMap.value[newY][newX] = targetCell === 3 ? 6 : 4
    
    // 玩家原位置：如果玩家原来在终点上(6)，则恢复为终点(3)，否则恢复为地板(0)
    gameMap.value[playerPos.value.y][playerPos.value.x] = currentCell === 6 ? 3 : 0
    
    // 更新玩家位置
    playerPos.value = { x: newX, y: newY }
    steps.value++
    
    // 添加移动动画锁定
    isMoving.value = true
    setTimeout(() => {
      isMoving.value = false
    }, 150)
  }
}

// ==================== 方向控制方法 ====================

const moveUp = () => movePlayer(0, -1)
const moveDown = () => movePlayer(0, 1)
const moveLeft = () => movePlayer(-1, 0)
const moveRight = () => movePlayer(1, 0)

// ==================== 键盘事件处理 ====================

const handleKeydown = (e) => {
  // 阻止方向键的默认滚动行为
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
    e.preventDefault()
  }

  if (isGameWon.value) return

  switch(e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      moveUp()
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      moveDown()
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      moveLeft()
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      moveRight()
      break
    case 'r':
    case 'R':
      resetLevel()
      break
  }

  // 撤销：Ctrl+Z 或 U
  if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'u' || e.key === 'U') {
    e.preventDefault() // 防止 Ctrl+Z 的默认行为，对 U 也没坏处
    undo()
  }
}

/**
 * 获取单元格的 CSS 类名
 * @param {number} cell - 单元格值
 * @returns {string} CSS 类名字符串
 */
const getCellClass = (cell) => {
  const baseClass = 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg transition-all duration-150 flex items-center justify-center text-lg sm:text-xl md:text-2xl'
  
  switch (cell) {
    case 0: // 地板
      return `${baseClass} bg-slate-800/40 border border-slate-700/30`
    case 1: // 墙壁 - 阻碍物：更深的颜色，明显的边框和立体感
      return `${baseClass} bg-slate-900 border border-slate-600 shadow-inner`
    case 2: // 箱子
      return `${baseClass} bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30`
    case 3: // 终点
      return `${baseClass} bg-slate-800/40 ring-2 ring-emerald-400/60 ring-inset`
    case 4: // 玩家
      return `${baseClass} bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-blue-500/40`
    case 5: // 箱子在终点上
      return `${baseClass} bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-500/40`
    case 6: // 玩家在终点上
      return `${baseClass} bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-blue-500/40 ring-2 ring-emerald-400/60 ring-inset`
    default:
      return baseClass
  }
}

/**
 * 获取单元格内显示的 emoji
 * @param {number} cell - 单元格值
 * @returns {string} emoji 字符
 */
const getCellEmoji = (cell) => {
  switch (cell) {
    case 2: return '📦' // 箱子
    case 4: return '😊' // 玩家
    case 5: return '✅' // 箱子在终点上
    case 6: return '😊' // 玩家在终点上
    default: return ''
  }
}

// ==================== 选关方法 ====================

const selectLevel = (index) => {
  initLevel(index)
  showSettings.value = false
}

// 进入下一关
const nextLevel = () => {
  if (currentLevelIndex.value < LEVELS.length - 1) {
    initLevel(currentLevelIndex.value + 1)
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  initLevel(0)
  // 禁止页面滚动，防止按方向键时页面移动
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 恢复页面滚动
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- 主容器：深蓝色背景，全屏 -->
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-sans text-slate-200">
    
    <!-- 内容容器：移动端单列，PC端双列 -->
    <div class="p-4 mx-auto max-w-[1400px] h-screen grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 content-start lg:content-center items-center lg:p-8">

      <!-- ==================== 左侧 / 移动端顶部：游戏主舞台 ==================== -->
      <div class="lg:col-span-8 xl:col-span-9 flex flex-col items-center justify-center w-full h-full">
        
        <!-- 移动端顶部栏 (PC端隐藏) -->
        <div class="lg:hidden w-full max-w-lg mb-4 flex items-center justify-between p-4 bg-slate-800/60 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700/50">
          <div class="flex items-center gap-2">
            <Gamepad2 class="w-6 h-6 text-cyan-400" />
            <h1 class="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">推箱子</h1>
          </div>
          <div class="flex items-center gap-3">
             <span class="text-sm font-bold text-amber-400 bg-slate-700/50 px-3 py-1 rounded-lg">Step: {{ steps }}</span>
            <button @click="showSettings = !showSettings" class="p-2 bg-slate-700/50 rounded-lg text-cyan-400"><Settings class="w-5 h-5"/></button>
          </div>
        </div>

        <!-- 移动端选关面板 (PC端隐藏) -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="showSettings" class="lg:hidden w-full max-w-lg mb-4 p-4 bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 z-10 absolute top-20 shadow-2xl">
              <p class="text-sm text-slate-400 mb-2">选择关卡：</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(level, index) in LEVELS"
                  :key="index"
                  @click="selectLevel(index)"
                  :class="[
                    'px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    currentLevelIndex === index
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-600/50 text-slate-300'
                  ]"
                >
                  {{ level.name }}
                </button>
              </div>
          </div>
        </Transition>

        <!-- 游戏地图容器 -->
        <div class="relative group w-full max-w-lg lg:max-w-none flex flex-col items-center">
          
          <!-- 地图主体 -->
          <div 
            class="inline-grid gap-1 p-3 sm:p-4 lg:p-6 bg-slate-900/50 rounded-2xl lg:rounded-3xl shadow-2xl shadow-black/20 border border-slate-700/30 transition-all duration-500 lg:scale-110 xl:scale-125"
            :style="{ gridTemplateColumns: `repeat(${gameMap[0]?.length || 7}, minmax(0, 1fr))` }"
          >
            <TransitionGroup name="cell">
              <template v-for="(row, y) in gameMap" :key="y">
                <div
                  v-for="(cell, x) in row"
                  :key="`${x}-${y}`"
                  :class="getCellClass(cell)"
                >
                  <span class="select-none">{{ getCellEmoji(cell) }}</span>
                </div>
              </template>
            </TransitionGroup>
          </div>

          <!-- 胜利提示 (移动端/PC通用，居中显示) -->
          <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 scale-75 translate-y-4"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-75 translate-y-4"
          >
            <div v-if="isGameWon" class="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div class="pointer-events-auto p-6 lg:p-8 rounded-3xl bg-slate-800/95 backdrop-blur-2xl border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/20 text-center transform transition-all hover:scale-105">
                <div class="flex items-center justify-center gap-3 mb-3">
                  <Trophy class="w-10 h-10 text-amber-400 animate-bounce" />
                  <span class="text-3xl font-bold text-emerald-400 bg-clip-text">恭喜通关！</span>
                </div>
                <p class="text-slate-300 mb-6 text-lg">耗时 <span class="text-amber-400 font-bold text-xl">{{ steps }}</span> 步</p>
                <div class="flex gap-4 justify-center">
                  <button @click="resetLevel" class="px-6 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-medium transition-colors">重玩</button>
                  <button v-if="currentLevelIndex < LEVELS.length - 1" @click="nextLevel" class="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/30 transition-colors">下一关</button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 移动端底部控制区 (PC端隐藏) -->
         <div class="lg:hidden mt-8 w-full max-w-xs grid grid-cols-3 gap-3">
            <div></div>
            <button @click="moveUp" class="p-4 rounded-2xl bg-slate-700 shadow-xl border border-slate-600 text-cyan-400 flex justify-center active:scale-95 transition-transform hover:bg-slate-600"><ChevronUp class="w-8 h-8"/></button>
            <div></div>
            <button @click="moveLeft" class="p-4 rounded-2xl bg-slate-700 shadow-xl border border-slate-600 text-cyan-400 flex justify-center active:scale-95 transition-transform hover:bg-slate-600"><ChevronLeft class="w-8 h-8"/></button>
            <button @click="moveDown" class="p-4 rounded-2xl bg-slate-700 shadow-xl border border-slate-600 text-cyan-400 flex justify-center active:scale-95 transition-transform hover:bg-slate-600"><ChevronDown class="w-8 h-8"/></button>
            <button @click="moveRight" class="p-4 rounded-2xl bg-slate-700 shadow-xl border border-slate-600 text-cyan-400 flex justify-center active:scale-95 transition-transform hover:bg-slate-600"><ChevronRight class="w-8 h-8"/></button>
         </div>
         <div class="lg:hidden flex gap-4 mt-6">
            <button @click="undo" :disabled="history.length===0" class="flex flex-col items-center gap-1 bg-slate-700/80 border border-slate-600 px-6 py-2 rounded-xl shadow-lg text-slate-200 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"><Undo2 class="w-6 h-6"/> <span class="text-xs font-medium">撤销</span></button>
             <button @click="resetLevel" class="flex flex-col items-center gap-1 bg-slate-700/80 border border-slate-600 px-6 py-2 rounded-xl shadow-lg text-amber-400 active:scale-95 transition-transform"><RotateCcw class="w-6 h-6"/> <span class="text-xs font-medium">重置</span></button>
         </div>

      </div>

      <!-- ==================== 右侧：PC端控制面板 (Web Only) ==================== -->
      <div class="hidden lg:flex lg:col-span-4 xl:col-span-3 flex-col gap-6 h-full justify-center">
        
        <!-- 1. 标题卡片 -->
        <div class="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl">
           <div class="flex items-center gap-3 mb-2">
            <div class="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
               <Gamepad2 class="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white tracking-tight">推箱子</h1>
              <p class="text-xs text-slate-400 font-medium tracking-wider">SOKOBAN MASTER</p>
            </div>
          </div>
        </div>

        <!-- 2. 数据与控制 -->
        <div class="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl flex flex-col gap-6">
          
          <!-- 步数显示 -->
          <div class="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/40 border border-slate-700/30">
             <span class="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">当前步数</span>
             <span class="text-5xl font-black text-amber-400 tabular-nums tracking-tight drop-shadow-md">{{ steps }}</span>
          </div>

          <!-- 控制按钮组 -->
          <div class="grid grid-cols-2 gap-3">
             <button 
                @click="undo" 
                :disabled="history.length === 0 || isMoving"
                class="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-700/50 hover:bg-cyan-500/10 hover:text-cyan-400 border border-slate-600/30 hover:border-cyan-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <Undo2 class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span class="font-medium">撤销</span>
             </button>
             <button 
                @click="resetLevel" 
                class="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-700/50 hover:bg-amber-500/10 hover:text-amber-400 border border-slate-600/30 hover:border-amber-500/50 transition-all group"
              >
                <RotateCcw class="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span class="font-medium">重置</span>
             </button>
          </div>
        </div>

        <!-- 3. 关卡列表 -->
        <div class="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl flex-1 max-h-[400px] flex flex-col">
           <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy class="w-4 h-4" /> 关卡选择
           </h3>
           <div class="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <button
                v-for="(level, index) in LEVELS"
                :key="index"
                @click="selectLevel(index)"
                :class="[
                  'w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-center justify-between group',
                  currentLevelIndex === index
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/50 text-cyan-400 shadow-md shadow-cyan-900/20'
                    : 'bg-slate-900/20 border-transparent hover:bg-slate-700/30 text-slate-400 hover:text-slate-200'
                ]"
              >
                <div class="flex items-center gap-3">
                   <div :class="['w-2 h-2 rounded-full', currentLevelIndex === index ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600']"></div>
                   <span class="font-medium">{{ level.name }}</span>
                </div>
                <ChevronRight v-if="currentLevelIndex === index" class="w-4 h-4 opacity-100" />
              </button>
           </div>
        </div>

        <!-- 4. 操作说明 -->
         <div class="bg-gradient-to-br from-sky-600/80 to-blue-600/80 backdrop-blur-xl rounded-3xl p-5 border border-sky-400/30 shadow-xl text-white relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Gamepad2 class="w-24 h-24 -rotate-12" />
            </div>
            <h3 class="font-bold text-lg mb-1">操作指南</h3>
            <p class="text-sky-100 text-sm opacity-90 mb-3">掌握技巧，轻松通关！</p>
            <div class="space-y-2 text-xs font-medium text-sky-50">
               <div class="flex items-center gap-2 bg-blue-900/30 p-2 rounded-lg">
                  <span class="bg-white/20 px-1.5 py-0.5 rounded text-white">WASD</span>
                  <span>控制移动</span>
               </div>
               <div class="flex items-center gap-2 bg-blue-900/30 p-2 rounded-lg">
                  <span class="bg-white/20 px-1.5 py-0.5 rounded text-white">R</span>
                  <span>快速重置</span>
                  <span class="bg-white/20 px-1.5 py-0.5 rounded text-white ml-2">U</span>
                  <span>撤销</span>
               </div>
            </div>
         </div>

      </div>

    </div>
  </div>
</template>

<style>
/* 单元格过渡动画 */
.cell-move,
.cell-enter-active,
.cell-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.cell-enter-from,
.cell-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.8);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 1);
}
</style>
