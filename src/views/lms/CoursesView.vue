<template>
    <div class="lms-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">{{ $t('courses.eyebrow') }}</span>
                <h2>{{ $t('courses.title') }}</h2>
                <p>{{ $t('courses.subtitle') }}</p>
            </div>
            <el-button type="primary" size="large" icon="el-icon-plus" @click="openCreate">{{ $t('courses.add') }}</el-button>
        </section>
        <section class="content-card">
            <div class="search-panel">
                <div class="search-panel__fields search-panel__fields--course">
                    <el-input
                        v-model="filters.keyword"
                        clearable
                        prefix-icon="el-icon-search"
                        :placeholder="$t('courses.keyword')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('keyword', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input
                        v-model="filters.name"
                        clearable
                        :placeholder="$t('courses.namePlaceholder')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('name', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input
                        v-model="filters.code"
                        clearable
                        :placeholder="$t('courses.codePlaceholder')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('code', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input-number
                        v-model="filters.minDuration"
                        :min="1"
                        :controls="false"
                        :placeholder="$t('courses.minDuration')"
                        @input="scheduleSearch"
                    />
                    <el-input-number
                        v-model="filters.maxDuration"
                        :min="1"
                        :controls="false"
                        :placeholder="$t('courses.maxDuration')"
                        @input="scheduleSearch"
                    />
                </div>
                <div class="search-panel__actions">
                    <el-button type="primary" icon="el-icon-search" @click="search">{{ $t('common.search') }}</el-button>
                    <el-button icon="el-icon-refresh" @click="resetSearch">{{ $t('common.reset') }}</el-button>
                    <span class="toolbar__spacer"></span>
                    <el-button :loading="exporting" :disabled="!total" icon="el-icon-download" @click="exportExcel">{{
                        $t('common.exportExcel')
                    }}</el-button>
                </div>
            </div>
            <el-table v-loading="loading" :data="rows" class="clean-table" :empty-text="$t('courses.empty')">
                <el-table-column :label="$t('courses.column')" min-width="300"
                    ><template slot-scope="scope"
                        ><div class="entity-cell entity-cell--media">
                            <el-image
                                :src="scope.row.thumbnailUrl || fallback"
                                fit="cover"
                                :preview-src-list="scope.row.thumbnailUrl ? [scope.row.thumbnailUrl] : []"
                            />
                            <div>
                                <strong>{{ scope.row.name }}</strong
                                ><small>{{ scope.row.code }}</small>
                            </div>
                        </div></template
                    ></el-table-column
                >
                <el-table-column prop="description" :label="$t('common.description')" min-width="260" show-overflow-tooltip />
                <el-table-column :label="$t('courses.duration')" width="170"
                    ><template slot-scope="scope">{{ $t('courses.hours', { count: scope.row.duration }) }}</template></el-table-column
                >
                <el-table-column :label="$t('courses.gallery')" width="110"
                    ><template slot-scope="scope"
                        ><el-tag>{{ $t('common.images', { count: galleryCount(scope.row) }) }}</el-tag></template
                    ></el-table-column
                >
                <el-table-column :label="$t('common.actions')" width="225" fixed="right"
                    ><template slot-scope="scope"
                        ><el-button type="text" icon="el-icon-view" @click="openDetail(scope.row.id)">{{ $t('common.view') }}</el-button
                        ><el-button type="text" icon="el-icon-edit" @click="openEdit(scope.row.id)">{{ $t('common.edit') }}</el-button
                        ><el-button type="text" class="danger-text" icon="el-icon-delete" @click="remove(scope.row)">{{
                            $t('common.delete')
                        }}</el-button></template
                    ></el-table-column
                >
            </el-table>
            <div class="pagination-bar">
                <span>{{ $t('courses.total', { count: total }) }}</span
                ><el-pagination
                    :current-page.sync="page"
                    :page-size="size"
                    background
                    layout="sizes, prev, pager, next"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="total"
                    @current-change="load"
                    @size-change="onSizeChange"
                />
            </div>
        </section>
        <el-dialog :visible.sync="dialog" :title="dialogTitle" width="min(820px, 96vw)" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" :disabled="isDetail" label-position="top" @submit.native.prevent>
                <div class="form-grid form-grid--two">
                    <el-form-item :label="$t('courses.name')" prop="name"><el-input v-model="form.name" maxlength="200" /></el-form-item>
                    <el-form-item :label="$t('courses.code')" prop="code"
                        ><el-input
                            v-model="form.code"
                            maxlength="50"
                            :placeholder="$t('courses.codeExample')"
                            @input="form.code = form.code.toUpperCase()"
                    /></el-form-item>
                    <el-form-item :label="$t('courses.durationHours')" prop="duration"
                        ><el-input-number v-model="form.duration" :min="1" :max="10000" controls-position="right" class="w100"
                    /></el-form-item>
                    <el-form-item :label="$t('courses.currentThumbnail')"
                        ><div v-if="currentThumbnail" class="current-media current-media--wide">
                            <el-image :src="currentThumbnail" fit="cover" :preview-src-list="[currentThumbnail]" /><span>{{
                                $t('courses.usingThumbnail')
                            }}</span>
                        </div>
                        <span v-else class="muted-text">{{ $t('courses.noThumbnail') }}</span></el-form-item
                    >
                </div>
                <el-form-item :label="$t('common.description')" prop="description"
                    ><el-input v-model="form.description" type="textarea" :rows="3" maxlength="2000" show-word-limit
                /></el-form-item>
                <el-form-item v-if="!isDetail" :label="$t('courses.uploadThumbnail')" prop="thumbnailFiles"
                    ><FilePicker
                        v-model="form.thumbnailFiles"
                        :label="$t('courses.chooseThumbnail')"
                        :hint="$t('courses.thumbnailHint')"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        :max-size-mb="10"
                        @input="validateField('thumbnailFiles')"
                /></el-form-item>
                <el-form-item v-if="currentGallery.length" :label="$t('courses.currentGallery')"
                    ><div class="existing-gallery">
                        <article v-for="image in currentGallery" :key="image.id">
                            <el-image :src="image.url" fit="cover" :preview-src-list="currentGallery.map((item) => item.url)" /><el-button
                                v-if="!isDetail"
                                circle
                                type="danger"
                                size="mini"
                                icon="el-icon-close"
                                @click="markImageRemoved(image.id)"
                            />
                        </article></div
                ></el-form-item>
                <el-form-item v-if="!isDetail" :label="$t('courses.addGallery')" prop="galleryFiles"
                    ><FilePicker
                        v-model="form.galleryFiles"
                        :label="$t('courses.chooseContentImages')"
                        :hint="$t('courses.remainingImages', { count: remainingGallerySlots })"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        :max="remainingGallerySlots"
                        :max-size-mb="10"
                        @input="validateField('galleryFiles')"
                        :disabled="remainingGallerySlots === 0"
                /></el-form-item>
            </el-form>
            <span slot="footer">
                <el-button v-if="isDetail" type="primary" @click="dialog = false">{{ $t('common.close') }}</el-button>
                <template v-else>
                    <el-button @click="dialog = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="primary" :loading="saving" @click="submit">{{
                        form.id ? $t('common.saveChanges') : $t('courses.add')
                    }}</el-button>
                </template>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui'
