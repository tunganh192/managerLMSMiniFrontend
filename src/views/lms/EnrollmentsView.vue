<template>
    <div class="lms-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">{{ $t('enrollments.eyebrow') }}</span>
                <h2>{{ $t('enrollments.title') }}</h2>
                <p>{{ $t('enrollments.subtitle') }}</p>
            </div>
            <el-button type="primary" size="large" icon="el-icon-plus" :disabled="!students.length || !courses.length" @click="openCreate">{{
                $t('enrollments.add')
            }}</el-button>
        </section>
        <section class="content-card">
            <div class="toolbar toolbar--lesson">
                <label>{{ $t('enrollments.studentsOfCourse') }}</label
                ><el-select v-model="selectedCourseId" filterable :placeholder="$t('enrollments.selectCourse')" @change="onCourseChange"
                    ><el-option v-for="course in courses" :key="course.id" :label="`${course.code} · ${course.name}`" :value="course.id" /></el-select
                ><el-button icon="el-icon-refresh" @click="loadOptions">{{ $t('common.refresh') }}</el-button
                ><span class="toolbar__spacer"></span
                ><el-tag v-if="selectedCourseId" type="success" size="medium">{{ $t('enrollments.studentCount', { count: total }) }}</el-tag>
            </div>
            <el-empty v-if="(!students.length || !courses.length) && !loading" :description="$t('enrollments.prerequisites')" />
            <el-table v-else v-loading="loading" :data="enrollments" class="clean-table" :empty-text="$t('enrollments.empty')">
                <el-table-column :label="$t('common.student')" min-width="280"
                    ><template slot-scope="scope"
                        ><div class="entity-cell">
                            <el-avatar :size="44" :src="scope.row.avatarUrl || undefined">{{ initials(scope.row.studentName) }}</el-avatar>
                            <div>
                                <strong>{{ scope.row.studentName }}</strong
                                ><small>#HV{{ scope.row.studentId }}</small>
                            </div>
                        </div></template
                    ></el-table-column
                >
                <el-table-column prop="phone" :label="$t('common.phone')" min-width="180"
                    ><template slot-scope="scope">{{ scope.row.phone || '—' }}</template></el-table-column
                >
                <el-table-column prop="courseName" :label="$t('common.course')" min-width="250" />
                <el-table-column :label="$t('enrollments.enrolledDate')" width="160"
                    ><template slot-scope="scope"
                        ><el-tag effect="plain"><i class="el-icon-date"></i>&nbsp;{{ formatDate(scope.row.enrolledDate) }}</el-tag></template
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
            <div v-if="total" class="pagination-bar">
                <span>{{ $t('enrollments.total', { count: total }) }}</span
                ><el-pagination
                    :current-page.sync="page"
                    :page-size="size"
                    background
                    layout="sizes, prev, pager, next"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="total"
                    @current-change="loadEnrollments"
                    @size-change="onSizeChange"
                />
            </div>
        </section>
        <el-dialog :visible.sync="dialog" :title="dialogTitle" width="min(760px, 94vw)" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" :disabled="isDetail" label-position="top" @submit.native.prevent>
                <el-alert v-if="mode === 'create'" :title="$t('enrollments.createHint')" type="info" :closable="false" show-icon />
                <el-form-item v-if="mode === 'create'" :label="$t('common.student')" prop="studentIds">
                    <div class="selection-actions">
                        <span>{{ $t('enrollments.selectedStudents', { selected: form.studentIds.length, total: students.length }) }}</span>
                        <el-button type="text" @click="selectAllStudents">{{ $t('common.selectAll') }}</el-button>
                        <el-button type="text" @click="form.studentIds = []">{{ $t('common.clearSelection') }}</el-button>
                    </div>
                    <el-select
                        v-model="form.studentIds"
                        multiple
                        filterable
                        collapse-tags
                        class="w100"
                        :placeholder="$t('enrollments.selectStudents')"
                        ><el-option
                            v-for="student in students"
                            :key="student.id"
                            :label="`${student.name} · ${student.phone || $t('enrollments.noPhone')}`"
                            :value="student.id" /></el-select
                ></el-form-item>
                <el-form-item v-else :label="$t('common.student')" prop="studentId"
                    ><el-select v-model="form.studentId" filterable class="w100" :placeholder="$t('enrollments.selectStudent')"
                        ><el-option
                            v-for="student in students"
                            :key="student.id"
                            :label="`${student.name} · ${student.phone || $t('enrollments.noPhone')}`"
                            :value="student.id" /></el-select
                ></el-form-item>
                <el-form-item v-if="mode === 'create'" :label="$t('enrollments.coursesLabel')" prop="courseIds">
                    <div class="selection-actions">
                        <span>{{ $t('enrollments.selectedCourses', { selected: form.courseIds.length, total: courses.length }) }}</span>
                        <el-button type="text" @click="selectAllCourses">{{ $t('common.selectAll') }}</el-button>
                        <el-button type="text" @click="form.courseIds = []">{{ $t('common.clearSelection') }}</el-button>
                    </div>
                    <el-select v-model="form.courseIds" multiple filterable collapse-tags class="w100" :placeholder="$t('enrollments.selectCourses')"
                        ><el-option
                            v-for="course in courses"
                            :key="course.id"
                            :label="`${course.code} · ${course.name}`"
                            :value="course.id" /></el-select
                ></el-form-item>
                <el-form-item v-else :label="$t('common.course')" prop="courseId"
                    ><el-select v-model="form.courseId" filterable class="w100"
                        ><el-option
                            v-for="course in courses"
                            :key="course.id"
                            :label="`${course.code} · ${course.name}`"
                            :value="course.id" /></el-select
                ></el-form-item>
                <el-form-item v-if="isDetail" :label="$t('enrollments.enrolledDate')"
                    ><el-input :value="formatDate(form.enrolledDate)"
                /></el-form-item>
            </el-form>
            <span slot="footer">
                <el-button v-if="isDetail" type="primary" @click="dialog = false">{{ $t('common.close') }}</el-button>
                <template v-else>
                    <el-button @click="dialog = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="primary" :loading="saving" @click="submit">{{
                        mode === 'create' ? $t('enrollments.complete') : $t('common.saveChanges')
                    }}</el-button>
                </template>
            </span>
        </el-dialog>
    </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui'
