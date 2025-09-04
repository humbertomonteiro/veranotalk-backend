export type DiscountType = "percentage" | "fixed";

export interface CouponProps {
  id?: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  eventId?: string;
  maxUses?: number;
  uses: number;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponError";
  }
}

export class Coupon {
  private readonly props: CouponProps;

  constructor(props: CouponProps) {
    this.props = {
      ...props,
      uses: props.uses ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.props.code || this.props.code.trim() === "") {
      errors.push("Código do cupom é obrigatório");
    }

    if (!["percentage", "fixed"].includes(this.props.discountType)) {
      errors.push("Tipo de desconto inválido");
    }

    if (this.props.discountValue <= 0) {
      errors.push("Valor do desconto deve ser maior que zero");
    }

    if (
      this.props.discountType === "percentage" &&
      this.props.discountValue > 100
    ) {
      errors.push("Desconto percentual não pode exceder 100%");
    }

    if (this.props.maxUses !== undefined && this.props.maxUses < 0) {
      errors.push("Número máximo de usos não pode ser negativo");
    }

    if (this.props.uses < 0) {
      errors.push("Número de usos não pode ser negativo");
    }

    if (
      this.props.maxUses !== undefined &&
      this.props.uses > this.props.maxUses
    ) {
      errors.push("Número de usos excede o limite máximo");
    }

    if (errors.length > 0) {
      throw new CouponError(errors.join(" | "));
    }
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get discountType(): DiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get eventId(): string | undefined {
    return this.props.eventId;
  }

  get maxUses(): number | undefined {
    return this.props.maxUses;
  }

  get uses(): number {
    return this.props.uses;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  // Métodos de domínio
  public isExpired(): boolean {
    return this.props.expiresAt ? new Date() > this.props.expiresAt : false;
  }

  public isExhausted(): boolean {
    return this.props.maxUses !== undefined && this.props.maxUses !== null
      ? this.props.uses >= this.props.maxUses
      : false;
  }

  public isValid(eventId?: string): boolean {
    if (this.isExpired()) {
      throw new CouponError("Cupom expirado");
    }
    if (this.isExhausted()) {
      throw new CouponError("Cupom esgotado");
    }
    if (this.props.eventId && eventId && this.props.eventId !== eventId) {
      throw new CouponError("Cupom não aplicável a este evento");
    }
    return true;
  }

  public apply(totalAmount: number): number {
    this.isValid(); // Valida antes de aplicar

    let discountedAmount = totalAmount;
    if (this.props.discountType === "percentage") {
      discountedAmount = totalAmount * (1 - this.props.discountValue / 100);
    } else if (this.props.discountType === "fixed") {
      discountedAmount = Math.max(0, totalAmount - this.props.discountValue);
    }

    if (discountedAmount < 0) {
      throw new CouponError("Desconto não pode resultar em valor negativo");
    }

    return Number(discountedAmount.toFixed(2)); // Arredonda para 2 casas decimais
  }

  public incrementUses(): void {
    if (this.isExhausted()) {
      throw new CouponError("Cupom já atingiu o limite de usos");
    }
    this.props.uses += 1;
    this.props.updatedAt = new Date();
    this.validate();
  }

  // Serialização segura
  public toDTO(): CouponProps {
    return {
      id: this.id,
      code: this.code,
      discountType: this.discountType,
      discountValue: this.discountValue,
      eventId: this.eventId,
      maxUses: this.maxUses,
      uses: this.uses,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
