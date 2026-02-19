// Datos de entrega requeridos al confirmar un pedido
export interface OrderFormDetails {
  calle: string;
  numero: string;
  piso?: string;
  puerta?: string;
  codigo_postal: string;
  ciudad: string;
  provincia: string;
  observaciones?: string;
}