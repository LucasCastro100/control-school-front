export interface School {
  id: string
  name: string
  address: string
  region: string
  state: string
  city: string
  color?: string
  email?: string
  password?: string
  scheduleType?: "semanal" | "quinzenal"
  active?: boolean
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  password?: string
  role: "admin" | "orientador" | "professor"
  createdAt: string
}

export interface AuthUser {
  email: string
  name: string
  role: "admin" | "orientador" | "professor" | "escola"
  userId?: string
  schoolId?: string
}

export interface Class {
  id: string
  schoolId: string
  nap: string
  name: string
  year: string
  createdAt: string
}

export interface Room {
  id: string
  classId: string
  name: string
  studentCount: number
  createdAt: string
}

export interface Schedule {
  id: string
  classId: string
  roomId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  subject: string
  teacher: string
  fortnight?: 0 | 1 | 2
}

export interface OrientadorSchedule {
  id: string
  schoolId: string
  orientadorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  activity: string
  year: string
  createdAt: string
}

export interface AgendaItem {
  id: string
  orientadorIds: string[]
  date: string
  startTime: string
  endTime: string
  activity: string
  createdAt: string
}

export interface SegmentConfig {
  id: string
  schoolId: string
  segmentName: string
  tapetes: number
  kits: number
  year: string
}

export interface Item {
  id: string
  name: string
  category: "tapete" | "tecnologia"
  naps: string[]
  createdAt: string
}

export interface NapItem {
  id: string
  schoolId: string
  segmentName: string
  itemId: string
  quantity: number
  year: string
}

export interface TbrCategory {
  id: string
  name: string
  createdAt: string
}

export interface TbrTeam {
  id: string
  schoolId: string
  categoryId: string
  name: string
  createdAt: string
}

export type DayOfWeek =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sábado"

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
]
