import { defineConfig } from 'vite'

export default defineConfig({
    oxc: {
        jsx: {
            importSource: 'veles',
        }
    },
    resolve: {
        alias: {
            'veles/jsx-dev-runtime': 'veles/jsx-runtime',
        }
    }
})