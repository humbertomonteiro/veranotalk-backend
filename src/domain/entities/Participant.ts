export interface ParticipantProps {
  id?: string;
  checkoutId: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  document: string;
  ticketType: "all" | "half" | "vip";
  // isHalfPrice: boolean;
  qrCode?: string;
  checkedIn?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Participant {
  private readonly props: ParticipantProps;

  constructor(props: ParticipantProps) {
    this.props = {
      ...props,
      checkedIn: props.checkedIn ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      qrCode: props.qrCode ?? undefined,
    };

    this.validate();
  }

  // Validação centralizada
  private validate(): void {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length < 3) {
      errors.push("Nome deve ter pelo menos 3 caracteres");
    }

    if (!this.isValidEmail(this.email)) {
      errors.push("Email inválido");
    }

    if (!this.isValidPhone(this.phone)) {
      errors.push("Telefone deve ter pelo menos 10 dígitos");
    }

    // if (this.isHalfPrice && this.ticketType !== "half") {
    //   errors.push("Tipo de ingresso incompatível com meia entrada");
    // }

    if (errors.length > 0) {
      throw new ParticipantError(errors.join(" | "));
    }
  }

  // Métodos de validação reutilizáveis
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return phone.replace(/\D/g, "").length >= 10;
  }

  // Getters com tipos explícitos
  get id(): string | undefined {
    return this.props.id;
  }

  get checkoutId(): string {
    return this.props.checkoutId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get maskedPhone(): string {
    return this.phone.replace(/(\d{2})\d+(\d{2})/, "$1******$2");
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get document(): string {
    return this.props.document;
  }

  get maskedDocument(): string {
    // Remove todos os não dígitos
    const cleanDoc = this.document.replace(/\D/g, "");

    if (cleanDoc.length === 11) {
      // CPF
      return this.document.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        "$1.***.***-$4"
      );
    } else if (cleanDoc.length === 14) {
      // CNPJ
      return this.document.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.***/****-$5"
      );
    }

    // Padrão genérico se não for CPF/CNPJ válido
    return this.document.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
  }

  get ticketType(): "all" | "half" | "vip" {
    return this.props.ticketType;
  }

  get qrCode(): string | undefined {
    return this.props.qrCode;
  }

  get checkedIn(): boolean {
    return this.props.checkedIn ?? false;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  // Comportamentos de negócio
  public checkIn(): void {
    if (this.checkedIn) {
      throw new ParticipantError("Participante já fez check-in");
    }
    this.props.checkedIn = true;
    this.props.updatedAt = new Date();
  }

  public generateQrCode(): void {
    if (!this.document) {
      throw new ParticipantError("ID é necessário para gerar QR Code");
    }
    this.props.qrCode = `PART-${this.document}-${crypto
      .randomUUID()
      .substring(0, 8)}`;
    this.props.updatedAt = new Date();
  }

  // Método para serialização segura
  public toDTO(): ParticipantProps {
    return {
      id: this.id,
      checkoutId: this.checkoutId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      eventId: this.eventId,
      document: this.document,
      ticketType: this.ticketType,
      checkedIn: this.checkedIn,
      qrCode: this.qrCode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Classe de erro específica
export class ParticipantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParticipantError";
  }
}

// Tipo para exposição segura
export type ParticipantDTO = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  ticketType: "all" | "half" | "vip";
  // isHalfPrice: boolean;
  checkedIn: boolean;
  qrCode?: string;
};
