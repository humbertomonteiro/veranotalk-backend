"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantError = exports.Participant = void 0;
class Participant {
    constructor(props) {
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
    validate() {
        const errors = [];
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
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    isValidPhone(phone) {
        return phone.replace(/\D/g, "").length >= 10;
    }
    // Getters com tipos explícitos
    get id() {
        return this.props.id;
    }
    get checkoutId() {
        return this.props.checkoutId;
    }
    get name() {
        return this.props.name;
    }
    get email() {
        return this.props.email;
    }
    get phone() {
        return this.props.phone;
    }
    get maskedPhone() {
        return this.phone.replace(/(\d{2})\d+(\d{2})/, "$1******$2");
    }
    get eventId() {
        return this.props.eventId;
    }
    get document() {
        return this.props.document;
    }
    get maskedDocument() {
        // Remove todos os não dígitos
        const cleanDoc = this.document.replace(/\D/g, "");
        if (cleanDoc.length === 11) {
            // CPF
            return this.document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.***.***-$4");
        }
        else if (cleanDoc.length === 14) {
            // CNPJ
            return this.document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.***/****-$5");
        }
        // Padrão genérico se não for CPF/CNPJ válido
        return this.document.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
    }
    get ticketType() {
        return this.props.ticketType;
    }
    // get isHalfPrice(): boolean {
    //   return this.props.isHalfPrice;
    // }
    get qrCode() {
        return this.props.qrCode;
    }
    get checkedIn() {
        return this.props.checkedIn ?? false;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    // Comportamentos de negócio
    checkIn() {
        if (this.checkedIn) {
            throw new ParticipantError("Participante já fez check-in");
        }
        this.props.checkedIn = true;
        this.props.updatedAt = new Date();
    }
    generateQrCode() {
        if (!this.id) {
            throw new ParticipantError("ID é necessário para gerar QR Code");
        }
        this.props.qrCode = `PART-${this.id}-${crypto
            .randomUUID()
            .substring(0, 8)}`;
        this.props.updatedAt = new Date();
    }
    // Método para serialização segura
    toDTO() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            document: this.document,
            ticketType: this.ticketType,
            // isHalfPrice: this.isHalfPrice,
            checkedIn: this.checkedIn,
            qrCode: this.qrCode ? "••••-••••" : undefined,
        };
    }
}
exports.Participant = Participant;
// Classe de erro específica
class ParticipantError extends Error {
    constructor(message) {
        super(message);
        this.name = "ParticipantError";
    }
}
exports.ParticipantError = ParticipantError;
//# sourceMappingURL=Participant.js.map