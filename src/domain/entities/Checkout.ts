export type CheckoutStatus =
  | "pending"
  | "processing"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled"
  | "failed";

export type Payer = {
  name: string;
  document: string;
};

export interface CheckoutProps {
  id?: string;
  totalAmount?: number | null;
  status: CheckoutStatus;
  paymentMethod?: string | null;
  payer?: Payer | null;
  mercadoPagoId?: string | null;
  mercadoPagoPreferenceId?: string | null;
  fullTickets: number;
  halfTickets: number;
  createdAt?: Date;
  updatedAt?: Date;
  couponCode?: string | null;
  discountAmount?: number | null;
  originalAmount?: number | null;
  metadata?: {
    error?: string;
    retryCount?: number;
    participantIds?: string[];
    eventId?: string;
    manualPayment?: boolean;
    processedBy?: string;
    ticketType?: string;
  };
}

export class Checkout {
  private readonly props: CheckoutProps;

  constructor(props: CheckoutProps) {
    this.props = {
      ...props,
      status: props.status ?? "pending",
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      couponCode: props.couponCode ?? null,
      discountAmount: props.discountAmount ?? null,
      originalAmount: props.originalAmount ?? null,
      metadata: {
        retryCount: 0,
        participantIds: [],
        ...props.metadata,
      },
    };

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (this.fullTickets <= 0 && this.halfTickets <= 0) {
      throw new CheckoutError("Tickets empty");
    }

    if (errors.length > 0) {
      throw new CheckoutError(errors.join(" | "));
    }
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get totalAmount(): number | null {
    return this.props.totalAmount || null;
  }

  get status(): CheckoutStatus {
    return this.props.status;
  }

  get paymentMethod(): string | null {
    return this.props.paymentMethod ?? null;
  }

  get mercadoPagoId(): string | null {
    return this.props.mercadoPagoId ?? null;
  }

  get mercadoPagoPreferenceId(): string | null {
    return this.props.mercadoPagoPreferenceId ?? null;
  }

  get payer(): Payer | null {
    return this.props.payer ?? null;
  }

  get fullTickets(): number {
    return this.props.fullTickets;
  }

  get halfTickets(): number {
    return this.props.halfTickets;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  get couponCode(): string | null {
    return this.props.couponCode ?? null;
  }

  get discountAmount(): number | null {
    return this.props.discountAmount ?? null;
  }

  get originalAmount(): number | null {
    return this.props.originalAmount ?? null;
  }

  get metadata() {
    return this.props.metadata ?? {};
  }

  setMercadoPagoId(mercadoPagoId: string): void {
    console.log(
      `Definindo mercadoPagoId: ${mercadoPagoId} para checkout com ID: ${this.id}`
    );
    this.props.mercadoPagoId = mercadoPagoId;
    this.props.updatedAt = new Date();
  }

  setMercadoPagoPreferenceId(mercadoPagoPreferenceId: string): void {
    console.log(
      `Definindo mercadoPagoPreferenceId: ${mercadoPagoPreferenceId} para checkout com ID: ${this.id}`
    );
    this.props.mercadoPagoPreferenceId = mercadoPagoPreferenceId;
    this.props.updatedAt = new Date();
  }

  setPaymentMethod(paymentMethod: string): void {
    this.props.paymentMethod = paymentMethod;
    this.props.updatedAt = new Date();
  }

  setPayer(payer: Payer) {
    this.props.payer = payer;
    this.props.updatedAt = new Date();
  }

  setTotalAmount(value: number) {
    this.props.totalAmount = value;
    this.props.updatedAt = new Date();
  }

  applyCoupon(
    couponCode: string,
    discountAmount: number,
    originalAmount: number
  ): void {
    if (this.status !== "pending") {
      throw new CheckoutError(
        "Cupom só pode ser aplicado em checkouts pendentes"
      );
    }
    this.props.couponCode = couponCode;
    this.props.discountAmount = discountAmount;
    this.props.originalAmount = originalAmount;
    this.props.totalAmount = originalAmount - discountAmount;
    this.props.updatedAt = new Date();
    this.validate();
  }

  // Novo: Método para remover cupom
  removeCoupon(): void {
    if (this.status !== "pending") {
      throw new CheckoutError(
        "Cupom só pode ser removido em checkouts pendentes"
      );
    }
    this.props.couponCode = null;
    this.props.discountAmount = null;
    this.props.totalAmount =
      this.props.originalAmount || this.props.totalAmount;
    this.props.originalAmount = null;
    this.props.updatedAt = new Date();
    this.validate();
  }

  // Métodos de domínio
  public startProcessing(): void {
    if (this.status !== "pending") {
      throw new CheckoutError(
        "Só pedidos pendentes podem iniciar processamento"
      );
    }
    this.updateStatus("processing");
  }

  public approve(mercadoPagoId: string): void {
    if (!["pending", "processing"].includes(this.status)) {
      throw new CheckoutError("Pedido não está em estado processável");
    }
    this.props.mercadoPagoId = mercadoPagoId;
    this.props.updatedAt = new Date();
    this.updateStatus("approved");
  }

  public reject(reason: string): void {
    this.props.metadata = {
      ...this.metadata,
      error: reason,
    };
    this.props.updatedAt = new Date();
    this.updateStatus("rejected");
  }

  public fail(error: Error): void {
    this.props.metadata = {
      ...this.metadata,
      error: error.message,
      retryCount: (this.metadata?.retryCount ?? 0) + 1,
    };
    this.props.updatedAt = new Date();
    this.updateStatus("failed");
  }

  public addParticipants(ids: string[]): void {
    this.props.metadata = {
      ...this.metadata,
      participantIds: [
        ...new Set([...(this.metadata?.participantIds ?? []), ...ids]),
      ],
    };
    this.props.updatedAt = new Date();
  }

  public updateStatus(status: CheckoutStatus): void {
    if (this.status === status) return;

    this.props.status = status;
    this.props.updatedAt = new Date();
    this.validate();
  }

  // Serialização segura
  public toDTO(): CheckoutProps {
    return {
      id: this.id,
      status: this.status,
      totalAmount: this.totalAmount,
      paymentMethod: this.paymentMethod,
      payer: this.payer,
      mercadoPagoId: this.mercadoPagoId,
      mercadoPagoPreferenceId: this.mercadoPagoPreferenceId,
      fullTickets: this.fullTickets,
      halfTickets: this.halfTickets,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      couponCode: this.couponCode,
      discountAmount: this.discountAmount,
      originalAmount: this.originalAmount,
      metadata: this.metadata.error
        ? { ...this.metadata, error: "Erro no processamento" }
        : this.metadata,
    };
  }
}

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export type CheckoutDTO = {
  id?: string;
  status: CheckoutStatus;
  totalAmount: number;
  // orderId: string;
  paymentMethod: string;
  payer: Payer;
  mercadoPagoId?: string | null;
  mercadoPagoPreferenceId?: string | null;
  fullTickets?: number;
  halfTickets?: number;
  createdAt: Date;
  updatedAt: Date;
  couponCode?: string | null;
  discountAmount?: number | null;
  originalAmount?: number | null;
  metadata?: {
    error?: string;
    retryCount?: number;
    participantIds?: string[];
    eventId?: string;
  };
};
