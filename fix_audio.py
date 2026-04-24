with open('src/foundation/ui/SettingsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '"w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full transition-all duration-300 shrink-0",',
    '"w-16 h-16 md:w-20 md:h-20 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",'
)

with open('src/foundation/ui/SettingsPage.tsx', 'w') as f:
    f.write(content)
