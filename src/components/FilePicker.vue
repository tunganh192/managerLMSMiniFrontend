<template>
    <div class="file-picker">
        <label class="file-picker__drop" :class="{ 'is-disabled': disabled }">
            <input ref="inputRef" type="file" :accept="accept" :multiple="multiple" :disabled="disabled" @change="onChange" />
            <i class="el-icon-upload file-picker__icon"></i>
            <strong>{{ label }}</strong>
            <span>{{ hint || $t('file.chooseFromDevice') }}</span>
        </label>
        <div v-if="previews.length" class="file-picker__preview">
            <article v-for="(item, index) in previews" :key="item.url" class="file-preview-card">
                <img v-if="kind === 'image'" :src="item.url" :alt="item.file.name" />
                <video v-else :src="item.url" controls preload="metadata" />
                <div>
                    <strong>{{ item.file.name }}</strong
                    ><small>{{ formatBytes(item.file.size) }}</small>
                </div>
                <el-button
                    type="text"
                    class="file-preview-card__remove"
                    :aria-label="$t('file.remove')"
                    icon="el-icon-close"
                    @click="remove(index)"
                />
            </article>
        </div>
    </div>
</template>

<script>
import { Message } from 'element-ui'

export default {
    name: 'FilePicker',
    props: {
        value: { type: Array, default: () => [] },
        label: { type: String, required: true },
        hint: { type: String, default: '' },
        accept: { type: String, default: '*/*' },
        multiple: { type: Boolean, default: false },
        max: { type: Number, default: 1 },
        kind: { type: String, default: 'image' },
        disabled: { type: Boolean, default: false },
        maxSizeMb: { type: Number, default: 10 },
    },
    data() {
        return { previews: [] }
    },
    watch: {
        value: {
            deep: true,
            immediate: true,
            handler(files) {
                this.clearUrls()
                this.previews = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
                if (!files.length && this.$refs.inputRef) this.$refs.inputRef.value = ''
            },
        },
    },
    beforeDestroy() {
        this.clearUrls()
    },
    methods: {
        clearUrls() {
            this.previews.forEach((item) => URL.revokeObjectURL(item.url))
        },
        onChange(event) {
            const input = event.target
            const selected = Array.from(input.files || [])
            if (selected.length > this.max) {
                Message.warning(this.$t('file.maxFiles', { count: this.max }))
                input.value = ''
                return
            }
            const maxBytes = this.maxSizeMb * 1024 * 1024
            if (selected.some((file) => file.size > maxBytes)) {
                Message.warning(this.$t('file.maxSize', { size: this.maxSizeMb }))
                input.value = ''
                return
            }
            const acceptedTypes = this.accept.split(',').map((type) => type.trim())
            const hasInvalidType = selected.some(
                (file) =>
                    file.type && !acceptedTypes.some((type) => (type.endsWith('/*') ? file.type.startsWith(type.slice(0, -1)) : file.type === type))
            )
            if (hasInvalidType) {
                Message.warning(this.$t('file.invalidType'))
                input.value = ''
                return
            }
            this.$emit('input', selected)
        },
        remove(index) {
            this.$emit(
                'input',
                this.value.filter((_, itemIndex) => itemIndex !== index)
            )
        },
        formatBytes(bytes) {
            if (bytes < 1024) return `${bytes} B`
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
            return `${(bytes / 1024 / 1024).toFixed(1)} MB`
        },
    },
}
</script>
