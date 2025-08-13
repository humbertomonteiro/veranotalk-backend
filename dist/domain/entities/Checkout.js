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
    validate() {
        const errors = [];
        if (this.fullTickets <= 0 && this.halfTickets <= 0) {
            throw new CheckoutError("Tickets empty");
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
        return this.props.totalAmount || null;
    }
    get status() {
        return this.props.status;
    }
    get paymentMethod() {
        return this.props.paymentMethod ?? null;
    }
    get mercadoPagoId() {
        return this.props.mercadoPagoId ?? null;
    }
    get mercadoPagoPreferenceId() {
        return this.props.mercadoPagoPreferenceId ?? null;
    }
    get payer() {
        return this.props.payer ?? null;
    }
    get fullTickets() {
        return this.props.fullTickets;
    }
    get halfTickets() {
        return this.props.halfTickets;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get couponCode() {
        return this.props.couponCode ?? null;
    }
    get discountAmount() {
        return this.props.discountAmount ?? null;
    }
    get originalAmount() {
        return this.props.originalAmount ?? null;
    }
    get metadata() {
        return this.props.metadata ?? {};
    }
    setMercadoPagoId(mercadoPagoId) {
        console.log(`Definindo mercadoPagoId: ${mercadoPagoId} para checkout com ID: ${this.id}`);
        this.props.mercadoPagoId = mercadoPagoId;
        this.props.updatedAt = new Date();
    }
    setMercadoPagoPreferenceId(mercadoPagoPreferenceId) {
        console.log(`Definindo mercadoPagoPreferenceId: ${mercadoPagoPreferenceId} para checkout com ID: ${this.id}`);
        this.props.mercadoPagoPreferenceId = mercadoPagoPreferenceId;
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
    setTotalAmount(value) {
        this.props.totalAmount = value;
        this.props.updatedAt = new Date();
    }
    applyCoupon(couponCode, discountAmount, originalAmount) {
        if (this.status !== "pending") {
            throw new CheckoutError("Cupom só pode ser aplicado em checkouts pendentes");
        }
        this.props.couponCode = couponCode;
        this.props.discountAmount = discountAmount;
        this.props.originalAmount = originalAmount;
        this.props.totalAmount = originalAmount - discountAmount;
        this.props.updatedAt = new Date();
        this.validate();
    }
    // Novo: Método para remover cupom
    removeCoupon() {
        if (this.status !== "pending") {
            throw new CheckoutError("Cupom só pode ser removido em checkouts pendentes");
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
exports.Checkout = Checkout;
class CheckoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "CheckoutError";
    }
}
exports.CheckoutError = CheckoutError;
//# sourceMappingURL=Checkout.js.map