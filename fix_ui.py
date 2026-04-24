import re

with open('src/foundation/ui/SettingsPage.tsx', 'r') as f:
    content = f.read()

# 1. Logical Properties
content = content.replace('md:pr-6', 'md:pe-6')
content = content.replace('md:border-r', 'md:border-e')
content = content.replace('md:pl-6', 'md:ps-6 pb-[env(safe-area-inset-bottom)]')
content = content.replace('right-5', 'end-5')
content = content.replace('right-4', 'end-4')
content = content.replace('pr-8', 'pe-8')

# 2. Touch Manipulation and Focus Visible for buttons
# Find all className={cn( or className="... for buttons and add the a11y classes
button_class_regex = r'(<button[^>]*className=(?:\{cn\(|")([^"]*)")'
# Wait, this is getting tricky with regex. Let's just do targeted string replacements.

content = content.replace(
    '"relative flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-mono tracking-widest uppercase transition-all duration-300 text-left whitespace-nowrap"',
    '"relative flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-mono tracking-widest uppercase transition-all duration-300 text-left whitespace-nowrap touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)]"'
)

content = content.replace(
    '"relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 min-w-0"',
    '"relative flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 min-w-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"'
)

content = content.replace(
    '"relative flex flex-row items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left min-w-0 group"',
    '"relative flex flex-row items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left min-w-0 group touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"'
)

content = content.replace(
    'className="relative h-2 bg-[var(--color-border)] rounded-full flex-1 flex items-center"',
    'className="relative h-2 bg-[var(--color-border)] rounded-full flex-1 flex items-center focus-within:ring-2 focus-within:ring-[var(--color-foreground)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-background)]"'
)

content = content.replace(
    'className="relative h-3 bg-[var(--color-border)] rounded-full overflow-hidden flex items-center group/slider"',
    'className="relative h-3 bg-[var(--color-border)] rounded-full overflow-hidden flex items-center group/slider focus-within:ring-2 focus-within:ring-[var(--color-foreground)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--color-background)]"'
)

content = content.replace(
    'className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-lg text-xs font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all"',
    'className="px-4 py-2 bg-[var(--color-foreground)] text-[var(--color-background)] rounded-lg text-xs font-mono uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-muted-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"'
)

# Text Wrap Balance for headings
content = content.replace('text-lg font-display uppercase tracking-tight mb-1', 'text-lg font-display uppercase tracking-tight mb-1 text-balance')
content = content.replace('text-xl font-bold tracking-tighter uppercase font-display', 'text-xl font-bold tracking-tighter uppercase font-display text-balance')

with open('src/foundation/ui/SettingsPage.tsx', 'w') as f:
    f.write(content)