import { getCourseOptions } from '/@/api/courseApi'
import { createEnrollments, deleteEnrollment, getEnrollment, getEnrollmentsByCourse, updateEnrollment } from '/@/api/enrollmentApi'
import { errorMessage } from '/@/api/http'
import { getStudentOptions } from '/@/api/studentApi'

export default {
    name: 'EnrollmentsView',
    data() {
        return {
            loading: false,
            saving: false,
            dialog: false,
            mode: 'create',
            courses: [],
            students: [],
            enrollments: [],
            selectedCourseId: null,
            page: 1,
            size: 10,
            total: 0,
            form: { id: null, studentId: null, studentIds: [], courseIds: [], courseId: null, enrolledDate: null },
            rules: {
                studentId: [{ required: true, type: 'number', message: this.$t('validation.studentRequired'), trigger: 'change' }],
                studentIds: [{ required: true, type: 'array', min: 1, message: this.$t('validation.studentsRequired'), trigger: 'change' }],
                courseIds: [{ required: true, type: 'array', min: 1, message: this.$t('validation.coursesRequired'), trigger: 'change' }],
                courseId: [{ required: true, type: 'number', message: this.$t('validation.courseRequired'), trigger: 'change' }],
            },
        }
    },
    computed: {
        isDetail() {
            return this.mode === 'detail'
        },
        dialogTitle() {
            if (this.isDetail) return this.$t('enrollments.detailTitle')
            return this.mode === 'edit' ? this.$t('enrollments.editTitle') : this.$t('enrollments.add')
        },
    },
    mounted() {
        this.loadOptions()
    },
    methods: {
        validateForm() {
            return new Promise((resolve) => this.$refs.formRef.validate((valid) => resolve(valid)))
        },
        async loadOptions() {
            this.loading = true
            try {
                const [courseData, studentData] = await Promise.all([getCourseOptions(), getStudentOptions()])
                this.courses = courseData
                this.students = studentData
                if (!this.courses.some((item) => item.id === this.selectedCourseId))
                    this.selectedCourseId = (this.courses[0] && this.courses[0].id) || null
                await this.loadEnrollments()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.loading = false
            }
        },
        async loadEnrollments() {
            if (!this.selectedCourseId) {
                this.enrollments = []
                this.total = 0
                return
            }
            this.loading = true
            try {
                const result = await getEnrollmentsByCourse(this.selectedCourseId, this.page - 1, this.size)
                this.enrollments = result.data
                this.total = result.totalElements
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.loading = false
            }
        },
        onCourseChange() {
            this.page = 1
            this.loadEnrollments()
        },
        onSizeChange(value) {
            this.size = value
            this.page = 1
            this.loadEnrollments()
        },
        openCreate() {
            this.mode = 'create'
            this.form = {
                id: null,
                studentId: null,
                studentIds: [],
                courseIds: this.selectedCourseId ? [this.selectedCourseId] : [],
                courseId: null,
                enrolledDate: null,
            }
            if (this.$refs.formRef) this.$refs.formRef.clearValidate()
            this.dialog = true
        },
        async openRecord(id, mode) {
            try {
                const enrollment = await getEnrollment(id)
                this.form = {
                    id: enrollment.id,
                    studentId: enrollment.studentId,
                    studentIds: [],
                    courseIds: [],
                    courseId: enrollment.courseId,
                    enrolledDate: enrollment.enrolledDate,
                }
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
        selectAllStudents() {
            this.form.studentIds = this.students.map((student) => student.id)
        },
        selectAllCourses() {
            this.form.courseIds = this.courses.map((course) => course.id)
        },
        async submit() {
            if (this.isDetail) return
            if (!(await this.validateForm())) return
            this.saving = true
            try {
                if (this.mode === 'create') {
                    await createEnrollments(this.form.studentIds, this.form.courseIds)
                    this.selectedCourseId = this.form.courseIds[0] || this.selectedCourseId
                    this.page = 1
                    Message.success(this.$t('enrollments.processed', { count: this.form.studentIds.length * this.form.courseIds.length }))
                } else if (this.form.id && this.form.courseId) {
                    await updateEnrollment(this.form.id, this.form.studentId, this.form.courseId)
                    this.selectedCourseId = this.form.courseId
                    this.page = 1
                    Message.success(this.$t('enrollments.updated'))
                }
                this.dialog = false
                await this.loadEnrollments()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.saving = false
            }
        },
        async remove(enrollment) {
            try {
                await MessageBox.confirm(
                    this.$t('enrollments.deleteConfirm', { course: enrollment.courseName, student: enrollment.studentName }),
                    this.$t('enrollments.deleteTitle'),
                    {
                        type: 'warning',
                        confirmButtonText: this.$t('enrollments.deleteButton'),
                        cancelButtonText: this.$t('common.cancel'),
                    }
                )
                await deleteEnrollment(enrollment.id)
                Message.success(this.$t('enrollments.deleted'))
                if (this.enrollments.length === 1 && this.page > 1) this.page--
                await this.loadEnrollments()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') Message.error(errorMessage(error))
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
        formatDate(date) {
            if (!date) return '—'
            return new Intl.DateTimeFormat(this.$i18n.locale === 'en' ? 'en-US' : 'vi-VN').format(new Date(`${date}T00:00:00`))
        },
    },
}
</script>
