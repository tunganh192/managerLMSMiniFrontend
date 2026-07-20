import http, { compactParams, unwrap } from './http'

export const getStudents = async (filters = {}, page = 0, size = 10) =>
    unwrap(await http.get('/students', { params: compactParams({ ...filters, page, size }) }))

export const getStudentOptions = async () => unwrap(await http.get('/students/options'))

export const getStudent = async (id) => unwrap(await http.get(`/students/${id}`))

export const saveStudent = async (id, form) => unwrap(id ? await http.put(`/students/${id}`, form) : await http.post('/students', form))

export const deleteStudent = async (id) => unwrap(await http.delete(`/students/${id}`))

export const exportStudents = async (filters = {}) =>
    (await http.get('/students/export', { params: compactParams(filters), responseType: 'blob' })).data
