"use server"

import {
  Config,
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
import { Client, createClient } from "@libsql/client"
import Database$1, { Database } from "better-sqlite3"

const config = JSON.parse(
  await readFile(path.join(process.cwd(), "app", "config.json"), "utf8"),
)

// local db for testing
// const db = openDb(config)

const url = "file:local-gtfs.db" // Local file node-gtfs will use
const syncUrl =
  "libsql://database-bistre-queen-vercel-icfg-e5cmrhuhyibttfno8xpw3jtb.aws-us-east-1.turso.io"
const authToken =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUyMzg1OTMsImlkIjoiMDE5ZDU0NGMtMDkwMS03MjE4LTk2YzctMWI5OWY0NzUyM2VkIiwicmlkIjoiNWNmYjM3OGQtNmFlNS00MDIzLTkxNzItMzhiMDc1YWFhNzQ1In0.f4WcHheb11lcJeLEfrtTxVKaiDZLe2WpqEbIx7PI2xHfnsl1fdXU-eOfXMaR_vLQNsuuKifXlxrOtPXJy_C4AA"

// const db = createClient({
//   url: "libsql://gtfs-data-enigmatic-gemini-fm.aws-us-east-1.turso.io",
//   authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzUyMzY3MjAsImlkIjoiMDE5ZDU0NWEtN2UwMS03OTgxLWJkN2MtZjRiYjMzZjhjYWM0IiwicmlkIjoiMmVlZjkyNDAtZjUyMy00N2M1LWE4NjktZTU2Mzc5ODhiOTI2In0.vDr0oOc5u0eMIGZSCNZFbYHo_gUZIYdFDB8w7FbyfOclVsRAEtdn2DNmklEt8GEx4Ogi92apx0k-29L26BNIBw"
// });

async function setupGtfsSync(): Promise<Client> {
  // 2. Create the LibSQL client with sync capabilities
  const client = createClient({
    url,
    syncUrl,
    authToken,
    syncInterval: 60, // Auto-sync every 60 seconds
  })

  // 3. Perform an initial manual sync to pull existing data from Turso
  await client.sync()

  // 4. Configure node-gtfs to use the local replica file
  // node-gtfs expects a standard SQLite file path
  console.log("openDB")
  openDb({
    sqlitePath: "./local-gtfs.db",
    // agencies: [{
    //   agency_key: "my-transit",
    //   path: "./path-to-gtfs.zip" // Only needed if importing for the first time
    // }]
  })

  console.log("Embedded replica ready and syncing.")
  return client
}

const db = await setupGtfsSync()
  .then((client) => {
    console.log("init db")
    initGtfsData()
    console.log("db inited")
  })
  .catch(console.error)

console.log("db typeof: ", typeof db)
// if (typeof db === "Client") {
//   console.log()
// }

export async function initGtfsData(db?: Database) {
  const config: Config = {
    agencies: [
      {
        path: "./public/google_transit",
        exclude: ["shapes"],
        realtimeAlerts: {
          url: "https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey=Z4xVgEKed8zNuzLKyFIZ",
        },
        realtimeTripUpdates: {
          url: "https://gtfsapi.translink.ca/v3/gtfsposition?apikey=Z4xVgEKed8zNuzLKyFIZ",
        },
        realtimeVehiclePositions: {
          url: "https://gtfsapi.translink.ca/v3/gtfsalerts?apikey=Z4xVgEKed8zNuzLKyFIZ",
        },
      },
    ],
    ignoreDuplicates: true,
    sqlitePath: "./local-gtfs.db",
    // db: db,
  }

  try {
    const importReport = await importGtfs(config)
  } catch (error) {
    console.error(error)
  }
}

export async function updateGtfsRealtimeData() {
  await updateGtfsRealtime(config)
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
