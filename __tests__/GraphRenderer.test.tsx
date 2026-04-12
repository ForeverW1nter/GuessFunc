import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { GraphRenderer } from '../src/features/game/components/GraphRenderer'
import { useGameStore } from '../src/store/useGameStore'

// Mock the internal hooks to avoid actual Desmos initialization which requires DOM and a heavy script
vi.mock('../src/features/game/hooks/useDesmosInit', () => ({
  useDesmosInit: () => true // Return isReady = true
}))

vi.mock('../src/features/game/hooks/useDesmosSync', () => ({
  useDesmosSync: () => {}
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'zh-CN' }
  }),
  initReactI18next: { type: '3rdParty', init: () => {} }
}))

describe('GraphRenderer', () => {
  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = ''
    vi.clearAllMocks()

    // Set a mock level so that the component has something to render
    useGameStore.setState({
      currentLevel: 'test-level',
      targetFunction: 'x^2',
      gameMode: 'story',
      domain: [-10, 10],
      isLevelCleared: false
    })
  })

  it('renders the container element', () => {
    const { container } = render(<GraphRenderer />)

    // The container should have the appropriate class names
    expect(container.firstChild).toHaveClass('absolute inset-0 w-full h-full touch-none bg-background');

    // Inside it, there should be the Desmos mount point
    const desmosContainer = container.querySelector('.absolute.inset-0')
    expect(desmosContainer).toBeInTheDocument()
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="absolute inset-0 w-full h-full touch-none bg-background"
      >
        <div
          class="absolute inset-0 w-full h-full"
        />
        <div
          class="absolute inset-0 flex items-center justify-center bg-background text-foreground z-50"
        >
          game.loadingEngine
        </div>
      </div>
    `)
  })
})
