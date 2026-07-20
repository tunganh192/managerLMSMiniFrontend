import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import '/@/styles/lms.scss'

Vue.config.productionTip = false
Vue.use(ElementUI, { i18n: (key, value) => i18n.t(key, value) })

new Vue({
    i18n,
    router,
    render: (h) => h(App),
}).$mount('#app')
