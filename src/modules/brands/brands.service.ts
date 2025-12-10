import { prisma } from '@config/database';
import { logger } from '@config/logger';
import { AppError } from '@shared/errors/app-error';
import type { CreateBrandRequest, UpdateBrandRequest, BrandResponse } from './brands.types';
import crypto from 'crypto';

export class BrandsService {
  /**
   * Generate API key for brand
   */
  private generateApiKey(): string {
    return `adstat_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Transform brand to response format
   */
  private transformBrand(brand: any): BrandResponse {
    return {
      id: brand.id,
      name: brand.name,
      email: brand.email,
      company: brand.company,
      apiKey: brand.apiKey,
      balance: brand.balance.toString(),
      totalSpent: brand.totalSpent.toString(),
      totalCampaigns: brand.totalCampaigns,
      totalImpressions: brand.totalImpressions,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }

  /**
   * Create a new brand
   */
  async createBrand(data: CreateBrandRequest): Promise<BrandResponse> {
    // Check if email already exists
    const existing = await prisma.brand.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError('CONFLICT', 'Brand with this email already exists', 409);
    }

    // Generate API key
    const apiKey = this.generateApiKey();

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company,
        apiKey,
      },
    });

    logger.info({ brandId: brand.id, email: brand.email }, 'Brand created');

    return this.transformBrand(brand);
  }

  /**
   * Get brand by ID
   */
  async getBrand(brandId: string): Promise<BrandResponse> {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new AppError('NOT_FOUND', 'Brand not found', 404);
    }

    return this.transformBrand(brand);
  }

  /**
   * Update brand
   */
  async updateBrand(brandId: string, data: UpdateBrandRequest): Promise<BrandResponse> {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new AppError('NOT_FOUND', 'Brand not found', 404);
    }

    // Check email uniqueness if updating
    if (data.email && data.email !== brand.email) {
      const existing = await prisma.brand.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new AppError('CONFLICT', 'Email already in use', 409);
      }
    }

    const updatedBrand = await prisma.brand.update({
      where: { id: brandId },
      data,
    });

    logger.info({ brandId }, 'Brand updated');

    return this.transformBrand(updatedBrand);
  }

  /**
   * Add balance to brand account
   */
  async addBalance(brandId: string, amount: number): Promise<BrandResponse> {
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    logger.info({ brandId, amount }, 'Balance added to brand account');

    return this.transformBrand(brand);
  }

  /**
   * Regenerate API key
   */
  async regenerateApiKey(brandId: string): Promise<{ apiKey: string }> {
    const apiKey = this.generateApiKey();

    await prisma.brand.update({
      where: { id: brandId },
      data: { apiKey },
    });

    logger.info({ brandId }, 'API key regenerated');

    return { apiKey };
  }

  /**
   * Get brand statistics
   */
  async getBrandStats(brandId: string) {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        campaigns: {
          select: {
            status: true,
            currentImpressions: true,
            spentBudget: true,
          },
        },
      },
    });

    if (!brand) {
      throw new AppError('NOT_FOUND', 'Brand not found', 404);
    }

    const activeCampaigns = brand.campaigns.filter(c => c.status === 'ACTIVE').length;
    const totalImpressions = brand.campaigns.reduce(
      (sum, c) => sum + c.currentImpressions,
      0
    );

    return {
      balance: brand.balance.toString(),
      totalSpent: brand.totalSpent.toString(),
      totalCampaigns: brand.totalCampaigns,
      activeCampaigns,
      totalImpressions,
    };
  }
}

