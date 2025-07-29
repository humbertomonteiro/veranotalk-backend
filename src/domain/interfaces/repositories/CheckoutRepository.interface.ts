import { Checkout, CheckoutProps } from "../../entities";

export interface CheckoutRepository {
  save(checkout: Checkout): Promise<string>;
  findById(id: string): Promise<Checkout | null>;
  findByOrderId(orderId: string): Promise<Checkout | null>;
  findByMercadoPagoId(mercadoPagoId: string): Promise<Checkout | null>;
  findByEventId(eventId: string): Promise<Checkout[]>;
  findByStatus(status: CheckoutProps["status"]): Promise<Checkout[]>;
  update(checkout: Checkout): Promise<void>;
  delete(id: string): Promise<void>;
}
