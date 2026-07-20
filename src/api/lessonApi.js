import http, { unwrap } from './http'

export const getLessonsByCourse = async (courseId, params) => unwrap(await http.get(`/lessons/course/${courseId}`, { params }))

export const getLesson = async (id) => unwrap(await http.get(`/lessons/${id}`))

export const saveLesson = async (id, form) => unwrap(id ? await http.put(`/lessons/${id}`, form) : await http.post('/lessons', form))

export const deleteLesson = async (id) => unwrap(await http.delete(`/lessons/${id}`))
