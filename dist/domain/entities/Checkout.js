"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutError = exports.Checkout = void 0;
class Checkout {
    constructor(props) {
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
    validate() {
        const errors = [];
        if (this.totalAmount <= 0) {
            errors.push("Valor total deve ser maior que zero");
        }
        if (errors.length > 0) {
            throw new CheckoutError(errors.join(" | "));
        }
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get totalAmount() {
        return this.props.totalAmount;
    }
    get status() {
        return this.props.status;
    }
    // get orderId(): string | undefined {
    //   return this.props.orderId;
    // }
    get paymentMethod() {
        return this.props.paymentMethod ?? null;
    }
    get mercadoPagoId() {
        return this.props.mercadoPagoId ?? null;
    }
    get payer() {
        return this.props.payer ?? null;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get metadata() {
        return this.props.metadata ?? {};
    }
    setMercadoPagoId(mercadoPagoId) {
        console.log(`Definindo mercadoPagoId: ${mercadoPagoId} para checkout com ID: ${this.id}`);
        this.props.mercadoPagoId = mercadoPagoId;
        this.props.updatedAt = new Date();
    }
    setPaymentMethod(paymentMethod) {
        this.props.paymentMethod = paymentMethod;
        this.props.updatedAt = new Date();
    }
    setPayer(payer) {
        this.props.payer = payer;
        this.props.updatedAt = new Date();
    }
    // Métodos de domínio
    startProcessing() {
        if (this.status !== "pending") {
            throw new CheckoutError("Só pedidos pendentes podem iniciar processamento");
        }
        this.updateStatus("processing");
    }
    approve(mercadoPagoId) {
        if (!["pending", "processing"].includes(this.status)) {
            throw new CheckoutError("Pedido não está em estado processável");
        }
        this.props.mercadoPagoId = mercadoPagoId;
        this.props.updatedAt = new Date();
        this.updateStatus("approved");
    }
    reject(reason) {
        this.props.metadata = {
            ...this.metadata,
            error: reason,
        };
        this.props.updatedAt = new Date();
        this.updateStatus("rejected");
    }
    fail(error) {
        this.props.metadata = {
            ...this.metadata,
            error: error.message,
            retryCount: (this.metadata?.retryCount ?? 0) + 1,
        };
        this.props.updatedAt = new Date();
        this.updateStatus("failed");
    }
    addParticipants(ids) {
        this.props.metadata = {
            ...this.metadata,
            participantIds: [
                ...new Set([...(this.metadata?.participantIds ?? []), ...ids]),
            ],
        };
        this.props.updatedAt = new Date();
    }
    updateStatus(status) {
        if (this.status === status)
            return;
        this.props.status = status;
        this.props.updatedAt = new Date();
        this.validate();
    }
    // Serialização segura
    toDTO() {
        const metadata = {
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
exports.Checkout = Checkout;
class CheckoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "CheckoutError";
    }
}
exports.CheckoutError = CheckoutError;
//# sourceMappingURL=Checkout.js.map