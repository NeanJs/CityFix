export type UserRole = 'citizen' | 'staff'

export type PublicUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
  createdAt: string
}
