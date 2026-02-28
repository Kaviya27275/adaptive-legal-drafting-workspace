import api from './axiosConfig'

export async function login(email, password) {
  const res = await api.post('/api/users/login/', { email, password })
  return res.data
}

export async function register({ name, email, password, role }) {
  const payload = {
    username: name,
    email,
    password,
    role
  }
  const res = await api.post('/api/users/register/', payload)
  return res.data
}

export async function logout() {
  await api.post('/api/users/logout/')
  return true
}

export async function fetchUsers() {
  const res = await api.get('/api/users/list/')
  return Array.isArray(res.data) ? res.data : []
}

