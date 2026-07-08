import type { School, Class, Room, Student, Schedule, AuthUser, SegmentConfig, Item, NapItem, Orientador, TbrCategory, TbrTeam } from "./types"
import seedData from "@/data/seed.json"

const STORAGE_KEYS = {
  schools: "control-schools:schools",
  classes: "control-schools:classes",
  rooms: "control-schools:rooms",
  students: "control-schools:students",
  schedules: "control-schools:schedules",
  segmentConfigs: "control-schools:segment-configs",
  items: "control-schools:items",
  napItems: "control-schools:nap-items",
  orientadores: "control-schools:orientadores",
  tbrCategories: "control-schools:tbr-categories",
  tbrTeams: "control-schools:tbr-teams",
} as const

const runtimeCache: Record<string, unknown[]> = { ...seedData }

export function initStorage(): void {
  if (typeof window === "undefined") return
  for (const key of Object.keys(runtimeCache)) {
    const existing = localStorage.getItem(key)
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(runtimeCache[key]))
    } else {
      runtimeCache[key] = JSON.parse(existing)
    }
  }
  migrateExistingData()
}

function migrateExistingData(): void {
  const currentYear = "2026"
  const classes = getItems<Record<string, unknown>>(STORAGE_KEYS.classes)
  let classesChanged = false
  for (const c of classes) {
    if (!c.year) {
      c.year = currentYear
      classesChanged = true
    }
  }
  if (classesChanged) setItems(STORAGE_KEYS.classes, classes)

  const napItems = getItems<Record<string, unknown>>(STORAGE_KEYS.napItems)
  let napItemsChanged = false
  for (const n of napItems) {
    if (!n.year) {
      n.year = currentYear
      napItemsChanged = true
    }
  }
  if (napItemsChanged) setItems(STORAGE_KEYS.napItems, napItems)

  const segConfigs = getItems<Record<string, unknown>>(STORAGE_KEYS.segmentConfigs)
  let segChanged = false
  for (const s of segConfigs) {
    if (!s.year) {
      s.year = currentYear
      segChanged = true
    }
  }
  if (segChanged) setItems(STORAGE_KEYS.segmentConfigs, segConfigs)
}

export function exportStorageData(): Record<string, unknown[]> {
  return { ...runtimeCache }
}

export function importStorageData(data: Record<string, unknown[]>): void {
  if (typeof window === "undefined") return
  for (const [key, value] of Object.entries(data)) {
    if (key in runtimeCache) {
      localStorage.setItem(key, JSON.stringify(value))
      runtimeCache[key] = value
    }
  }
}

function getItems<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(key)
    if (data) {
      const parsed = JSON.parse(data) as T[]
      runtimeCache[key] = parsed as unknown[]
      return parsed
    }
    const fallback = (runtimeCache[key] ?? []) as T[]
    localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  } catch {
    return []
  }
}

function setItems<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(items))
  runtimeCache[key] = items as unknown[]
}

function generateId(): string {
  return crypto.randomUUID()
}

// Schools
export function getSchools(): School[] {
  return getItems<School>(STORAGE_KEYS.schools)
}

export function getSchoolsByYear(year: string): School[] {
  return getSchools().filter((s) => new Date(s.createdAt).getFullYear().toString() === year)
}

export function getSchoolYears(): string[] {
  const schoolYears = getSchools().map((s) => new Date(s.createdAt).getFullYear().toString()).filter(Boolean)
  const classYears = getClasses().map((c) => c.year).filter(Boolean)
  const years = new Set([...schoolYears, ...classYears])
  return Array.from(years).sort()
}

export function getAcademicYears(): string[] {
  const classYears = getClasses().map((c) => c.year).filter(Boolean)
  const napItemYears = getItems<NapItem>(STORAGE_KEYS.napItems).map((n) => (n as NapItem).year).filter(Boolean)
  const years = new Set([...classYears, ...napItemYears])
  const sorted = Array.from(years).sort()
  if (sorted.length === 0) {
    return [String(new Date().getFullYear())]
  }
  return sorted
}

export function getSchool(id: string): School | undefined {
  return getSchools().find((s) => s.id === id)
}

