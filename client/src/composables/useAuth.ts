import { computed, ref } from 'vue'
import {
  bootstrapAuth,
  getCurrentUser,
  getGuestReporterId,
  login as loginUser,
  logout as logoutUser,
  register as registerUser,
} from '../services/auth/authService'
import type { PublicUser, RegisterInput } from '../types/user'

const currentUser = ref<PublicUser | null>(null)
const guestReporterId = ref('')
const ready = ref(false)
let hydratePromise: Promise<void> | null = null

export async function hydrateAuth() {
  if (hydratePromise) {
    return hydratePromise
  }
  hydratePromise = (async () => {
    await bootstrapAuth()
    currentUser.value = getCurrentUser()
    guestReporterId.value = getGuestReporterId()
    ready.value = true
  })()
  return hydratePromise
}

export function useAuth() {
  const isStaff = computed(() => currentUser.value?.role === 'staff')
  const isCitizen = computed(() => currentUser.value?.role === 'citizen')
  const reporterId = computed(() => currentUser.value?.id ?? guestReporterId.value)

  async function login(email: string, password: string) {
    const user = await loginUser(email, password)
    currentUser.value = user
    return user
  }

  async function register(input: RegisterInput) {
    const user = await registerUser(input)
    currentUser.value = user
    return user
  }

  async function logout() {
    await logoutUser()
    currentUser.value = null
  }

  return {
    currentUser,
    reporterId,
    isStaff,
    isCitizen,
    ready,
    login,
    register,
    logout,
  }
}
