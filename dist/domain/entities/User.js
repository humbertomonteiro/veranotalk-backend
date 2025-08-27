"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
class User {
    constructor(props) {
        this.props = {
            ...props,
            isActive: props.isActive ?? true,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
            permissions: props.permissions || [],
        };
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get uid() {
        return this.props.uid;
    }
    get email() {
        return this.props.email;
    }
    get name() {
        return this.props.name;
    }
    get role() {
        return this.props.role;
    }
    get permissions() {
        return this.props.permissions;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get lastLogin() {
        return this.props.lastLogin;
    }
    // Métodos de negócio
    updateLastLogin() {
        this.props.lastLogin = new Date();
        this.props.updatedAt = new Date();
    }
    updateProfile(name, role, permissions) {
        this.props.name = name;
        this.props.role = role;
        this.props.permissions = permissions;
        this.props.updatedAt = new Date();
    }
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
    }
    hasPermission(permission) {
        return this.props.permissions.includes(permission);
    }
    toDTO() {
        return { ...this.props };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map