export function createSchool(
  data: Omit<School, "id" | "createdAt">
): School {
  const schools = getSchools()
  const school: School = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.schools, [...schools, school])
  return school
}

// Auth
const AUTH_KEY = "control-schools:auth"

export function login(
  email: string,
  password: string
): AuthUser | null {
  if (email === "admin@gmail.com" && password === "mudar123") {
    const user: AuthUser = { email, name: "Administrador" }
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    }
    return user
  }
  return null
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY)
  }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(AUTH_KEY)
    return data ? (JSON.parse(data) as AuthUser) : null
  } catch {
    return null
  }
}

export function updateSchool(
  id: string,
  data: Partial<Omit<School, "id" | "createdAt">>
): School | undefined {
  const schools = getSchools()
  const index = schools.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  schools[index] = { ...schools[index], ...data }
  setItems(STORAGE_KEYS.schools, schools)
  return schools[index]
}

export function deleteSchool(id: string): void {
  const schools = getSchools().filter((s) => s.id !== id)
  setItems(STORAGE_KEYS.schools, schools)
  const classes = getClasses().filter((c) => c.schoolId !== id)
  setItems(STORAGE_KEYS.classes, classes)
  const classIds = classes.map((c) => c.id)
  const rooms = getRooms().filter((r) => !classIds.includes(r.classId))
  setItems(STORAGE_KEYS.rooms, rooms)
  const roomIds = rooms.map((r) => r.id)
  const students = getStudents().filter(
    (s) => !roomIds.includes(s.roomId)
  )
  setItems(STORAGE_KEYS.students, students)
  const schedules = getSchedules().filter(
    (s) => !classIds.includes(s.classId)
  )
  setItems(STORAGE_KEYS.schedules, schedules)
  deleteSegmentConfigsBySchool(id)
  deleteNapItemsBySchool(id)
  deleteTbrTeamsBySchool(id)
}

// Classes
export function getClasses(): Class[] {
  return getItems<Class>(STORAGE_KEYS.classes)
}

export function getClassesBySchool(schoolId: string): Class[] {
  return getClasses().filter((c) => c.schoolId === schoolId)
}

export function getClass(id: string): Class | undefined {
  return getClasses().find((c) => c.id === id)
}

export function getClassesBySchoolAndYear(schoolId: string, year: string): Class[] {
  return getClasses().filter((c) => c.schoolId === schoolId && c.year === year)
}

export function createClass(
  data: Omit<Class, "id" | "createdAt">
): Class {
  const classes = getClasses()
  const cls: Class = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.classes, [...classes, cls])
  return cls
}

export function updateClass(
  id: string,
  data: Partial<Omit<Class, "id" | "createdAt">>
): Class | undefined {
  const classes = getClasses()
  const index = classes.findIndex((c) => c.id === id)
  if (index === -1) return undefined
  classes[index] = { ...classes[index], ...data }
  setItems(STORAGE_KEYS.classes, classes)
  return classes[index]
}

export function deleteClass(id: string): void {
  const classes = getClasses().filter((c) => c.id !== id)
  setItems(STORAGE_KEYS.classes, classes)
  const rooms = getRooms().filter((r) => r.classId !== id)
  setItems(STORAGE_KEYS.rooms, rooms)
  const roomIds = rooms.map((r) => r.id)
  const students = getStudents().filter(
    (s) => !roomIds.includes(s.roomId)
  )
  setItems(STORAGE_KEYS.students, students)
  const schedules = getSchedules().filter((s) => s.classId !== id)
  setItems(STORAGE_KEYS.schedules, schedules)
}

// Rooms
export function getRooms(): Room[] {
  return getItems<Room>(STORAGE_KEYS.rooms)
}

export function getRoomsByClass(classId: string): Room[] {
  return getRooms().filter((r) => r.classId === classId)
}

export function getRoom(id: string): Room | undefined {
  return getRooms().find((r) => r.id === id)
}

export function createRoom(data: Omit<Room, "id" | "createdAt">): Room {
  const rooms = getRooms()
  const room: Room = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.rooms, [...rooms, room])
  return room
}

