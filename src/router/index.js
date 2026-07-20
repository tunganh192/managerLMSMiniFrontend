import Vue from 'vue'
import VueRouter from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import i18n from '/@/i18n'

Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'hash',
    routes: [
        {
            path: '/',
            component: () => import('/@/layouts/LmsLayout.vue'),
            redirect: '/students',
            children: [
                { path: 'students', name: 'students', component: () => import('/@/views/lms/StudentsView.vue'), meta: { titleKey: 'nav.students' } },
                { path: 'courses', name: 'courses', component: () => import('/@/views/lms/CoursesView.vue'), meta: { titleKey: 'nav.courses' } },
                { path: 'lessons', name: 'lessons', component: () => import('/@/views/lms/LessonsView.vue'), meta: { titleKey: 'nav.lessons' } },
                {
                    path: 'enrollments',
                    name: 'enrollments',
                    component: () => import('/@/views/lms/EnrollmentsView.vue'),
                    meta: { titleKey: 'nav.enrollments' },
                },
            ],
        },
        { path: '*', redirect: '/students' },
    ],
})

NProgress.configure({ showSpinner: false })
router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
})
router.afterEach((to) => {
    document.title = `${String(to.meta.titleKey ? i18n.t(to.meta.titleKey) : 'LMS Mini')} · LMS Mini`
    NProgress.done()
})

export default router
