import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGameStore } from '../src/store/useGameStore'
import * as mathEngine from '../src/utils/mathEngine'
import { GAME_CONSTANTS } from '../src/utils/constants'

vi.mock('../src/store/useStoryStore', () => ({
  useStoryStore: {
    getState: vi.fn()
  }
}))

vi.mock('../src/utils/mathEngine', () => ({
  evaluateEquivalence: vi.fn(),
  parseDesmosChange: vi.fn()
}))

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset the store to initial state
    useGameStore.setState({
      currentRoute: null,
      currentChapter: null,
      currentLevel: null,
      gameMode: 'random',
      targetFunction: 'x^2',
      levelParams: {},
      playerInput: 'x',
      playerParams: {},
      isLevelCleared: false,
      domain: GAME_CONSTANTS.DEFAULT_DOMAIN,
      randomDifficulty: 2.0,
      randomWithParams: false,
      completedLevels: [],
      seenChapters: [],
      readFiles: []
    })
    vi.clearAllMocks()
  })

  it('setTargetFunction should update state correctly', () => {
    const store = useGameStore.getState()
    store.setTargetFunction('sin(x)', { a: 1 }, 'story')

    const newState = useGameStore.getState()
    expect(newState.targetFunction).toBe('sin(x)')
    expect(newState.levelParams).toEqual({ a: 1 })
    expect(newState.gameMode).toBe('story')
    expect(newState.playerInput).toBe('x')
    expect(newState.isLevelCleared).toBe(false)
  })

  it('setPlayerInput should update state correctly', () => {
    const store = useGameStore.getState()
    store.setPlayerInput('x+1', { b: 2 })

    const newState = useGameStore.getState()
    expect(newState.playerInput).toBe('x+1')
    expect(newState.playerParams).toEqual({ b: 2 })
  })

  it('setDomain should update state correctly', () => {
    const store = useGameStore.getState()
    const testMin = -5
    const testMax = 5
    store.setDomain([testMin, testMax])

    const newState = useGameStore.getState()
    expect(newState.domain).toEqual([testMin, testMax])
  })

  it('setRandomConfig should update state correctly', () => {
    const store = useGameStore.getState()
    const testDifficulty = 3.5
    store.setRandomConfig(testDifficulty, true)

    const newState = useGameStore.getState()
    expect(newState.randomDifficulty).toBe(testDifficulty)
    expect(newState.randomWithParams).toBe(true)
  })

  it('evaluateInput should handle empty inputs', async () => {
    useGameStore.setState({ targetFunction: '', playerInput: '' })
    const store = useGameStore.getState()

    const result = await store.evaluateInput()
    expect(result.isMatch).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('evaluateInput should return true and update isLevelCleared on match', async () => {
    vi.mocked(mathEngine.evaluateEquivalence).mockResolvedValue({ isMatch: true })

    useGameStore.setState({
      targetFunction: 'x^2',
      playerInput: 'x * x',
      levelParams: { a: 1 },
      playerParams: { b: 2 }
    })

    const store = useGameStore.getState()
    const result = await store.evaluateInput()

    expect(mathEngine.evaluateEquivalence).toHaveBeenCalledWith('x^2', 'x * x', { a: 1, b: 2 })
    expect(result.isMatch).toBe(true)
    expect(useGameStore.getState().isLevelCleared).toBe(true)
  })

  it('evaluateInput should not update isLevelCleared on failure', async () => {
    vi.mocked(mathEngine.evaluateEquivalence).mockResolvedValue({ isMatch: false, reason: 'Value mismatch' })

    useGameStore.setState({
      targetFunction: 'x^2',
      playerInput: 'x+1',
      levelParams: { a: 1 },
      playerParams: { b: 2 }
    })

    const store = useGameStore.getState()
    const result = await store.evaluateInput()

    expect(result.isMatch).toBe(false)
    expect(result.reason).toBe('Value mismatch')
    expect(useGameStore.getState().isLevelCleared).toBe(false)
  })

  it('nextLevel should reset isLevelCleared and playerInput', () => {
    useGameStore.setState({ isLevelCleared: true, playerInput: 'x^2' })
    const store = useGameStore.getState()

    store.nextLevel()
    const newState = useGameStore.getState()
    expect(newState.isLevelCleared).toBe(false)
    expect(newState.playerInput).toBe('')
  })
})
