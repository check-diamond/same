import type { Venda } from './Venda';

export interface DataState {
  vendas: Venda[];
  deleteVenda?: (id: string) => void;
}