import { deleteCourse, exportCourses, getCourse, getCourses, saveCourse } from '/@/api/courseApi'
import { downloadBlob } from '/@/api/fileDownload'
import { errorMessage } from '/@/api/http'
import FilePicker from '/@/components/FilePicker.vue'

export default {
    name: 'CoursesView',
    components: { FilePicker },
    data() {
        return {
            fallback:
                'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="72"%3E%3Crect width="100%25" height="100%25" fill="%23eef2ff"/%3E%3Ctext x="50%25" y="54%25" text-anchor="middle" font-size="12" fill="%236366f1"%3ELMS%3C/text%3E%3C/svg%3E',
            loading: false,
            saving: false,
            exporting: false,
            dialog: false,
            mode: 'create',
            filters: { keyword: '', name: '', code: '', minDuration: undefined, maxDuration: undefined },
            appliedFilters: {},
            searchTimer: null,
            page: 1,
            size: 10,
            total: 0,
            rows: [],
            currentThumbnail: '',
            currentGallery: [],
            removedImageIds: [],
            form: { id: null, name: '', code: '', description: '', duration: 1, thumbnailFiles: [], galleryFiles: [] },
            rules: {
                name: [
                    { required: true, whitespace: true, message: this.$t('validation.courseNameRequired'), trigger: ['blur', 'change'] },
                    { max: 200, message: this.$t('validation.courseNameMax'), trigger: ['blur', 'change'] },
                ],
                code: [
                    { required: true, whitespace: true, message: this.$t('validation.courseCodeRequired'), trigger: ['blur', 'change'] },
                    { max: 50, message: this.$t('validation.courseCodeMax'), trigger: ['blur', 'change'] },
                ],
                description: [{ max: 2000, message: this.$t('validation.descriptionMax'), trigger: ['blur', 'change'] }],
                duration: [
                    { required: true, type: 'number', message: this.$t('validation.durationRequired'), trigger: 'change' },
                    { type: 'number', min: 1, message: this.$t('validation.durationMin'), trigger: 'change' },
                ],
                thumbnailFiles: [
                    {
                        validator: (_rule, value, callback) => {
                            if (!this.form.id && (!value || !value.length)) callback(new Error(this.$t('validation.thumbnailRequired')))
                            else callback()
                        },
                        trigger: 'change',
                    },
                ],
                galleryFiles: [
                    {
                        validator: (_rule, value, callback) => {
                            if (this.currentGallery.length + (value || []).length > 10) callback(new Error(this.$t('validation.galleryMax')))
                            else callback()
                        },
                        trigger: 'change',
                    },
                ],
            },
        }
    },
    computed: {
        isDetail() {
            return this.mode === 'detail'
        },
        dialogTitle() {
            if (this.isDetail) return this.$t('courses.detailTitle')
            return this.mode === 'edit' ? this.$t('courses.editTitle') : this.$t('courses.add')
        },
        remainingGallerySlots() {
            return Math.max(0, 10 - this.currentGallery.length)
        },
    },
    mounted() {
        this.load()
    },
    beforeDestroy() {
        clearTimeout(this.searchTimer)
    },
    methods: {
        validateForm() {
            return new Promise((resolve) => this.$refs.formRef.validate((valid) => resolve(valid)))
        },
        validateField(field) {
            this.$nextTick(() => {
                if (this.$refs.formRef) this.$refs.formRef.validateField(field)
            })
        },
        async load() {
            this.loading = true
            try {
                const result = await getCourses(this.appliedFilters, this.page - 1, this.size)
                this.rows = result.data
                this.total = result.totalElements
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.loading = false
            }
        },
        search() {
            clearTimeout(this.searchTimer)
            this.searchTimer = null
            if (this.filters.minDuration && this.filters.maxDuration && this.filters.minDuration > this.filters.maxDuration) {
                Message.warning(this.$t('courses.invalidDurationRange'))
                return
            }
            this.appliedFilters = {
                keyword: this.filters.keyword.trim(),
                name: this.filters.name.trim(),
                code: this.filters.code.trim(),
                minDuration: this.filters.minDuration,
                maxDuration: this.filters.maxDuration,
            }
            this.page = 1
            this.load()
        },
        scheduleSearch() {
            clearTimeout(this.searchTimer)
            this.searchTimer = setTimeout(() => this.search(), 300)
        },
        onTextFilterInput(field, event) {
            const value = event.target.value
            if (this.filters[field] !== value) this.filters[field] = value
            this.scheduleSearch()
        },
        resetSearch() {
            this.filters = { keyword: '', name: '', code: '', minDuration: undefined, maxDuration: undefined }
            this.search()
        },
        onSizeChange(value) {
            this.size = value
            this.page = 1
            this.load()
        },
        galleryCount(course) {
            return (course.images || []).filter((image) => image.mediaRole === 'GALLERY').length
        },
        resetForm() {
            this.form = { id: null, name: '', code: '', description: '', duration: 1, thumbnailFiles: [], galleryFiles: [] }
            this.currentThumbnail = ''
            this.currentGallery = []
            this.removedImageIds = []
            if (this.$refs.formRef) this.$refs.formRef.clearValidate()
        },
        openCreate() {
            this.resetForm()
            this.mode = 'create'
            this.dialog = true
        },
        async openRecord(id, mode) {
            try {
                const course = await getCourse(id)
                this.form = {
                    id: course.id,
                    name: course.name,
                    code: course.code,
                    description: course.description || '',
                    duration: course.duration,
                    thumbnailFiles: [],
                    galleryFiles: [],
                }
                this.removedImageIds = []
                this.currentThumbnail = course.thumbnailUrl || ''
                this.currentGallery = (course.images || []).filter((image) => image.mediaRole === 'GALLERY')
                this.mode = mode
                this.dialog = true
            } catch (error) {
                Message.error(errorMessage(error))
            }
        },
        openEdit(id) {
            return this.openRecord(id, 'edit')
        },
        openDetail(id) {
            return this.openRecord(id, 'detail')
        },
        markImageRemoved(id) {
            this.removedImageIds.push(id)
            this.currentGallery = this.currentGallery.filter((image) => image.id !== id)
            this.validateField('galleryFiles')
        },
        async submit() {
            if (this.isDetail) return
            if (!(await this.validateForm())) return
            this.saving = true
            try {
                const payload = new FormData()
                payload.append('name', this.form.name.trim())
                payload.append('code', this.form.code.trim())
                payload.append('description', this.form.description.trim())
                payload.append('duration', String(this.form.duration))
                if (this.form.thumbnailFiles[0]) payload.append('thumbnail', this.form.thumbnailFiles[0])
                this.form.galleryFiles.forEach((file) => payload.append('images', file))
                this.removedImageIds.forEach((id) => payload.append('deletedImageIds', String(id)))
                await saveCourse(this.form.id, payload)
                Message.success(this.form.id ? this.$t('courses.updated') : this.$t('courses.created'))
                this.dialog = false
                await this.load()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.saving = false
            }
        },
        async remove(course) {
            try {
                await MessageBox.confirm(this.$t('courses.deleteConfirm', { name: course.name }), this.$t('courses.deleteTitle'), {
                    type: 'warning',
                    confirmButtonText: this.$t('courses.deleteButton'),
                    cancelButtonText: this.$t('common.cancel'),
                })
                await deleteCourse(course.id)
                Message.success(this.$t('courses.deleted'))
                if (this.rows.length === 1 && this.page > 1) this.page--
                await this.load()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') Message.error(errorMessage(error))
            }
        },
        async exportExcel() {
            this.exporting = true
            try {
                downloadBlob(await exportCourses(this.appliedFilters), 'courses.xlsx')
                Message.success(this.$t('courses.exported'))
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.exporting = false
            }
        },
    },
}
</script>
