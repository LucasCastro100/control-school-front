export interface School {
  id: string
  name: string
  address: string
  region: string
  state: string
  city: string
  color?: string
  orientadorId?: string
  createdAt: string
}

export interface Orientador {
  id: string
  name: string
  email: string
  region: string
  state: string
  city: string
  createdAt: string
}

export interface AuthUser {
  email: string
  name: string
}

export interface Class {
  id: string
  schoolId: string
  nap: string
  name: string
  createdAt: string
}

export interface Room {
  id: string
  classId: string
  name: string
  createdAt: string
}

export interface Student {
  id: string
  roomId: string
  name: string
  registrationNumber: string
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
}

export interface SegmentConfig {
  id: string
  schoolId: string
  segmentName: string
  tapetes: number
  kits: number
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
