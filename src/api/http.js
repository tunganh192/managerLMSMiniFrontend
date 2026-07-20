import axios from 'axios'
import i18n from '/@/i18n'

const http = axios.create({
    baseURL: import.meta.env.VITE_AXIOS_BASE_URL || '/api',
    timeout: 120000,
})

http.interceptors.request.use((config) => {
    config.headers['Accept-Language'] = i18n.locale
    return config
})

const readErrorPayload = async (error) => {
    const data = error.response && error.response.data
    if (!(data instanceof Blob)) return data

    try {
        return JSON.parse(await data.text())
    } catch {
        return null
    }
}

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const payload = await readErrorPayload(error)
        const status = error.response && error.response.status
        const fieldMessages = payload && payload.data && typeof payload.data === 'object' ? Object.values(payload.data) : []
        const message = [payload && payload.message, ...fieldMessages].filter(Boolean).join(' · ')
        const fallbackMessage = status
            ? status === 403
                ? i18n.t('api.forbidden')
                : i18n.t('api.failed', { status })
            : error.code === 'ECONNABORTED'
              ? i18n.t('api.timeout')
              : i18n.t('api.unreachable')
        return Promise.reject(new Error(message || fallbackMessage))
    }
)

export const compactParams = (params = {}) =>
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))

export const unwrap = (response) => response.data.data

export const errorMessage = (error) => (error instanceof Error ? error.message : i18n.t('api.unknown'))

export default http
