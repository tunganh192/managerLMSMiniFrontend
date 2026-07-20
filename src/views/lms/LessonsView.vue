<template>
    <div class="lms-page">
        <section class="page-heading">
            <div>
                <span class="eyebrow">{{ $t('lessons.eyebrow') }}</span>
                <h2>{{ $t('lessons.title') }}</h2>
                <p>{{ $t('lessons.subtitle') }}</p>
            </div>
            <el-button type="primary" size="large" icon="el-icon-plus" :disabled="!courses.length" @click="openCreate">{{
                $t('lessons.add')
            }}</el-button>
        </section>
        <section class="content-card">
            <div class="toolbar toolbar--lesson">
                <label>{{ $t('lessons.viewingCourse') }}</label
                ><el-select v-model="selectedCourseId" filterable :placeholder="$t('lessons.selectCourse')" @change="onCourseChange"
                    ><el-option v-for="course in courses" :key="course.id" :label="`${course.code} · ${course.name}`" :value="course.id" /></el-select
                ><el-button icon="el-icon-refresh" @click="loadOptions">{{ $t('common.refresh') }}</el-button
                ><span class="toolbar__spacer"></span><el-tag v-if="selectedCourse" size="medium">{{ $t('lessons.count', { count: total }) }}</el-tag>
            </div>
            <el-empty v-if="!courses.length && !loading" :description="$t('lessons.createCourseFirst')"
                ><el-button type="primary" @click="$router.push('/courses')">{{ $t('lessons.goToCourses') }}</el-button></el-empty
            >
            <el-table v-else v-loading="loading" :data="lessons" class="clean-table" :empty-text="$t('lessons.empty')">
                <el-table-column :label="$t('lessons.column')" min-width="300"
                    ><template slot-scope="scope"
                        ><div class="entity-cell entity-cell--media">
                            <el-image
                                :src="scope.row.thumbnailUrl || fallback"
                                fit="cover"
                                :preview-src-list="scope.row.thumbnailUrl ? [scope.row.thumbnailUrl] : []"
                            />
                            <div>
                                <strong>{{ scope.row.title }}</strong
                                ><small>#BH{{ scope.row.id }} · {{ scope.row.courseName }}</small>
                            </div>
                        </div></template
                    ></el-table-column
                >
                <el-table-column prop="description" :label="$t('common.description')" min-width="250" show-overflow-tooltip />
                <el-table-column :label="$t('common.video')" width="140"
                    ><template slot-scope="scope"
                        ><el-button
                            v-if="scope.row.videoUrl"
                            plain
                            type="primary"
                            size="mini"
                            icon="el-icon-video-play"
                            @click="previewVideo(scope.row.videoUrl)"
                            >{{ $t('lessons.watchVideo') }}</el-button
                        ><span v-else class="muted-text">{{ $t('common.notUploaded') }}</span></template
                    ></el-table-column
                >
                <el-table-column :label="$t('lessons.supplementalContent')" width="180"
                    ><template slot-scope="scope"
                        ><span :class="{ 'muted-text': !supplementalMediaCount(scope.row) }">{{ supplementalMediaLabel(scope.row) }}</span></template
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
                <span>{{ $t('lessons.total', { count: total }) }}</span
                ><el-pagination
                    :current-page.sync="page"
                    :page-size="size"
                    background
                    layout="sizes, prev, pager, next"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="total"
                    @current-change="onPageChange"
                    @size-change="onSizeChange"
                />
            </div>
        </section>
        <el-dialog :visible.sync="dialog" :title="dialogTitle" width="min(900px, 96vw)" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.native.prevent>
                <div class="form-grid form-grid--two">
                    <el-form-item :label="$t('common.course')" prop="courseId"
                        ><el-select v-model="form.courseId" :disabled="isDetail" filterable class="w100"
                            ><el-option
                                v-for="course in courses"
                                :key="course.id"
                                :label="`${course.code} · ${course.name}`"
                                :value="course.id" /></el-select
                    ></el-form-item>
                </div>
                <el-form-item :label="$t('lessons.titleLabel')" prop="title"
                    ><el-input v-model="form.title" :disabled="isDetail" maxlength="200"
                /></el-form-item>
                <el-form-item :label="$t('common.description')" prop="description"
                    ><el-input v-model="form.description" :disabled="isDetail" type="textarea" :rows="3" maxlength="2000" show-word-limit
                /></el-form-item>
                <div v-if="currentThumbnail || currentVideo" class="current-media-row">
                    <div v-if="currentThumbnail">
                        <span>{{ $t('lessons.currentThumbnail') }}</span
                        ><el-image :src="currentThumbnail" fit="cover" :preview-src-list="[currentThumbnail]" />
                    </div>
                    <div v-if="currentVideo">
                        <span>{{ $t('lessons.currentVideo') }}</span
                        ><el-button plain type="primary" icon="el-icon-video-play" @click="previewVideo(currentVideo)">{{
                            $t('lessons.openVideo')
                        }}</el-button>
                    </div>
                </div>
                <section v-if="currentLessonImages.length || currentLessonVideos.length" class="existing-lesson-media">
                    <div class="existing-lesson-media__heading">
                        <div>
                            <strong>{{ $t('lessons.uploadedMedia') }}</strong
                            ><span>{{ $t('lessons.uploadedMediaHint') }}</span>
                        </div>
                        <el-tag effect="plain">{{ $t('common.files', { count: currentLessonImages.length + currentLessonVideos.length }) }}</el-tag>
                    </div>
                    <div v-if="currentLessonImages.length" class="existing-media-group">
                        <span>{{ $t('lessons.contentImages') }}</span>
                        <div class="existing-gallery existing-gallery--lesson">
                            <article
                                v-for="image in currentLessonImages"
                                :key="image.id"
                                :class="{ 'is-selected-primary': form.thumbnailImageId === image.id }"
                            >
                                <el-image :src="image.url" fit="cover" :preview-src-list="currentLessonImages.map((item) => item.url)" />
                                <el-button
                                    v-if="!isDetail"
                                    circle
                                    type="danger"
                                    size="mini"
                                    icon="el-icon-close"
                                    @click="markExistingMediaRemoved(image, 'image')"
                                />
                                <div v-if="!isDetail" class="existing-media-card__actions">
                                    <el-tag v-if="form.thumbnailImageId === image.id" type="success" size="mini">{{
                                        $t('lessons.newThumbnail')
                                    }}</el-tag>
                                    <el-button v-else type="text" icon="el-icon-picture-outline" @click="setAsThumbnail(image)">{{
                                        $t('lessons.setThumbnail')
                                    }}</el-button>
                                </div>
                            </article>
                        </div>
                    </div>
                    <div v-if="currentLessonVideos.length" class="existing-media-group">
                        <span>{{ $t('lessons.extraVideos') }}</span>
                        <div class="existing-video-grid">
                            <article
                                v-for="video in currentLessonVideos"
                                :key="video.id"
                                :class="{ 'is-selected-primary': form.mainVideoId === video.id }"
                            >
                                <i class="el-icon-video-camera"></i>
                                <div>
                                    <strong>{{ video.originalName || `Video #${video.id}` }}</strong
                                    ><small>{{ video.contentType }}</small>
                                </div>
                                <el-button type="text" icon="el-icon-video-play" @click="previewVideo(video.url)">{{ $t('common.view') }}</el-button>
                                <el-tag v-if="!isDetail && form.mainVideoId === video.id" type="success" size="mini">{{
                                    $t('lessons.newMainVideo')
                                }}</el-tag>
                                <el-button v-else-if="!isDetail" type="text" icon="el-icon-star-off" @click="setAsMainVideo(video)">{{
                                    $t('lessons.setMainVideo')
                                }}</el-button>
                                <el-button
                                    v-if="!isDetail"
                                    type="text"
                                    class="danger-text"
                                    icon="el-icon-delete"
                                    @click="markExistingMediaRemoved(video, 'video')"
                                    >{{ $t('common.delete') }}</el-button
                                >
                            </article>
                        </div>
                    </div>
                </section>
                <div v-if="!isDetail" class="form-grid form-grid--two media-picker-grid">
                    <el-form-item :label="$t('common.thumbnail')" prop="thumbnailFiles"
                        ><FilePicker
                            v-model="form.thumbnailFiles"
                            :label="$t('lessons.chooseThumbnail')"
                            :hint="$t('lessons.thumbnailHint')"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            :max-size-mb="10"
                            @input="onPrimaryFileInput('thumbnailFiles', 'thumbnailImageId')"
                    /></el-form-item>
                    <el-form-item :label="$t('lessons.mainVideo')" prop="videoFiles"
                        ><FilePicker
                            v-model="form.videoFiles"
                            kind="video"
                            :label="$t('lessons.chooseVideo')"
                            :hint="$t('lessons.videoHint')"
                            accept="video/mp4,video/webm,video/ogg"
                            :max-size-mb="10"
                            @input="onPrimaryFileInput('videoFiles', 'mainVideoId')"
                    /></el-form-item>
                    <el-form-item :label="$t('lessons.contentImages')" prop="imageFiles"
                        ><FilePicker
                            v-model="form.imageFiles"
                            :label="$t('lessons.chooseImages')"
                            :hint="$t('lessons.imagesHint')"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            multiple
                            :max="10"
                            :max-size-mb="10"
                            @input="validateField('imageFiles')"
                    /></el-form-item>
                    <el-form-item :label="$t('lessons.extraVideos')" prop="extraVideoFiles"
                        ><FilePicker
                            v-model="form.extraVideoFiles"
                            kind="video"
                            :label="$t('lessons.chooseVideos')"
                            :hint="$t('lessons.videosHint')"
                            accept="video/mp4,video/webm,video/ogg"
                            multiple
                            :max="5"
                            :max-size-mb="10"
                            @input="validateField('extraVideoFiles')"
                    /></el-form-item>
                </div>
            </el-form>
            <span slot="footer">
                <el-button v-if="isDetail" type="primary" @click="dialog = false">{{ $t('common.close') }}</el-button>
                <template v-else>
                    <el-button @click="dialog = false">{{ $t('common.cancel') }}</el-button>
                    <el-button type="primary" :loading="saving" @click="submit">{{
                        form.id ? $t('common.saveChanges') : $t('lessons.add')
                    }}</el-button>
                </template>
            </span>
        </el-dialog>
        <el-dialog :visible.sync="videoDialog" :title="$t('lessons.videoPreview')" width="min(900px, 96vw)" destroy-on-close
            ><video v-if="videoDialog" class="video-preview" :src="videoDialogUrl" controls autoplay preload="metadata"
        /></el-dialog>
    </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui'
