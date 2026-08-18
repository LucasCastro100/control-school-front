// Re-exports from all domain modules
export { generateId, toCamel, toSnake } from "./helpers"
export { login, logout, getAuthUser, getSession } from "./auth"
export { getUsers, getUsersByRole, getUser, createUser, updateUser, deleteUser, getSchoolsByUser, getUsersBySchool, addUserSchool, removeUserSchool, replaceUserSchools } from "./users"
export { getSchools, getSchoolsByYear, getSchoolYears, getAcademicYears, getSchool, createSchool, updateSchool, deleteSchool } from "./schools"
export { getClasses, getClassesBySchool, getClass, getClassesBySchoolAndYear, createClass, updateClass, deleteClass } from "./classes"
export { getRooms, getRoomsByClass, getRoom, createRoom, updateRoom, deleteRoom } from "./rooms"
export { getStudents, getStudentsByRoom, createStudent, updateStudent, deleteStudent } from "./students"
export { getSchedules, getSchedulesByClass, getSchedulesByRoom, createSchedule, updateSchedule, deleteSchedule } from "./schedules"
export { getOrientadorSchedules, getOrientadorSchedulesBySchool, createOrientadorSchedule, updateOrientadorSchedule, deleteOrientadorSchedule, deleteOrientadorSchedulesBySchool } from "./orientador-schedules"
export { getSegmentConfigs, getSegmentConfigsAll, getSegmentConfig, upsertSegmentConfig, deleteSegmentConfig, deleteSegmentConfigsBySchool } from "./segment-configs"
export { getAllItems, getItem, createItem, updateItem, deleteItem } from "./items"
export { getNapItems, getAllNapItems, getNapItemsBySchoolAndYear, getNapItemsBySegment, upsertNapItem, deleteNapItem, deleteNapItemsBySchool, deleteNapItemsBySchoolAndYear } from "./nap-items"
export { getAgendaItems, getAgendaItemsByOrientador, getAgendaItem, createAgendaItem, updateAgendaItem, deleteAgendaItem } from "./agenda"
export { getTbrCategories, getTbrCategory, createTbrCategory, updateTbrCategory, deleteTbrCategory, getAllTbrTeams, getTbrTeamsBySchool, getTbrTeamsByCategory, createTbrTeam, deleteTbrTeam, deleteTbrTeamsBySchool, replaceTbrTeamsForSchool } from "./tbr"

// Storage init (no-op with Supabase)
export function initStorage(): void {}

// Export/Import
import { getSchools } from "./schools"
import { getClasses } from "./classes"
import { getRooms } from "./rooms"
import { getStudents } from "./students"
import { getSchedules } from "./schedules"
import { getOrientadorSchedules } from "./orientador-schedules"
import { getSegmentConfigsAll } from "./segment-configs"
import { getAllItems } from "./items"
import { getAllNapItems } from "./nap-items"
import { getUsers } from "./users"
import { getAgendaItems } from "./agenda"
import { getTbrCategories, getAllTbrTeams } from "./tbr"
import { createClient } from "@/utils/supabase/client"
const supabase = createClient()
import { toSnake } from "./helpers"

export async function exportStorageData(): Promise<Record<string, unknown[]>> {
  const [schools, classes, rooms, students, schedules, orientadorSchedules, segmentConfigs, items, napItems, users, agenda, tbrCategories, tbrTeams] = await Promise.all([
    getSchools(), getClasses(), getRooms(), getStudents(), getSchedules(),
    getOrientadorSchedules(), getSegmentConfigsAll(), getAllItems(), getAllNapItems(),
    getUsers(), getAgendaItems(), getTbrCategories(), getAllTbrTeams()
  ])
  return {
    "control-schools:schools": schools,
    "control-schools:classes": classes,
    "control-schools:rooms": rooms,
    "control-schools:students": students,
    "control-schools:schedules": schedules,
    "control-schools:orientador-schedules": orientadorSchedules,
    "control-schools:segment-configs": segmentConfigs,
    "control-schools:items": items,
    "control-schools:nap-items": napItems,
    "control-schools:users": users,
    "control-schools:agenda": agenda,
    "control-schools:tbr-categories": tbrCategories,
    "control-schools:tbr-teams": tbrTeams,
  }
}

export async function importStorageData(data: Record<string, unknown[]>): Promise<void> {
  const tableMap: Record<string, string> = {
    "control-schools:schools": "schools",
    "control-schools:classes": "classes",
    "control-schools:rooms": "rooms",
    "control-schools:students": "students",
    "control-schools:schedules": "schedules",
    "control-schools:orientador-schedules": "orientador_schedules",
    "control-schools:segment-configs": "segment_configs",
    "control-schools:items": "items",
    "control-schools:nap-items": "nap_items",
    "control-schools:users": "users",
    "control-schools:agenda": "agenda",
    "control-schools:tbr-categories": "tbr_categories",
    "control-schools:tbr-teams": "tbr_teams",
  }
  for (const [key, rows] of Object.entries(data)) {
    const table = tableMap[key]
    if (!table || !Array.isArray(rows)) continue
    const snakeRows = rows.map((r) => toSnake(r as Record<string, unknown>))
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    if (snakeRows.length > 0) {
      await supabase.from(table).insert(snakeRows)
    }
  }
}
