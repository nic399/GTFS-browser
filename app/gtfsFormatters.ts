import { Route, Stop } from "gtfs"
import GtfsRealtimeBindings from "gtfs-realtime-bindings"

export function alertCauseDescription(
  cause: GtfsRealtimeBindings.transit_realtime.Alert.Cause,
) {
  switch (cause) {
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.UNKNOWN_CAUSE:
      return "Unknown cause"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.OTHER_CAUSE:
      return "Other cause"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.TECHNICAL_PROBLEM:
      return "Technical problem"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.STRIKE:
      return "Strike"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.DEMONSTRATION:
      return "Demonstration"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.ACCIDENT:
      return "Accident"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.HOLIDAY:
      return "Holiday"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.WEATHER:
      return "Weather"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.MAINTENANCE:
      return "Maintenance"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.CONSTRUCTION:
      return "Construction"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.POLICE_ACTIVITY:
      return "Police activity"
    case GtfsRealtimeBindings.transit_realtime.Alert.Cause.MEDICAL_EMERGENCY:
      return "Medical emergency"
    default:
      return "Unspecified"
  }
}

export function alertEffectDescription(
  effect: GtfsRealtimeBindings.transit_realtime.Alert.Effect,
) {
  switch (effect) {
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.NO_SERVICE:
      return "No service"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.REDUCED_SERVICE:
      return "Reduced service"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.SIGNIFICANT_DELAYS:
      return "Significant delays"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.DETOUR:
      return "Detour"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.ADDITIONAL_SERVICE:
      return "Additional service"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.MODIFIED_SERVICE:
      return "Modified service"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.OTHER_EFFECT:
      return "Other effect"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.UNKNOWN_EFFECT:
      return "Unknown effect"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.STOP_MOVED:
      return "Stop moved"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.NO_EFFECT:
      return "No effect"
    case GtfsRealtimeBindings.transit_realtime.Alert.Effect.ACCESSIBILITY_ISSUE:
      return "Accessibility issue"
    default:
      return "Unspecified"
  }
}

export function alertSeverityDescription(
  severity: GtfsRealtimeBindings.transit_realtime.Alert.SeverityLevel,
) {
  switch (severity) {
    case GtfsRealtimeBindings.transit_realtime.Alert.SeverityLevel
      .UNKNOWN_SEVERITY:
      return "Unknown severity"
    case GtfsRealtimeBindings.transit_realtime.Alert.SeverityLevel.INFO:
      return "Info"
    case GtfsRealtimeBindings.transit_realtime.Alert.SeverityLevel.WARNING:
      return "Warning"
    case GtfsRealtimeBindings.transit_realtime.Alert.SeverityLevel.SEVERE:
      return "Severe"
    default:
      return "Unspecified"
  }
}

// Convert any GTFS time (HH:mm:ss format) to a Date object, HH may be greater than 24
export function parseGtfsTimeToDate(gtfsTime: string): Date {
  const [hh, mm, ss] = gtfsTime.split(":").map(Number)
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setHours(hh, mm, ss)
  return date
}

export function formatDateToGtfsTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

export function formatRouteName(route: Route): string {
  return `${route.route_short_name ? route.route_short_name + " - " : ""}${route.route_long_name}`
}

export function formatStopName(stop: Stop): string {
  return `${stop.stop_code} - ${stop.stop_name}`
}
