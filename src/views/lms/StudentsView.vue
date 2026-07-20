<template>
    <div class="lms-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">{{ $t('students.eyebrow') }}</span>
                <h2>{{ $t('students.title') }}</h2>
                <p>{{ $t('students.subtitle') }}</p>
            </div>
            <el-button type="primary" size="large" icon="el-icon-plus" @click="openCreate">{{ $t('students.add') }}</el-button>
        </section>
        <section class="content-card">
            <div class="search-panel">
                <div class="search-panel__fields">
                    <el-input
                        v-model="filters.keyword"
                        clearable
                        prefix-icon="el-icon-search"
                        :placeholder="$t('students.keyword')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('keyword', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input
                        v-model="filters.name"
                        clearable
                        :placeholder="$t('students.namePlaceholder')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('name', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input
                        v-model="filters.email"
                        clearable
                        placeholder="Email"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('email', $event)"
                        @keyup.enter.native="search"
                    />
                    <el-input
                        v-model="filters.phone"
                        clearable
                        :placeholder="$t('common.phone')"
                        @input="scheduleSearch"
                        @input.native="onTextFilterInput('phone', $event)"
                        @keyup.enter.native="search"
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
            <el-table v-loading="loading" :data="rows" class="clean-table" :empty-text="$t('students.empty')">
                <el-table-column :label="$t('students.column')" min-width="260"
                    ><template slot-scope="scope"
                        ><div class="entity-cell">
                            <el-avatar :size="44" :src="scope.row.avatarUrl || undefined">{{ initials(scope.row.name) }}</el-avatar>
                            <div>
                                <strong>{{ scope.row.name }}</strong
                                ><small>#HV{{ scope.row.id }}</small>
                            </div>
                        </div></template
                    ></el-table-column
                >
                <el-table-column prop="email" label="Email" min-width="240" />
                <el-table-column prop="phone" :label="$t('common.phone')" min-width="150"
                    ><template slot-scope="scope">{{ scope.row.phone || '—' }}</template></el-table-column
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
                <span>{{ $t('students.total', { count: total }) }}</span
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
        <el-dialog :visible.sync="dialog" :title="dialogTitle" width="min(680px, 94vw)" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" :disabled="isDetail" label-position="top" @submit.native.prevent>
                <div class="form-grid form-grid--two">
                    <el-form-item :label="$t('students.fullName')" prop="name"
                        ><el-input v-model="form.name" maxlength="150" :placeholder="$t('students.fullNamePlaceholder')"
                    /></el-form-item>
                    <el-form-item label="Email" prop="email"
                        ><el-input v-model="form.email" maxlength="150" placeholder="an@example.com"
                    /></el-form-item>
                    <el-form-item :label="$t('common.phone')" prop="phone"
                        ><el-input v-model="form.phone" maxlength="20" :placeholder="$t('students.phonePlaceholder')"
                    /></el-form-item>
                    <el-form-item v-if="form.id" :label="$t('students.currentAvatar')"
                        ><div v-if="currentAvatar" class="current-media">
                            <el-image :src="currentAvatar" fit="cover" :preview-src-list="[currentAvatar]" /><span>{{
                                $t('students.usingAvatar')
                            }}</span>
                        </div>
                        <span v-else class="muted-text">{{ $t('students.noAvatar') }}</span></el-form-item
                    >
                </div>
                <el-form-item v-if="!isDetail" :label="$t('students.uploadAvatar')" prop="avatarFiles"
                    ><FilePicker
                        v-model="form.avatarFiles"
                        :label="$t('students.chooseAvatar')"
                        :hint="$t('students.avatarHint')"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        :max-size-mb="10"
                        @input="validateField('avatarFiles')"
                /></el-form-item>
            </el-form>
            <span slot="footer">
                <el-button v-if="isDetail" type="primary" @click="dialog = false">{{ $t('common.close') }}</el-button>
                <template v-else>
                    <el-button @click="dialog = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="primary" :loading="saving" @click="submit">{{
                        form.id ? $t('common.saveChanges') : $t('students.add')
                    }}</el-button>
                </template>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui'