export function updateRoom(
  id: string,
  data: Partial<Omit<Room, "id" | "createdAt">>
): Room | undefined {
  const rooms = getRooms()
  const index = rooms.findIndex((r) => r.id === id)
  if (index === -1) return undefined
  rooms[index] = { ...rooms[index], ...data }
  setItems(STORAGE_KEYS.rooms, rooms)
  return rooms[index]
}

export function deleteRoom(id: string): void {
  const rooms = getRooms().filter((r) => r.id !== id)
  setItems(STORAGE_KEYS.rooms, rooms)
  const students = getStudents().filter((s) => s.roomId !== id)
  setItems(STORAGE_KEYS.students, students)
  const schedules = getSchedules().filter((s) => s.roomId !== id)
  setItems(STORAGE_KEYS.schedules, schedules)
}

// Students
export function getStudents(): Student[] {
  return getItems<Student>(STORAGE_KEYS.students)
}

export function getStudentsByRoom(roomId: string): Student[] {
  return getStudents().filter((s) => s.roomId === roomId)
}

export function createStudent(
  data: Omit<Student, "id" | "createdAt">
): Student {
  const students = getStudents()
  const student: Student = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.students, [...students, student])
  return student
}

export function updateStudent(
  id: string,
  data: Partial<Omit<Student, "id" | "createdAt">>
): Student | undefined {
  const students = getStudents()
  const index = students.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  students[index] = { ...students[index], ...data }
  setItems(STORAGE_KEYS.students, students)
  return students[index]
}

export function deleteStudent(id: string): void {
  const students = getStudents().filter((s) => s.id !== id)
  setItems(STORAGE_KEYS.students, students)
}

// Schedules
export function getSchedules(): Schedule[] {
  return getItems<Schedule>(STORAGE_KEYS.schedules)
}

export function getSchedulesByClass(classId: string): Schedule[] {
  return getSchedules().filter((s) => s.classId === classId)
}

export function getSchedulesByRoom(roomId: string): Schedule[] {
  return getSchedules().filter((s) => s.roomId === roomId)
}

export function createSchedule(
  data: Omit<Schedule, "id">
): Schedule {
  const schedules = getSchedules()
  const schedule: Schedule = {
    ...data,
    id: generateId(),
  }
  setItems(STORAGE_KEYS.schedules, [...schedules, schedule])
  return schedule
}

export function updateSchedule(
  id: string,
  data: Partial<Omit<Schedule, "id">>
): Schedule | undefined {
  const schedules = getSchedules()
  const index = schedules.findIndex((s) => s.id === id)
  if (index === -1) return undefined
  schedules[index] = { ...schedules[index], ...data }
  setItems(STORAGE_KEYS.schedules, schedules)
  return schedules[index]
}

export function deleteSchedule(id: string): void {
  const schedules = getSchedules().filter((s) => s.id !== id)
  setItems(STORAGE_KEYS.schedules, schedules)
}

// Segment Configs
export function getSegmentConfigs(schoolId: string): SegmentConfig[] {
  return getItems<SegmentConfig>(STORAGE_KEYS.segmentConfigs).filter(
    (s) => s.schoolId === schoolId
  )
}

export function getSegmentConfig(
  schoolId: string,
  segmentName: string
): SegmentConfig | undefined {
  return getItems<SegmentConfig>(STORAGE_KEYS.segmentConfigs).find(
    (s) => s.schoolId === schoolId && s.segmentName === segmentName
  )
}

export function upsertSegmentConfig(
  schoolId: string,
  segmentName: string,
  data: { tapetes: number; kits: number },
  year: string
): SegmentConfig {
  const all = getItems<SegmentConfig>(STORAGE_KEYS.segmentConfigs)
  const existing = all.find(
    (s) => s.schoolId === schoolId && s.segmentName === segmentName && s.year === year
  )
  if (existing) {
    const updated = { ...existing, ...data }
    const index = all.findIndex((s) => s.id === existing.id)
    all[index] = updated
    setItems(STORAGE_KEYS.segmentConfigs, all)
    return updated
  }
  const config: SegmentConfig = {
    id: generateId(),
    schoolId,
    segmentName,
    tapetes: data.tapetes,
    kits: data.kits,
    year,
  }
  setItems(STORAGE_KEYS.segmentConfigs, [...all, config])
  return config
}

