export function formatDistance(meters) {
  if (
    meters === null ||
    meters === undefined ||
    !isFinite(meters) ||
    meters < 0 ||
    meters === Infinity
  ) {
    return "-";
  }

  const roundedMetersTotal = Math.round(meters);

  if (roundedMetersTotal < 1000) {
    return `${roundedMetersTotal} m`;
  } else {
    const kilometers = Math.floor(roundedMetersTotal / 1000);
    const remainingMeters = roundedMetersTotal % 1000;

    let result = `${kilometers}km`;

    if (remainingMeters > 0) {
      result += ` ${remainingMeters}m`;
    }
    return result;
  }
}

export function formatDurationMs(ms) {
  if (ms === null || ms === undefined || !isFinite(ms) || ms < 0) {
    return "-";
  }

  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds < 60 && totalSeconds > 0) {
    return "<1m";
  }

  const totalMinutes = Math.floor(totalSeconds / 60);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let result = "";

  if (hours > 0) {
    result += `${hours}hr`;
  }

  if (minutes > 0) {
    if (result.length > 0) {
      result += " ";
    }
    result += `${minutes}m`;
  }

  return result;
}
