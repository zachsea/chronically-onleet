export default function formatOffset(minutes: number) {
  const displayMinutes = minutes % 60;
  const hours = Math.floor(minutes / 60);
  return `+${String(hours).padStart(2, "0")}h ${String(displayMinutes).padStart(2, "0")}m`;
}