import { getCourseOptions } from '/@/api/courseApi'
import { errorMessage } from '/@/api/http'
import { deleteLesson, getLesson, getLessonsByCourse, saveLesson } from '/@/api/lessonApi'
import FilePicker from '/@/components/FilePicker.vue'

export default {
    name: 'LessonsView',
    components: { FilePicker },
    data() {
        return {
            fallback:
                'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="72"%3E%3Crect width="100%25" height="100%25" fill="%23ecfeff"/%3E%3Ctext x="50%25" y="54%25" text-anchor="middle" font-size="12" fill="%230891b2"%3ELESSON%3C/text%3E%3C/svg%3E',
            loading: false,
            saving: false,
            dialog: false,
            mode: 'create',
            videoDialog: false,
            videoDialogUrl: '',
            courses: [],
            lessons: [],
            total: 0,
            selectedCourseId: null,
            page: 1,
            size: 10,
            form: {
                id: null,
                courseId: null,
                title: '',
                description: '',
                thumbnailFiles: [],
                videoFiles: [],
                imageFiles: [],
                extraVideoFiles: [],
                thumbnailImageId: null,
                mainVideoId: null,
            },
            currentThumbnail: '',
            currentVideo: '',
            originalThumbnail: '',
            originalVideo: '',
            currentLessonImages: [],
            currentLessonVideos: [],
            removedMediaIds: [],
            rules: {
                courseId: [{ required: true, type: 'number', message: this.$t('validation.courseRequired'), trigger: 'change' }],
                title: [
                    { required: true, whitespace: true, message: this.$t('validation.lessonTitleRequired'), trigger: ['blur', 'change'] },
                    { max: 200, message: this.$t('validation.lessonTitleMax'), trigger: ['blur', 'change'] },
                ],
                description: [{ max: 2000, message: this.$t('validation.descriptionMax'), trigger: ['blur', 'change'] }],
                thumbnailFiles: [
                    {
                        validator: (_rule, value, callback) => {
                            if (!this.form.id && (!value || !value.length)) callback(new Error(this.$t('validation.thumbnailRequired')))
                            else callback()
                        },
                        trigger: 'change',
                    },
                ],
                videoFiles: [
                    {
                        validator: (_rule, value, callback) => {
                            if (!this.form.id && (!value || !value.length)) callback(new Error(this.$t('validation.mainVideoRequired')))
                            else callback()
                        },
                        trigger: 'change',
                    },
                ],
                imageFiles: [{ type: 'array', max: 10, message: this.$t('validation.imagesMax'), trigger: 'change' }],
                extraVideoFiles: [{ type: 'array', max: 5, message: this.$t('validation.videosMax'), trigger: 'change' }],
            },
        }
    },
    computed: {
        isDetail() {
            return this.mode === 'detail'
        },
        dialogTitle() {
            if (this.isDetail) return this.$t('lessons.detailTitle')
            return this.mode === 'edit' ? this.$t('lessons.editTitle') : this.$t('lessons.add')
        },
        selectedCourse() {
            return this.courses.find((item) => item.id === this.selectedCourseId)
        },
    },
    mounted() {
        this.loadOptions()
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
        onPrimaryFileInput(field, promotionField) {
            if (this.form[field].length) {
                this.form[promotionField] = null
                if (field === 'thumbnailFiles') this.currentThumbnail = this.originalThumbnail
                else this.currentVideo = this.originalVideo
            }
            this.validateField(field)
        },
        async loadOptions() {
            this.loading = true
            try {
                this.courses = await getCourseOptions()
                if (!this.courses.some((item) => item.id === this.selectedCourseId))
                    this.selectedCourseId = (this.courses[0] && this.courses[0].id) || null
                await this.loadLessons()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.loading = false
            }
        },
        async loadLessons() {
            if (!this.selectedCourseId) {
                this.lessons = []
                this.total = 0
                return
            }
            this.loading = true
            try {
                const result = await getLessonsByCourse(this.selectedCourseId, { page: this.page - 1, size: this.size })
                this.lessons = result.data || []
                this.total = result.totalElements || 0
                const lastPage = Math.max(1, result.totalPages || 0)
                if (this.page > lastPage) {
                    this.page = lastPage
                    await this.loadLessons()
                }
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.loading = false
            }
        },
        onCourseChange() {
            this.page = 1
            this.loadLessons()
        },
        onSizeChange(value) {
            this.size = value
            this.page = 1
            this.loadLessons()
        },
        onPageChange(value) {
            this.page = value
            this.loadLessons()
        },
        resetFiles() {
            this.form.thumbnailFiles = []
            this.form.videoFiles = []
            this.form.imageFiles = []
            this.form.extraVideoFiles = []
            this.currentThumbnail = ''
            this.currentVideo = ''
            this.originalThumbnail = ''
            this.originalVideo = ''
            this.currentLessonImages = []
            this.currentLessonVideos = []
            this.removedMediaIds = []
        },
        openCreate() {
            this.mode = 'create'
            this.form = {
                id: null,
                courseId: this.selectedCourseId || (this.courses[0] && this.courses[0].id) || null,
                title: '',
                description: '',
                thumbnailFiles: [],
                videoFiles: [],
                imageFiles: [],
                extraVideoFiles: [],
                thumbnailImageId: null,
                mainVideoId: null,
            }
            this.resetFiles()
            if (this.$refs.formRef) this.$refs.formRef.clearValidate()
            this.dialog = true
        },
        async openRecord(id, mode) {
            try {
                const lesson = await getLesson(id)
                this.form = {
                    id: lesson.id,
                    courseId: lesson.courseId,
                    title: lesson.title,
                    description: lesson.description || '',
                    thumbnailFiles: [],
                    videoFiles: [],
                    imageFiles: [],
                    extraVideoFiles: [],
                    thumbnailImageId: null,
                    mainVideoId: null,
                }
                this.resetFiles()
                this.currentThumbnail = lesson.thumbnailUrl || ''
                this.currentVideo = lesson.videoUrl || ''
                this.originalThumbnail = this.currentThumbnail
                this.originalVideo = this.currentVideo
                const existingMedia = lesson.images || []
                this.currentLessonImages = existingMedia.filter((item) => item.mediaRole === 'LESSON_IMAGE')
                this.currentLessonVideos = existingMedia.filter(
                    (item) => item.mediaRole === 'LESSON_EXTRA_VIDEO' || (item.mediaRole === 'LESSON_VIDEO' && item.url !== this.currentVideo)
                )
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
        setAsThumbnail(image) {
            this.form.thumbnailImageId = image.id
            this.form.thumbnailFiles = []
            this.currentThumbnail = image.url
            Message.success(this.$t('lessons.thumbnailSelected'))
        },
        setAsMainVideo(video) {
            this.form.mainVideoId = video.id
            this.form.videoFiles = []
            this.currentVideo = video.url
            Message.success(this.$t('lessons.videoSelected'))
        },
        markExistingMediaRemoved(media, type) {
            if (!this.removedMediaIds.includes(media.id)) this.removedMediaIds.push(media.id)
            if (type === 'image') {
                this.currentLessonImages = this.currentLessonImages.filter((item) => item.id !== media.id)
                if (this.form.thumbnailImageId === media.id) {
                    this.form.thumbnailImageId = null
                    this.currentThumbnail = this.originalThumbnail
                }
            } else {
                this.currentLessonVideos = this.currentLessonVideos.filter((item) => item.id !== media.id)
                if (this.form.mainVideoId === media.id) {
                    this.form.mainVideoId = null
                    this.currentVideo = this.originalVideo
                }
            }
        },
        async submit() {
            if (this.isDetail) return
            if (!(await this.validateForm()) || !this.form.courseId) return
            this.saving = true
            try {
                const payload = new FormData()
                payload.append('courseId', String(this.form.courseId))
                payload.append('title', this.form.title.trim())
                payload.append('description', this.form.description.trim())
                if (this.form.thumbnailFiles[0]) payload.append('thumbnail', this.form.thumbnailFiles[0])
                if (this.form.videoFiles[0]) payload.append('video', this.form.videoFiles[0])
                this.form.imageFiles.forEach((file) => payload.append('images', file))
                this.form.extraVideoFiles.forEach((file) => payload.append('videos', file))
                this.removedMediaIds.forEach((id) => payload.append('deletedImageIds', String(id)))
                if (this.form.thumbnailImageId) payload.append('thumbnailImageId', String(this.form.thumbnailImageId))
                if (this.form.mainVideoId) payload.append('mainVideoId', String(this.form.mainVideoId))
                await saveLesson(this.form.id, payload)
                this.selectedCourseId = this.form.courseId
                this.page = 1
                Message.success(this.form.id ? this.$t('lessons.updated') : this.$t('lessons.created'))
                this.dialog = false
                await this.loadLessons()
            } catch (error) {
                Message.error(errorMessage(error))
            } finally {
                this.saving = false
            }
        },
        async remove(lesson) {
            try {
                await MessageBox.confirm(this.$t('lessons.deleteConfirm', { title: lesson.title }), this.$t('lessons.deleteTitle'), {
                    type: 'warning',
                    confirmButtonText: this.$t('lessons.deleteButton'),
                    cancelButtonText: this.$t('common.cancel'),
                })
                await deleteLesson(lesson.id)
                Message.success(this.$t('lessons.deleted'))
                if (this.lessons.length === 1 && this.page > 1) this.page--
                await this.loadLessons()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') Message.error(errorMessage(error))
            }
        },
        previewVideo(url) {
            this.videoDialogUrl = url
            this.videoDialog = true
        },
        supplementalImageCount(lesson) {
            return (lesson.images || []).filter((item) => item.mediaRole === 'LESSON_IMAGE').length
        },
        supplementalVideoCount(lesson) {
            return (lesson.images || []).filter(
                (item) => item.mediaRole === 'LESSON_EXTRA_VIDEO' || (item.mediaRole === 'LESSON_VIDEO' && item.url !== lesson.videoUrl)
            ).length
        },
        supplementalMediaCount(lesson) {
            return this.supplementalImageCount(lesson) + this.supplementalVideoCount(lesson)
        },
        supplementalMediaLabel(lesson) {
            const parts = []
            const imageCount = this.supplementalImageCount(lesson)
            const videoCount = this.supplementalVideoCount(lesson)
            if (imageCount) parts.push(this.$t('common.images', { count: imageCount }))
            if (videoCount) parts.push(this.$t('common.videos', { count: videoCount }))
            return parts.join(' · ') || this.$t('common.none')
        },
    },
}
</script>
