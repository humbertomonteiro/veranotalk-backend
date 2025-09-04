export type TransactionType = "deposit" | "expense";

export interface TransactionProps {
  id?: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: Date;
  category: TransactionCategory;
  userId?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export enum TransactionCategory {
  Sponsor = "SPONSOR",
  Speaker = "SPEAKER",
  Marketing = "MARKETING",
  Infrastructure = "INFRASTRUCTURE",
  Collaborators = "COLLABORATORS",
  Other = "OTHER",
}

export class Transaction {
  constructor(private readonly props: TransactionProps) {
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };

    this.validate();
  }

  private validate() {
    if (this.props.amount <= 0) {
      throw new Error("O valor da transação deve ser maior que zero.");
    }
    if (!["deposit", "expense"].includes(this.props.type)) {
      throw new Error("Tipo de transação inválido.");
    }
    if (!this.props.description || this.props.description.trim() === "") {
      throw new Error("A descrição não pode estar vazia.");
    }
    if (
      !this.props.category ||
      !Object.values(TransactionCategory).includes(this.props.category)
    ) {
      throw new Error("Categoria não pode estar vazia ou inválida.");
    }
  }

  get id() {
    return this.props.id;
  }
  get amount() {
    return this.props.amount;
  }
  get type() {
    return this.props.type;
  }
  get description() {
    return this.props.description;
  }
  get category() {
    return this.props.category;
  }
  get userId() {
    return this.props.userId;
  }
  get date() {
    return this.props.date;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  updateAmount(newAmount: number): Transaction {
    if (newAmount <= 0) {
      throw new Error("O valor da transação deve ser maior que zero.");
    }
    return new Transaction({
      ...this.props,
      amount: newAmount,
      updatedAt: new Date(),
    });
  }

  updateDescription(newDescription: string): Transaction {
    if (!newDescription || newDescription.trim() === "") {
      throw new Error("A descrição não pode estar vazia.");
    }
    return new Transaction({
      ...this.props,
      description: newDescription,
      updatedAt: new Date(),
    });
  }

  updateCategory(newCategory: TransactionCategory): Transaction {
    return new Transaction({
      ...this.props,
      category: newCategory,
      updatedAt: new Date(),
    });
  }

  getImpact(): number {
    return this.type === "deposit" ? this.amount : -this.amount;
  }

  toDTO() {
    return this.props;
  }
}
