import vue from '@vitejs/plugin-vue2'
import { resolve } from 'path'
import { loadEnv } from 'vite'

const pathResolve = (dir) => resolve(process.cwd(), dir)

export default ({ mode }) => {
    const { VITE_PORT, VITE_OPEN, VITE_BASE_PATH, VITE_OUT_DIR } = loadEnv(mode, process.cwd())

    return {
        plugins: [vue()],
        resolve: {
            alias: {
                '/@': pathResolve('./src'),
            },
        },
        base: VITE_BASE_PATH,
        server: {
            port: Number(VITE_PORT || 1818),
            open: VITE_OPEN !== 'false',
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                },
            },
        },
        build: {
            cssCodeSplit: false,
            sourcemap: false,
            outDir: VITE_OUT_DIR || 'dist',
            emptyOutDir: true,
            chunkSizeWarningLimit: 1200,
        },
    }
}