export function deleteSegmentConfig(id: string): void {
  const all = getItems<SegmentConfig>(STORAGE_KEYS.segmentConfigs).filter(
    (s) => s.id !== id
  )
  setItems(STORAGE_KEYS.segmentConfigs, all)
}

export function deleteSegmentConfigsBySchool(schoolId: string): void {
  const all = getItems<SegmentConfig>(STORAGE_KEYS.segmentConfigs).filter(
    (s) => s.schoolId !== schoolId
  )
  setItems(STORAGE_KEYS.segmentConfigs, all)
}

// Items
export function getAllItems(): Item[] {
  return getItems<Item>(STORAGE_KEYS.items)
}

export function getItem(id: string): Item | undefined {
  return getItems<Item>(STORAGE_KEYS.items).find((i) => i.id === id)
}

export function createItem(
  data: Omit<Item, "id" | "createdAt">
): Item {
  const items = getItems<Item>(STORAGE_KEYS.items)
  const item: Item = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.items, [...items, item])
  return item
}

export function updateItem(
  id: string,
  data: Partial<Omit<Item, "id" | "createdAt">>
): Item | undefined {
  const items = getItems<Item>(STORAGE_KEYS.items)
  const index = items.findIndex((i) => i.id === id)
  if (index === -1) return undefined
  items[index] = { ...items[index], ...data }
  setItems(STORAGE_KEYS.items, items)
  return items[index]
}

export function deleteItem(id: string): void {
  const items = getItems<Item>(STORAGE_KEYS.items).filter((i) => i.id !== id)
  setItems(STORAGE_KEYS.items, items)
  const napItems = getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.itemId !== id
  )
  setItems(STORAGE_KEYS.napItems, napItems)
}

// Nap Items
export function getNapItems(schoolId: string): NapItem[] {
  return getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.schoolId === schoolId
  )
}

export function getAllNapItems(): NapItem[] {
  return getItems<NapItem>(STORAGE_KEYS.napItems)
}

export function getNapItemsBySchoolAndYear(schoolId: string, year: string): NapItem[] {
  return getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.schoolId === schoolId && n.year === year
  )
}

export function getNapItemsBySegment(
  schoolId: string,
  segmentName: string,
  year?: string
): NapItem[] {
  let items = getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.schoolId === schoolId && n.segmentName === segmentName
  )
  if (year) {
    items = items.filter((n) => n.year === year)
  }
  return items
}

export function upsertNapItem(
  schoolId: string,
  segmentName: string,
  itemId: string,
  quantity: number,
  year: string
): NapItem {
  const all = getItems<NapItem>(STORAGE_KEYS.napItems)
  const existing = all.find(
    (n) =>
      n.schoolId === schoolId &&
      n.segmentName === segmentName &&
      n.itemId === itemId &&
      n.year === year
  )
  if (existing) {
    const updated = { ...existing, quantity }
    const index = all.findIndex((n) => n.id === existing.id)
    all[index] = updated
    setItems(STORAGE_KEYS.napItems, all)
    return updated
  }
  const napItem: NapItem = {
    id: generateId(),
    schoolId,
    segmentName,
    itemId,
    quantity,
    year,
  }
  setItems(STORAGE_KEYS.napItems, [...all, napItem])
  return napItem
}

export function deleteNapItem(id: string): void {
  const all = getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.id !== id
  )
  setItems(STORAGE_KEYS.napItems, all)
}

export function deleteNapItemsBySchool(schoolId: string): void {
  const all = getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.schoolId !== schoolId
  )
  setItems(STORAGE_KEYS.napItems, all)
}

export function deleteNapItemsBySchoolAndYear(schoolId: string, year: string): void {
  const all = getItems<NapItem>(STORAGE_KEYS.napItems).filter(
    (n) => n.schoolId !== schoolId || n.year !== year
  )
  setItems(STORAGE_KEYS.napItems, all)
}

// Orientadores
export function getOrientadores(): Orientador[] {
  return getItems<Orientador>(STORAGE_KEYS.orientadores)
}

