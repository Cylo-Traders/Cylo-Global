export interface IProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  unit: string;
  category: string;
  rating: number;
  isAvailable: boolean;
  stockQuantity: number;
  farmer: IFarmer;
  currency: "STRK" | "USDC";
}

export interface IFarmer {
  wallet: string;
  displayName: string;
  username: string;
  avatar: string;
  bio: string;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  totalOrders: number;
  joinedAt: string;
}

export interface ICartItem extends IProduct {
  quantity: number;
}

export interface IOrder {
  id: string;
  onChainOrderId: number;
  buyer: string;
  farmer: string;
  farmerName: string;
  token: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  status: OrderStatus;
  items: IOrderItem[];
  createdAt: string;
  expiresAt: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  image: string;
}

export type OrderStatus = "pending" | "completed" | "refunded";

export type UserRole = "farmer" | "buyer";

export interface IProfile {
  wallet: string;
  role: UserRole;
  displayName: string;
  bio: string;
  avatar: string;
  createdAt: string;
}

export interface ILocation {
  wallet: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  isPublic: boolean;
}

export interface INotification {
  id: string;
  type: "order_created" | "order_confirmed" | "order_refunded";
  message: string;
  read: boolean;
  createdAt: string;
}
