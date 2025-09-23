// backend/src/domain/entities/User.ts
export interface UserProps {
  id?: string;
  uid?: string;
  status?: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "viewer";
  permissions: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  valueSold?: number;
  transfers?: {
    id: string;
    value: number;
    status: "sent" | "accepted" | "rejected";
    createdAt: Date;
  }[];
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = {
      ...props,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
      permissions: props.permissions || [],
    };
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }
  get uid(): string | undefined {
    return this.props.uid;
  }
  get status(): string | undefined {
    return this.props.status;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get name(): string {
    return this.props.name;
  }
  get role(): string {
    return this.props.role;
  }
  get permissions(): string[] {
    return this.props.permissions;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt!;
  }
  get updatedAt(): Date {
    return this.props.updatedAt!;
  }
  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }
  get valueSold() {
    return this.props.valueSold;
  }
  get transfers() {
    return this.props.transfers;
  }

  // Métodos de negócio
  public updateLastLogin(): void {
    this.props.lastLogin = new Date();
    this.props.updatedAt = new Date();
  }

  public updateProfile(
    name: string,
    role: string,
    permissions: string[]
  ): void {
    this.props.name = name;
    this.props.role = role as "admin" | "staff" | "viewer";
    this.props.permissions = permissions;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission);
  }

  public toDTO(): UserProps {
    return { ...this.props };
  }
}
