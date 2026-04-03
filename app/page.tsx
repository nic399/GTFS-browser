import {
  getAllRoutes,
  getAllStops,
  startGtfsRealtimePolling,
} from "./gtfsActions"
import { ScheduleSearch } from "@/components/custom/ScheduleSearch"

export default async function Home() {
  startGtfsRealtimePolling()

  const routes = getAllRoutes()
  const stops = getAllStops()

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-6xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div style={{ width: "100%" }}>
          <ScheduleSearch allRouteData={routes} allStopData={stops} />
        </div>
      </main>
    </div>
  )
}
