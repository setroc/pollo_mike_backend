export interface IOrder {
  id: number;
  clientName: string;
  number: number;
  total: number;
  date: string;
  state: number;
  products: IProducInOrder[];
}

export interface IProducInOrder {
  id: number;
  title: string;
  price: number;
  description: string;
  stepQuantity: number;
  type: string;
  quantity: number;
  imgName: string;
}