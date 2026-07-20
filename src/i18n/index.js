import Vue from 'vue'
import VueI18n from 'vue-i18n'
import elementEn from 'element-ui/lib/locale/lang/en'
import elementVi from 'element-ui/lib/locale/lang/vi'
import en from './messages/en'
import vi from './messages/vi'

Vue.use(VueI18n)

export const supportedLocales = ['vi', 'en']
const localeStorageKey = 'lms-locale'
const savedLocale = localStorage.getItem(localeStorageKey)
const initialLocale = supportedLocales.includes(savedLocale) ? savedLocale : 'vi'

const i18n = new VueI18n({
    locale: initialLocale,
    fallbackLocale: 'vi',
    messages: {
        vi: { ...vi, el: elementVi.el },
        en: { ...en, el: elementEn.el },
    },
})

export const setLocale = (locale) => {
    const nextLocale = supportedLocales.includes(locale) ? locale : 'vi'
    i18n.locale = nextLocale
    localStorage.setItem(localeStorageKey, nextLocale)
    document.documentElement.lang = nextLocale
    return nextLocale
}

setLocale(initialLocale)

export default i18n
