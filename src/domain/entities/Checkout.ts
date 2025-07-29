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
  totalAmount: number;
  status: CheckoutStatus;
  // orderId?: string;
  paymentMethod?: string | null;
  payer?: Payer;
  mercadoPagoId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: {
    error?: string;
    retryCount?: number;
    participantIds?: string[];
    eventId?: string;
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

    if (this.totalAmount <= 0) {
      errors.push("Valor total deve ser maior que zero");
    }

    if (errors.length > 0) {
      throw new CheckoutError(errors.join(" | "));
    }
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get status(): CheckoutStatus {
    return this.props.status;
  }

  // get orderId(): string | undefined {
  //   return this.props.orderId;
  // }

  get paymentMethod(): string | null {
    return this.props.paymentMethod ?? null;
  }

  get mercadoPagoId(): string | null {
    return this.props.mercadoPagoId ?? null;
  }

  get payer(): Payer | null {
    return this.props.payer ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
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

  setPaymentMethod(paymentMethod: string): void {
    this.props.paymentMethod = paymentMethod;
    this.props.updatedAt = new Date();
  }

  setPayer(payer: Payer) {
    this.props.payer = payer;
    this.props.updatedAt = new Date();
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
  public toDTO(): CheckoutDTO {
    const metadata: CheckoutDTO["metadata"] = {
      retryCount: this.metadata.retryCount,
      participantIds: this.metadata.participantIds,
      eventId: this.metadata.eventId,
    };
    // Só incluir metadata.error se não for undefined
    if (this.metadata.error) {
      metadata.error = "Erro no processamento";
    }

    return {
      id: this.id,
      status: this.status,
      totalAmount: this.totalAmount,
      // orderId: this.orderId || "",
      paymentMethod: this.paymentMethod || "",
      payer: this.payer || { name: "", document: "" },
      mercadoPagoId: this.mercadoPagoId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata,
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
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    error?: string;
    retryCount?: number;
    participantIds?: string[];
    eventId?: string;
  };
};
