"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Participant = void 0;
class Participant {
    constructor(props) {
        this.props = {
            ...props,
            checkedIn: props.checkedIn || false,
            createdAt: props.createdAt || new Date(),
        };
        this.validate();
    }
    validate() {
        if (!this.props.name || this.props.name.trim().length < 3) {
            throw new Error("Name must be at least 3 characters long");
        }
        if (!this.validateEmail(this.props.email)) {
            throw new Error("Invalid email format");
        }
        if (!this.props.phone || this.props.phone.trim().length < 10) {
            throw new Error("Phone number must be at least 10 digits");
        }
        if (this.props.isHalfPrice && this.props.ticketType !== "half") {
            throw new Error("Ticket type must match half price status");
        }
    }
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    // Getters
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
    get ticketType() {
        return this.props.ticketType;
    }
    get isHalfPrice() {
        return this.props.isHalfPrice;
    }
    get qrCode() {
        return this.props.qrCode;
    }
    get checkedIn() {
        return this.props.checkedIn || false;
    }
    get createdAt() {
        return this.props.createdAt || new Date();
    }
    // Setters com validação
    updateCheckIn(status) {
        this.props.checkedIn = status;
        this.validate();
    }
    generateQrCode() {
        if (!this.props.id) {
            throw new Error("Participant must have an ID before generating QR code");
        }
        this.props.qrCode = `PART-${this.props.id}-${Math.random()
            .toString(36)
            .substring(2, 10)}`;
    }
}
exports.Participant = Participant;
//# sourceMappingURL=Payment.js.map