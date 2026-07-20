import http, { compactParams, unwrap } from './http'

export const getCourses = async (filters = {}, page = 0, size = 10) =>
    unwrap(await http.get('/courses', { params: compactParams({ ...filters, page, size }) }))

export const getCourseOptions = async () => unwrap(await http.get('/courses/options'))

export const getCourse = async (id) => unwrap(await http.get(`/courses/${id}`))

export const saveCourse = async (id, form) => unwrap(id ? await http.put(`/courses/${id}`, form) : await http.post('/courses', form))

export const deleteCourse = async (id) => unwrap(await http.delete(`/courses/${id}`))

export const exportCourses = async (filters = {}) =>
    (await http.get('/courses/export', { params: compactParams(filters), responseType: 'blob' })).data
