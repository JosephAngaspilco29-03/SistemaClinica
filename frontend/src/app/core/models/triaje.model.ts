export interface Triaje {
  id: number;
  citaId: number;
  presionSistolica: number;
  presionDiastolica: number;
  temperatura: number;
  frecuenciaCardiaca: number;
  peso: number;
  talla: number;
  imc: number;
  fechaRegistro: string;
  observaciones: string;
}

export interface CrearTriajeDto {
  citaId: number;
  presionSistolica: number;
  presionDiastolica: number;
  temperatura: number;
  frecuenciaCardiaca: number;
  peso: number;
  talla: number;
  observaciones: string;
}

export interface ActualizarTriajeDto {
  presionSistolica: number;
  presionDiastolica: number;
  temperatura: number;
  frecuenciaCardiaca: number;
  peso: number;
  talla: number;
  observaciones: string;
}
