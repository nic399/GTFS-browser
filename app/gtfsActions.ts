"use server"

import {
  getRoutes,
  getStops,
  getStoptimes,
  importGtfs,
  openDb,
  Stop,
  StopTime,
  updateGtfsRealtime,
} from "gtfs"
import { readFile } from "fs/promises"
import path from "node:path"
import { formatDateToGtfsTime } from "./gtfsFormatters"

const config = JSON.parse(
  await readFile(path.join(process.cwd(), "app", "config.json"), "utf8"),
)

const db = openDb(config)

export async function initGtfsData() {
  try {
    const importReport = await importGtfs(config)
  } catch (error) {
    console.error(error)
  }
}

export async function updateGtfsRealtimeData() {
  // await updateGtfsRealtime(config)
}

let realtimeUpdateTimer: NodeJS.Timeout | null = null

export async function startGtfsRealtimePolling() {
  if (realtimeUpdateTimer) return

  void updateGtfsRealtimeData().catch((error) => {
    console.error("Initial GTFS realtime update failed:", error)
  })

  realtimeUpdateTimer = setInterval(
    () => {
      void updateGtfsRealtimeData().catch((error) => {
        console.error("Scheduled GTFS realtime update failed:", error)
      })
    },
    3 * 60 * 1000,
  )
}

export async function getAllRoutes() {
  const routes = getRoutes({}, [], [["route_short_name", "ASC"]])
  return routes
}

export async function getAllStops() {
  const stops = getStops()
  return stops
}

export async function getAllStopsForRouteID(routeID: string): Promise<Stop[]> {
  const stops = getStops({ route_id: routeID })
  return stops
}

// In order to get all the stop times for a stop_id, you must query the previous day as well
// since GTFS allows for stop times after midnight (i.e. greater than 24:00:00)
// e.g. 25:37:00 would be 1:37am on the following day but is only returned when querying for
// the current day (because why not make it more complicated)
export async function getStopTimesForStopID(
  stopID: string,
): Promise<StopTime[]> {
  const now = new Date()
  const year = now.getFullYear()
  // NOTE: don't adjust for month number wrap at the end of the year, since Date uses a zero
  // based index for the month numbers
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const currentDate = Number(`${year}${month}${day}`)

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayYear = yesterday.getFullYear()
  const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, "0")
  const yesterdayDay = String(yesterday.getDate()).padStart(2, "0")
  const yesterdayDate = Number(
    `${yesterdayYear}${yesterdayMonth}${yesterdayDay}`,
  )

  const startTime = formatDateToGtfsTime(now)
  const endTime = formatDateToGtfsTime(new Date(now.getTime() + 90 * 60 * 1000))

  const stoptimesToday = getStoptimes(
    {
      stop_id: stopID,
      date: currentDate,
      start_time: startTime,
      end_time: endTime,
    },
    undefined,
    [["arrival_time", "ASC"]],
  )
  const stoptimesYesterdayAfterMidnight = getStoptimes({
    stop_id: stopID,
    date: yesterdayDate,
    start_time: "24:00:00",
  })
  const mergedStoptimes = [
    ...stoptimesToday,
    ...stoptimesYesterdayAfterMidnight,
  ]

  return mergedStoptimes
}

// Disable for now, Translink suspended free access to most realtime updates
// export async function getAllStopsUpdates() {
//   const stops = getStopTimeUpdates()
//   const trips = getTripUpdates()
//   const alerts = getServiceAlerts()
//   const vehicles = getVehiclePositions()

//   return stops
// }
