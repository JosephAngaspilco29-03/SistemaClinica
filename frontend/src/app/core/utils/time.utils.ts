export function getTurno(horaInicio: string): string {
  if (!horaInicio) return '';
  const hourStr = horaInicio.split(':')[0];
  const hour = parseInt(hourStr, 10);
  
  if (hour >= 6 && hour < 12) {
    return 'TURNO MAÑANA';
  } else if (hour >= 12 && hour < 19) {
    return 'TURNO TARDE';
  } else {
    return 'TURNO NOCHE';
  }
}

export function formatTime(time: string): string {
  if (!time) return '';
  const parts = time.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const hoursStr = hours < 10 ? '0' + hours : hours.toString();
  
  return `${hoursStr}:${minutes} ${ampm}`;
}
