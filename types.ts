
export enum Category {
  ESSENTIALS = 'Essenciais',
  PERISHABLES = 'Perecíveis',
  PRODUCE = 'Hortifruti',
  CLEANING = 'Limpeza',
  PERSONAL_HYGIENE = 'Higiene Pessoal',
  MAINTENANCE = 'Manutenção',
  APPLIANCES = 'Eletrodomésticos'
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  currentPrice?: number;
  lastPurchased?: string;
  recurrenceDays?: number; // Days between purchases
  isStockLow?: boolean;
}

export interface PurchaseItem {
  name: string;
  price: number;
  quantity: number;
  category: Category;
}

export interface PurchaseLog {
  id: string;
  date: string;
  storeName: string;
  total: number;
  items: PurchaseItem[];
}

export interface PriceAlert {
  productName: string;
  oldPrice: number;
  newPrice: number;
  increasePercentage: number;
}

export interface PriceComparison {
  name: string;
  localPrice: number;
  onlinePrice: number;
  onlineStore: string;
  savingPotential: number;
}
