// calculations.js

export function calculateAvailableTime(timeDifference, unavailableTime) {
  return timeDifference ? timeDifference - unavailableTime : 0;
}

export function calculateNet(qty, rejectQty, nominalSpeed) {
  const net = ((qty - rejectQty) / nominalSpeed) * 60;
  return { net, netDisplay: net.toFixed(2) };
}

export function calculateProduction(net, durationSums, speedLoss, qualityLoss) {
  const production =
    parseFloat(net) +
    durationSums.UnplannedStoppages +
    parseFloat(speedLoss) +
    parseFloat(qualityLoss);
  return { production, productionDisplay: production.toFixed(2) };
}

export function calculateRunning(net, speedLoss, qualityLoss) {
  const running =
    parseFloat(net) + parseFloat(speedLoss) + parseFloat(qualityLoss);
  return { running, runningDisplay: running.toFixed(2) };
}

export function calculateOperation(production, processWaiting) {
  const operation = production + processWaiting;
  return { operation, operationDisplay: operation.toFixed(2) };
}

export function calculateNReported(
  timeDifference,
  production,
  processWaiting,
  plannedStoppages,
  unavailableTime
) {
  const nReported =
    (timeDifference ?? 0) -
    (production ?? 0) -
    processWaiting -
    plannedStoppages -
    unavailableTime;
  return { nReported, nReportedDisplay: nReported.toFixed(2) };
}

export function calculateEstimated(unplannedStoppages, speedLoss, nReported) {
  const estimated =
    parseFloat(unplannedStoppages) +
    parseFloat(speedLoss) +
    parseFloat(nReported);
  return { estimated, estimatedDisplay: estimated.toFixed(2) };
}

export function calculatePercentages(
  availableTime,
  durationSums,
  production,
  running,
  qualityLoss,
  speedLoss
) {
  const plannedStop =
    availableTime > 0
      ? ((durationSums.PlannedStoppages / availableTime) * 100).toFixed(2)
      : 0.0;
  const percentBreakdown =
    production > 0
      ? ((durationSums.UnplannedStoppages / production) * 100).toFixed(2)
      : 0.0;
  const percentQualLoss =
    running > 0 ? ((qualityLoss / running) * 100).toFixed(2) : 0.0;
  const percentSpeedLoss =
    running > 0 ? ((speedLoss / running) * 100).toFixed(2) : 0.0;
  return { plannedStop, percentBreakdown, percentQualLoss, percentSpeedLoss };
}

export function calculateMtbf(production, unplannedStoppages) {
  return production > 0 && unplannedStoppages > 0
    ? (production / unplannedStoppages).toFixed(2)
    : 0.0;
}
