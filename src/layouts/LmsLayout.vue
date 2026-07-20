<template>
    <el-container class="lms-shell">
        <el-aside class="lms-aside" width="254px">
            <div class="lms-brand">
                <span class="lms-brand__mark"><i class="el-icon-school"></i></span>
                <div>
                    <strong>LMS Mini</strong><small>{{ $t('app.brandSubtitle') }}</small>
                </div>
            </div>
            <nav class="lms-nav">
                <router-link v-for="item in menuItems" :key="item.path" :to="item.path" class="lms-nav__item">
                    <span class="lms-nav__icon"><i :class="item.icon"></i></span><span>{{ $t(item.labelKey) }}</span>
                </router-link>
            </nav>
        </el-aside>

        <el-container class="lms-content">
            <el-header class="lms-header">
                <div class="lms-header__left">
                    <div>
                        <small>{{ $t('app.trainingManagement') }}</small>
                        <h1>{{ $t($route.meta.titleKey) }}</h1>
                    </div>
                </div>
                <el-select v-model="currentLocale" class="locale-switcher" size="small" :aria-label="$t('app.language')" @change="changeLocale">
                    <el-option :label="$t('app.vietnamese')" value="vi" />
                    <el-option :label="$t('app.english')" value="en" />
                </el-select>
            </el-header>
            <el-main class="lms-main"
                ><transition name="page-fade" mode="out-in"><router-view :key="`${$route.path}-${$i18n.locale}`" /></transition
            ></el-main>
        </el-container>
    </el-container>
</template>

<script>
import { setLocale } from '/@/i18n'

export default {
    name: 'LmsLayout',
    data() {
        return {
            menuItems: [
                { path: '/students', labelKey: 'nav.students', icon: 'el-icon-user' },
                { path: '/courses', labelKey: 'nav.courses', icon: 'el-icon-collection' },
                { path: '/lessons', labelKey: 'nav.lessons', icon: 'el-icon-reading' },
                { path: '/enrollments', labelKey: 'nav.enrollments', icon: 'el-icon-tickets' },
            ],
            currentLocale: this.$i18n.locale,
        }
    },
    methods: {
        changeLocale(locale) {
            this.currentLocale = setLocale(locale)
            const titleKey = this.$route.meta.titleKey
            document.title = `${String(titleKey ? this.$t(titleKey) : 'LMS Mini')} · LMS Mini`
        },
    },
}
</script>
