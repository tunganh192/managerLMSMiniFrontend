import http, { unwrap } from './http'

export const createEnrollments = async (studentIds, courseIds) => unwrap(await http.post('/enrollments', { studentIds, courseIds }))

export const getEnrollment = async (id) => unwrap(await http.get(`/enrollments/${id}`))

export const updateEnrollment = async (id, studentId, courseId) => unwrap(await http.put(`/enrollments/${id}`, { studentId, courseId }))

export const deleteEnrollment = async (id) => unwrap(await http.delete(`/enrollments/${id}`))

export const getEnrollmentsByCourse = async (courseId, page = 0, size = 10) =>
    unwrap(await http.get(`/enrollments/course/${courseId}`, { params: { page, size } }))
