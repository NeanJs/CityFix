export type UserRole = 'citizen' | 'staff'

export type User = {
  id: string
  email: string
  displayName: string
  role: UserRole
  passwordHash: string
  createdAt: string
}

export type PublicUser = Omit<User, 'passwordHash'>

export type RegisterInput = {
  displayName: string
  email: string
  password: string
}

export type AuthSession = {
  userId: string
}