import { downloadBlob } from '/@/api/fileDownload'
import { errorMessage } from '/@/api/http'
import { deleteStudent, exportStudents, getStudent, getStudents, saveStudent } from '/@/api/studentApi'
import FilePicker from '/@/components/FilePicker.vue'

export default {
    name: 'StudentsView',
    components: { FilePicker },
    data() {
        return {
            loading: false,
            saving: false,
            exporting: false,
            dialog: false,
            mode: 'create',
            filters: { keyword: '', name: '', email: '', phone: '' },
            appliedFilters: {},
            searchTimer: null,
            page: 1,
            size: 10,
            total: 0,
            rows: [],
            currentAvatar: '',
            form: { id: null, name: '', email: '', phone: '', avatarFiles: [] },
            rules: {
                name: [
                    { required: true, whitespace: true, message: this.$t('validation.studentNameRequired'), trigger: ['blur', 'change'] },
                    { max: 150, message: this.$t('validation.studentNameMax'), trigger: ['blur', 'change'] },
                ],
                email: [
                    { required: true, whitespace: true, message: this.$t('validation.emailRequired'), trigger: ['blur', 'change'] },
                    { type: 'email', message: this.$t('validation.emailInvalid'), trigger: ['blur', 'change'] },
                    { max: 150, message: this.$t('validation.emailMax'), trigger: ['blur', 'change'] },
                ],
                phone: [{ pattern: /^$|^[0-9+ .-]{8,20}$/, message: this.$t('validation.phoneInvalid'), trigger: ['blur', 'change'] }],
                avatarFiles: [
                    {
                        validator: (_rule, value, callback) => {
                            if (!this.form.id && (!value || !value.length)) callback(new Error(this.$t('validation.avatarRequired')))
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
            if (this.isDetail) return this.$t('students.detailTitle')
            return this.mode === 'edit' ? this.$t('students.editTitle') : this.$t('students.add')
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
                const result = await getStudents(this.appliedFilters, this.page - 1, this.size)
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
            this.appliedFilters = Object.fromEntries(Object.entries(this.filters).map(([key, value]) => [key, value.trim()]))
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
            this.filters = { keyword: '', name: '', email: '', phone: '' }
            this.search()
        },
        onSizeChange(value) {
            this.size = value
            this.page = 1
            this.load()
        },
        resetForm() {
            this.form = { id: null, name: '', email: '', phone: '', avatarFiles: [] }
            this.currentAvatar = ''
            if (this.$refs.formRef) this.$refs.formRef.clearValidate()
        },
        openCreate() {
            this.resetForm()
            this.mode = 'create'
            this.dialog = true
        },
        async openRecord(id, mode) {
            try {
                const student = await getStudent(id)
                this.form = { id: student.id, name: student.name, email: student.email, phone: student.phone || '', avatarFiles: [] }
                this.currentAvatar = student.avatarUrl || ''
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
        async submit() {
            if (this.isDetail) return
            if (!(await this.validateForm())) return
            this.saving = true
            try {
                const payload = new FormData()
                payload.append('name', this.form.name.trim())
                payload.append('email', this.form.email.trim())
                payload.append('phone', this.form.phone.trim())
                if (this.form.avatarFiles[0]) payload.append('avatar', this.form.avatarFiles[0])
                await saveStudent(this.form.id, payload)
                Message.success(this.form.id ? this.$t('students.updated') : this.$t('students.created'))
                this.dialog = false
                await this.load()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.saving = false
            }
        },
        async remove(student) {
            try {
                await MessageBox.confirm(this.$t('students.deleteConfirm', { name: student.name }), this.$t('students.deleteTitle'), {
                    type: 'warning',
                    confirmButtonText: this.$t('students.deleteButton'),
                    cancelButtonText: this.$t('common.cancel'),
                })
                await deleteStudent(student.id)
                Message.success(this.$t('students.deleted'))
                if (this.rows.length === 1 && this.page > 1) this.page--
                await this.load()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') Message.error(errorMessage(error))
            }
        },
        async exportExcel() {
            this.exporting = true
            try {
                downloadBlob(await exportStudents(this.appliedFilters), 'students.xlsx')
                Message.success(this.$t('students.exported'))
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.exporting = false
            }
        },
        initials(name) {
            return name
                .split(/\s+/)
                .slice(-2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
        },
    },
}
</script>
