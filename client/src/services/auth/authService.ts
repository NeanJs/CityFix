import { demoAccounts } from '../../data/seedUsers'
import {
  readStoreItem,
  removeStoreItem,
  writeStoreItem,
} from '../storage/persistentStore'
import type { AuthSession, PublicUser, RegisterInput, User, UserRole } from '../../types/user'
import { hashPassword } from './passwordHash'

const usersKey = 'cityfix.users.v1'
const sessionKey = 'cityfix.session.v1'
const guestReporterKey = 'cityfix.guestReporter.v1'

export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidEmail'
  | 'weakPassword'
  | 'nameRequired'

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(code)
    this.code = code
    this.name = 'AuthError'
  }
}

let users: User[] = []
let session: AuthSession | null = null
let guestReporterId = ''
let hydrated = false
let bootstrapPromise: Promise<void> | null = null

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
  }
}

async function persistUsers() {
  await writeStoreItem(usersKey, JSON.stringify(users))
}

async function persistSession() {
  if (!session) {
    await removeStoreItem(sessionKey)
    return
  }
  await writeStoreItem(sessionKey, JSON.stringify(session))
}

async function seedUsersIfEmpty() {
  if (users.length > 0) {
    return
  }
  const now = new Date().toISOString()
  users = await Promise.all(
    demoAccounts.map(async (account) => ({
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      passwordHash: await hashPassword(account.password),
      createdAt: now,
    })),
  )
  await persistUsers()
}

export async function bootstrapAuth() {
  if (bootstrapPromise) {
    return bootstrapPromise
  }
  bootstrapPromise = (async () => {
    if (hydrated) {
      return
    }
    hydrated = true
    try {
      const rawUsers = await readStoreItem(usersKey)
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers) as User[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          users = parsed
        }
      }
    } catch {
      users = []
    }
    await seedUsersIfEmpty()
    await ensureGuestReporter()
    try {
      const rawSession = await readStoreItem(sessionKey)
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as AuthSession
        if (parsed?.userId && users.some((user) => user.id === parsed.userId)) {
          session = parsed
        }
      }
    } catch {
      session = null
    }
  })()
  return bootstrapPromise
}

async function ensureGuestReporter() {
  try {
    const existing = await readStoreItem(guestReporterKey)
    if (existing?.trim()) {
      guestReporterId = existing.trim()
      return
    }
  } catch {
    guestReporterId = ''
  }
  guestReporterId = `guest-${createId()}`
  await writeStoreItem(guestReporterKey, guestReporterId)
}

export function getGuestReporterId(): string {
  return guestReporterId
}

export function getCurrentUser(): PublicUser | null {
  if (!session) {
    return null
  }
  const user = users.find((item) => item.id === session?.userId)
  return user ? toPublicUser(user) : null
}

export async function login(email: string, password: string): Promise<PublicUser> {
  const normalized = normalizeEmail(email)
  const passwordHash = await hashPassword(password)
  const user = users.find(
    (item) => item.email === normalized && item.passwordHash === passwordHash,
  )
  if (!user) {
    throw new AuthError('invalidCredentials')
  }
  session = { userId: user.id }
  await persistSession()
  return toPublicUser(user)
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const displayName = input.displayName.trim()
  const email = normalizeEmail(input.email)
  if (displayName.length < 2) {
    throw new AuthError('nameRequired')
  }
  if (!isValidEmail(email)) {
    throw new AuthError('invalidEmail')
  }
  if (input.password.length < 8) {
    throw new AuthError('weakPassword')
  }
  if (users.some((item) => item.email === email)) {
    throw new AuthError('emailTaken')
  }
  const user: User = {
    id: createId(),
    email,
    displayName,
    role: 'citizen',
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  }
  users = [...users, user]
  await persistUsers()
  session = { userId: user.id }
  await persistSession()
  return toPublicUser(user)
}

export async function logout(): Promise<void> {
  session = null
  await persistSession()
}

export function homePathForRole(role: UserRole) {
  return role === 'staff' ? '/admin' : '/'
}
