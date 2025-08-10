// getClassIntervalString.js
export function getClassIntervalString(row) {
  return row.classInterval || row.ciStr || row.ci || row.interval || "";
}
