import { Request, Response } from 'express';
import { BrandsService } from './brands.service';
import { createBrandSchema, updateBrandSchema, addBalanceSchema } from './brands.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class BrandsController {
  private brandsService: BrandsService;

  constructor() {
    this.brandsService = new BrandsService();
  }

  /**
   * POST /api/v1/brands
   * Create a new brand
   */
  createBrand = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createBrandSchema.parse(req.body);
    const brand = await this.brandsService.createBrand(validatedData);

    const response: ApiResponse = {
      success: true,
      data: { brand },
    };

    res.status(201).json(response);
  });

  /**
   * GET /api/v1/brands/:id
   * Get brand by ID
   */
  getBrand = asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id;
    const brand = await this.brandsService.getBrand(brandId);

    const response: ApiResponse = {
      success: true,
      data: { brand },
    };

    res.status(200).json(response);
  });

  /**
   * PATCH /api/v1/brands/:id
   * Update brand
   */
  updateBrand = asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id;
    const validatedData = updateBrandSchema.parse(req.body);
    const brand = await this.brandsService.updateBrand(brandId, validatedData);

    const response: ApiResponse = {
      success: true,
      data: { brand },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/brands/:id/balance
   * Add balance to brand account
   */
  addBalance = asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id;
    const validatedData = addBalanceSchema.parse(req.body);
    const brand = await this.brandsService.addBalance(brandId, validatedData.amount);

    const response: ApiResponse = {
      success: true,
      data: { brand },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/brands/:id/api-key/regenerate
   * Regenerate API key
   */
  regenerateApiKey = asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id;
    const result = await this.brandsService.regenerateApiKey(brandId);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/brands/:id/stats
   * Get brand statistics
   */
  getBrandStats = asyncHandler(async (req: Request, res: Response) => {
    const brandId = req.params.id;
    const stats = await this.brandsService.getBrandStats(brandId);

    const response: ApiResponse = {
      success: true,
      data: { stats },
    };

    res.status(200).json(response);
  });
}




