export interface Venda {
  id?: string;
  customerName?: string;
  quantidade?: number;
  data?: string;
  valor?: number;
  revendedor?: string;
  status?: 'pendente' | 'concluída' | 'cancelada';
}
