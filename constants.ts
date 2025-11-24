
import { QuickTransactionTemplate } from './types';

export const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const INCOME_TEMPLATES: QuickTransactionTemplate[] = [
  { id: 'salario_andre', name: 'SALÁRIO ANDRÉ', category: 'Salário', defaultAmount: 2664.00 },
  { id: 'receita_kitnets', name: 'RECEITA DAS KITNETS', category: 'Investimento', defaultAmount: 2379.53 },
  { id: 'receita_mari', name: 'RECEITA MARI', category: 'Outros', defaultAmount: 510.00 }
];

export const EXPENSE_TEMPLATES: QuickTransactionTemplate[] = [
  { id: 'fundo_area_comum', name: 'FUNDO AREA COMUM', category: 'Moradia', defaultAmount: 20.00 },
  { id: 'taxa_associacao', name: 'TAXA ASSOCIAÇÃO', category: 'Moradia', defaultAmount: 100.00 },
  { id: 'energia', name: 'ENERGIA', category: 'Moradia', defaultAmount: 227.68 },
  { id: 'internet', name: 'INTERNET', category: 'Moradia', defaultAmount: 109.99 },
  { id: 'vivo', name: 'VIVO', category: 'Telefone', defaultAmount: 59.00 },
  { id: 'convenio_enzo', name: 'CONVENIO ENZO', category: 'Saúde', defaultAmount: 280.22 },
  { id: 'shopee', name: 'SHOPEE 02/06', category: 'Compras', defaultAmount: 169.92 },
  { id: 'seguro_fianca', name: 'SEGURO FIANÇA', category: 'Moradia', defaultAmount: 129.51 },
  { id: 'seguro_fianca_victor', name: 'SEGURO FIANÇA - VICTOR', category: 'Moradia', defaultAmount: 129.53 },
  { id: 'seguro_fianca_alexandro', name: 'SEGURO FIANÇA - ALEXANDRO', category: 'Moradia', defaultAmount: 117.02 },
  { id: 'seguro_moto', name: 'SEGURO DA MOTO', category: 'Transporte', defaultAmount: 214.00 },
  { id: 'mei', name: 'MEI', category: 'Impostos', defaultAmount: 76.90 },
  { id: 'remedio_andre', name: 'REMEDIO ANDRE', category: 'Saúde', defaultAmount: 199.00 },
  { id: 'escolinha_enzo', name: 'ESCOLINHA DO ENZO', category: 'Educação', defaultAmount: 119.00 },
  { id: 'gasolina_carro', name: 'GASOLINA CARRO', category: 'Transporte', defaultAmount: 253.00 },
  { id: 'gasolina_moto', name: 'GASOLINA MOTO', category: 'Transporte', defaultAmount: 150.00 },
  { id: 'tevezinha', name: 'TEVEZINHA', category: 'Lazer', defaultAmount: 30.00 },
  { id: 'seu_leandro', name: 'SEU LEANDRO - 05/12', category: 'Serviços', defaultAmount: 38.00 },
  { id: 'material_construcao', name: 'MATERIAL CONSTRUÇÃO', category: 'Moradia', defaultAmount: 1100.00 },
  { id: 'churrasco', name: 'CHURRASCO/DIVERSÃO', category: 'Lazer', defaultAmount: 250.00 }
];