export function getOrientador(id: string): Orientador | undefined {
  return getOrientadores().find((o) => o.id === id)
}

export function createOrientador(
  data: Omit<Orientador, "id" | "createdAt">
): Orientador {
  const orientadores = getOrientadores()
  const orientador: Orientador = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.orientadores, [...orientadores, orientador])
  return orientador
}

export function updateOrientador(
  id: string,
  data: Partial<Omit<Orientador, "id" | "createdAt">>
): Orientador | undefined {
  const orientadores = getOrientadores()
  const index = orientadores.findIndex((o) => o.id === id)
  if (index === -1) return undefined
  orientadores[index] = { ...orientadores[index], ...data }
  setItems(STORAGE_KEYS.orientadores, orientadores)
  return orientadores[index]
}

export function deleteOrientador(id: string): void {
  const orientadores = getOrientadores().filter((o) => o.id !== id)
  setItems(STORAGE_KEYS.orientadores, orientadores)
  const schools = getSchools().map((s) =>
    s.orientadorId === id ? { ...s, orientadorId: undefined } : s
  )
  setItems(STORAGE_KEYS.schools, schools)
}

// TBR Categories
export function getTbrCategories(): TbrCategory[] {
  return getItems<TbrCategory>(STORAGE_KEYS.tbrCategories)
}

export function getTbrCategory(id: string): TbrCategory | undefined {
  return getTbrCategories().find((c) => c.id === id)
}

export function createTbrCategory(
  data: Omit<TbrCategory, "id" | "createdAt">
): TbrCategory {
  const categories = getTbrCategories()
  const category: TbrCategory = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.tbrCategories, [...categories, category])
  return category
}

export function updateTbrCategory(
  id: string,
  data: Partial<Omit<TbrCategory, "id" | "createdAt">>
): TbrCategory | undefined {
  const categories = getTbrCategories()
  const index = categories.findIndex((c) => c.id === id)
  if (index === -1) return undefined
  categories[index] = { ...categories[index], ...data }
  setItems(STORAGE_KEYS.tbrCategories, categories)
  return categories[index]
}

export function deleteTbrCategory(id: string): void {
  const categories = getTbrCategories().filter((c) => c.id !== id)
  setItems(STORAGE_KEYS.tbrCategories, categories)
  const teams = getAllTbrTeams().filter((t) => t.categoryId !== id)
  setItems(STORAGE_KEYS.tbrTeams, teams)
}

// TBR Teams
export function getAllTbrTeams(): TbrTeam[] {
  return getItems<TbrTeam>(STORAGE_KEYS.tbrTeams)
}

export function getTbrTeamsBySchool(schoolId: string): TbrTeam[] {
  return getAllTbrTeams().filter((t) => t.schoolId === schoolId)
}

export function getTbrTeamsByCategory(categoryId: string): TbrTeam[] {
  return getAllTbrTeams().filter((t) => t.categoryId === categoryId)
}

export function createTbrTeam(
  data: Omit<TbrTeam, "id" | "createdAt">
): TbrTeam {
  const teams = getAllTbrTeams()
  const team: TbrTeam = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  setItems(STORAGE_KEYS.tbrTeams, [...teams, team])
  return team
}

export function deleteTbrTeam(id: string): void {
  const teams = getAllTbrTeams().filter((t) => t.id !== id)
  setItems(STORAGE_KEYS.tbrTeams, teams)
}

export function deleteTbrTeamsBySchool(schoolId: string): void {
  const teams = getAllTbrTeams().filter((t) => t.schoolId !== schoolId)
  setItems(STORAGE_KEYS.tbrTeams, teams)
}

export function replaceTbrTeamsForSchool(
  schoolId: string,
  teams: { categoryId: string; name: string }[]
): void {
  const others = getAllTbrTeams().filter((t) => t.schoolId !== schoolId)
  const newTeams: TbrTeam[] = teams.map((t) => ({
    id: generateId(),
    schoolId,
    categoryId: t.categoryId,
    name: t.name,
    createdAt: new Date().toISOString(),
  }))
  setItems(STORAGE_KEYS.tbrTeams, [...others, ...newTeams])
}
