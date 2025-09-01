import { Request, Response } from "express";
import { CouponService } from "../services";
import { CouponProps } from "../../../domain/entities";

export interface ValidateCouponInput {
  code: string;
}

export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  async createCoupon(req: Request, res: Response): Promise<void> {
    try {
      const {
        code,
        discountType,
        discountValue,
        uses,
        eventId,
        maxUses,
        expiresAt,
      } = req.body;

      if (!code || !discountType || !discountValue) {
        res.status(400).json({
          error:
            "Os valores code, discountType, discountValue não podem ser vazios.",
        });
        return;
      }

      const couponData = {
        code,
        discountType,
        discountValue,
        uses: uses || 0,
        eventId: eventId || "verano-talk-2025",
        maxUses: maxUses || null,
        expiresAt: expiresAt || null,
      };
      const coupon = await this.couponService.createCoupon(couponData);

      if (!coupon) {
        res
          .status(404)
          .json({ error: "Dados inválidos, error ao criar cupom." });
        return;
      }

      res.status(200).json({
        coupon: coupon.toDTO(),
      });
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao validar cupom",
      });
    }
  }

  async validateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const input: ValidateCouponInput = req.body;

      if (!input.code) {
        res.status(400).json({ error: "Código do cupom é obrigatório" });
        return;
      }

      const coupon = await this.couponService.validateCoupon(input.code);

      if (!coupon) {
        res.status(404).json({ error: "Cupom inválido ou não encontrado" });
        return;
      }

      res.status(200).json({
        coupon: coupon.toDTO(),
      });
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao validar cupom",
      });
    }
  }

  async getAllCoupons(req: Request, res: Response): Promise<void> {
    try {
      const coupons = await this.couponService.getAllCoupons();
      res.status(200).json(coupons.map((coupon) => coupon.toDTO()));
    } catch (error) {
      console.error("Erro ao buscar todos os cupons:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao buscar cupons",
      });
    }
  }

  async updateCoupon(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const {
        code,
        discountType,
        discountValue,
        uses,
        eventId,
        maxUses,
        expiresAt,
      } = req.body;

      if (!id) {
        res.status(400).json({ error: "ID do cupom é obrigatório" });
        return;
      }

      if (!code || !discountType || !discountValue) {
        res.status(400).json({
          error:
            "Os valores code, discountType, discountValue não podem ser vazios.",
        });
        return;
      }

      const couponData: Partial<CouponProps> = {
        code,
        discountType,
        discountValue,
        uses: uses !== undefined ? uses : undefined,
        eventId: eventId || undefined,
        maxUses: maxUses !== undefined ? maxUses : undefined,
        expiresAt: expiresAt || undefined,
      };

      const coupon = await this.couponService.updateCoupon(id, couponData);

      if (!coupon) {
        res.status(404).json({ error: "Cupom não encontrado" });
        return;
      }

      res.status(200).json({
        coupon: coupon.toDTO(),
      });
    } catch (error) {
      console.error(`Erro ao atualizar cupom ${req.params.id}:`, error);
      res
        .status(
          error instanceof Error && error.message.includes("não encontrado")
            ? 404
            : 400
        )
        .json({
          error:
            error instanceof Error ? error.message : "Erro ao atualizar cupom",
        });
    }
  }

  async deleteCoupon(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;

      if (!id) {
        res.status(400).json({ error: "ID do cupom é obrigatório" });
        return;
      }

      await this.couponService.deleteCoupon(id);
      res.status(204).send();
    } catch (error) {
      console.error(`Erro ao excluir cupom ${req.params.id}:`, error);
      res
        .status(
          error instanceof Error && error.message.includes("não encontrado")
            ? 404
            : 500
        )
        .json({
          error:
            error instanceof Error ? error.message : "Erro ao excluir cupom",
        });
    }
  }
}
