import { Table } from "antd"
import type { TableProps } from "antd"
import { Route, Stop, StopTime } from "gtfs"
import { formatRouteName, formatStopName } from "@/app/gtfsFormatters"

type ScheduleInfoProps = {
  data: StopTime[]
  route?: Route
  stop?: Stop
}

type StopTimeData = StopTime & {
  route: Route
  stop: Stop
}

const stopTimeColumns: TableProps<StopTimeData>["columns"] = [
  {
    title: "trip_id",
    dataIndex: "trip_id",
    key: "trip_id",
  },
  {
    title: "arrival_time",
    dataIndex: "arrival_time",
    key: "arrival_time",
  },
  {
    title: "Route",
    dataIndex: "route",
    key: "route.route_id",
    render: (_, record) => (formatRouteName(record.route))
  },
  {
    title: "Stop",
    dataIndex: "stop",
    key: "stop.stop_id",
    render: (_, record) => (formatStopName(record.stop))
  },
]

export function ScheduleInfo({ data, route, stop }: ScheduleInfoProps) {
  const stopTimeData = data
  
  const tableData =
    !route || !stop
      ? []
      : stopTimeData.map((val) => {
          return { ...val, route, stop }
        })

  return (
    <Table<StopTimeData> rowKey={(row) => row.trip_id} columns={stopTimeColumns} dataSource={tableData} />
  )
}
