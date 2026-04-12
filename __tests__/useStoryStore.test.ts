import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStoryStore } from '../src/store/useStoryStore'

vi.mock('../src/utils/debug/logger', () => ({
  logger: {
    error: vi.fn(),
    log: vi.fn()
  },
  DEBUG_MODULES: {
    SYSTEM: 'SYSTEM'
  }
}))

describe('useStoryStore', () => {
  beforeEach(() => {
    useStoryStore.setState({
      storyJSON: { routes: [] },
      currentRouteId: null
    })
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const state = useStoryStore.getState()
    expect(state.storyJSON).toEqual({ routes: [] })
    expect(state.currentRouteId).toBe(null)
  })

  it('should set current route', () => {
    useStoryStore.getState().setRoute('route-1')
    expect(useStoryStore.getState().currentRouteId).toBe('route-1')
  })

  it('should retrieve correct route, chapter and level data', () => {
    const mockData = {
      routes: [
        {
          id: 'route-1',
          title: 'Route 1',
          description: 'A test route',
          showToBeContinued: false,
          chapters: [
            {
              id: 'chapter-1',
              title: 'Chapter 1',
              levels: [
                {
                  id: 'level-1',
                  title: 'Level 1',
                  targetFunction: 'x',
                  params: {},
                  domain: '[-10,10]'
                }
              ]
            }
          ]
        }
      ]
    }

    useStoryStore.setState({
      storyJSON: mockData
    })

    const route = useStoryStore.getState().getRoute('route-1')
    expect(route?.id).toBe('route-1')

    const chapter = useStoryStore.getState().getChapter('route-1', 'chapter-1')
    expect(chapter?.id).toBe('chapter-1')

    const level = useStoryStore.getState().getLevel('route-1', 'chapter-1', 'level-1')
    expect(level?.id).toBe('level-1')
    expect(level?.targetFunction).toBe('x')
  })
})
