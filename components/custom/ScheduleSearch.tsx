"use client"

import { CSSProperties, Key, use, useEffect, useState } from "react"
import { Route, Stop, StopTime } from "gtfs"
import { Button, Flex, Select, Typography } from "antd"
import { DefaultOptionType } from "antd/es/select"
import {
  getAllStopsForRouteID,
  getStopTimesForStopID,
} from "@/app/gtfsActions"
import { ScheduleInfo } from "./ScheduleInfo"
import { formatRouteName, formatStopName } from "@/app/gtfsFormatters"

type RouteSelectItem = Route & DefaultOptionType
type StopSeletItem = Stop & DefaultOptionType
type RoutesSelectProps = {
  allRouteData: Promise<RouteSelectItem[]>
  allStopData: Promise<StopSeletItem[]>
}

const selectStyles: CSSProperties = {
  width: "100%",
}

const selectContainerStyles: CSSProperties = {
  flex: "1 1 0",
  minWidth: 350,
}

const buttonStyles: CSSProperties = {
  width: 180,
}

export function ScheduleSearch({
  allRouteData,
  allStopData,
}: RoutesSelectProps) {
  // All available routes and stops
  const allRoutes = use(allRouteData)
  const allStops = use(allStopData)

  const [stopTimes, setStopTimes] = useState<StopTime[]>([])

  // Subsets of routes and stops, sourced from server actions that query based on specific route/stop IDs
  const [filteredRoutes, setFilteredRoutes] = useState<RouteSelectItem[]>([])
  const [filteredStops, setFilteredStops] = useState<StopSeletItem[]>([])

  const [selectedRoute, _setSelectedRoute] = useState<Route>()
  const setSelectedRoute = (id: Key | null) => {
    const newRoute = allRoutes.find((route) => route.route_id === id) as Route
    _setSelectedRoute(newRoute)
    setSelectedStop(null)
    getStopsForRoute(newRoute)
  }

  const [selectedStop, _setSelectedStop] = useState<Stop>()
  const setSelectedStop = (id: Key | null) => {
    const newStop = allStops.find((stop) => stop.stop_id === id)
    _setSelectedStop(newStop as Stop)
  }

  useEffect(() => {
    if (selectedStop) {
      getStopTimes()
    }
  }, [selectedStop])

  const getStopsForRoute = (route?: Route) => {
    if (route) {
      getAllStopsForRouteID(route.route_id).then((res) => {
        setFilteredStops(res)
      })
    } else {
      setFilteredStops([])
    }
  }

  // Data needs transforming to meet expected shape for the components
  const routeData = () => {
    return allRoutes.map((route) => {
      return {
        ...route,
        value: route.route_id,
        label: formatRouteName(route),
      }
    })
  }

  const stopData = () => {
    return (selectedRoute ? filteredStops : allStops).map((stop) => {
      return {
        ...stop,
        value: stop.stop_id,
        label: formatStopName(stop),
      }
    })
  }

  const clearAll = () => {
    setSelectedRoute(null)
    setSelectedStop(null)
    setFilteredRoutes([])
    setFilteredStops([])
    setStopTimes([])
  }

  const getStopTimes = () => {
    if (selectedStop) {
      getStopTimesForStopID(selectedStop.stop_id).then((res) => {
        setStopTimes(res)
      })
    }
  }

  return (
    <Flex vertical justify="center" align="stretch" gap={20}>
      <Flex vertical>
        <Typography.Title>Translink Data API</Typography.Title>
        <Flex>
          <Typography.Text>
            Search for the next arrival times for any transit service provided by
          Translink. Select a route and then the stop to view all upcoming
          arrivals. Type to search for the specific route or stop.
            </Typography.Text>
        </Flex>
      </Flex>
      <Flex wrap gap={16} style={{ width: "100%", marginTop: 20 }}>
        <div style={selectContainerStyles} className="selectContainerWrap">
          <Select
            showSearch={{ optionFilterProp: "label" }}
            style={selectStyles}
            options={routeData()}
            placeholder={"Select a route"}
            value={selectedRoute?.route_id}
            onChange={(val) => {
              setSelectedRoute(val)
            }}
          />
        </div>
        <div style={selectContainerStyles} className="selectContainerWrap">
          <Select
            showSearch={{ optionFilterProp: "label" }}
            style={selectStyles}
            options={stopData()}
            disabled={!selectedRoute}
            placeholder={
              !selectedRoute ? "Select a route first" : "Select a stop"
            }
            value={selectedStop?.stop_id}
            onChange={(val) => {
              setSelectedStop(val)
              getStopTimes()
            }}
          />
        </div>
        <Button
          disabled={!selectedRoute}
          style={buttonStyles}
          onClick={clearAll}
        >
          Clear
        </Button>
      </Flex>
      <Flex vertical>
        <ScheduleInfo
          data={stopTimes}
          route={selectedRoute}
          stop={selectedStop}
        />
      </Flex>
    </Flex>
  )
}
