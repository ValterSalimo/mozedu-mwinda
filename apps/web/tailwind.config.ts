import type { Config } from 'tailwindcss'
import uiConfig from '../../packages/ui/tailwind.config'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [uiConfig],
}

export default config
