import { CampaignsService } from './campaigns.service';
import { prisma } from '@config/database';

jest.mock('@config/database');

describe('CampaignsService', () => {
  let campaignsService: CampaignsService;

  beforeEach(() => {
    campaignsService = new CampaignsService();
    jest.clearAllMocks();
  });

  describe('matchUsersToCampaign', () => {
    it('should match users based on location, demographics, and interests', async () => {
      const campaignId = 'campaign-123';

      const mockCampaign = {
        id: campaignId,
        status: 'ACTIVE',
        targetLocations: ['Nairobi', 'KE'],
        targetAgeRanges: ['18-24', '25-34'],
        targetInterests: ['fashion', 'tech'],
        minContacts: 100,
        minViewRate: 0.5,
      };

      const mockUsers = [
        {
          id: 'user-1',
          locationCountry: 'KE',
          locationCity: 'Nairobi',
          ageRange: '25-34',
          interests: ['fashion', 'tech', 'sports'],
          avgViewRate: '0.75',
          reputationScore: '0.90',
          contactCount: 500,
        },
        {
          id: 'user-2',
          locationCountry: 'NG',
          locationCity: 'Lagos',
          ageRange: '35-44',
          interests: ['food'],
          avgViewRate: '0.30',
          reputationScore: '0.60',
          contactCount: 200,
        },
      ];

      (prisma.campaign.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockCampaign);
      (prisma.user.findMany as jest.Mock) = jest.fn().mockResolvedValue(mockUsers);

      const matches = await campaignsService.matchUsersToCampaign(campaignId);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toHaveProperty('userId');
      expect(matches[0]).toHaveProperty('score');
      expect(matches[0]).toHaveProperty('reasons');
      
      // User 1 should have higher score (better match)
      const user1Match = matches.find(m => m.userId === 'user-1');
      const user2Match = matches.find(m => m.userId === 'user-2');
      
      if (user1Match && user2Match) {
        expect(user1Match.score).toBeGreaterThan(user2Match.score);
      }
    });

    it('should return empty array for inactive campaign', async () => {
      const campaignId = 'campaign-123';

      (prisma.campaign.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: campaignId,
        status: 'PAUSED',
      });

      const matches = await campaignsService.matchUsersToCampaign(campaignId);

      expect(matches).toEqual([]);
    });

    it('should filter out users with score below 30%', async () => {
      const campaignId = 'campaign-123';

      const mockCampaign = {
        id: campaignId,
        status: 'ACTIVE',
        targetLocations: ['Nairobi'],
        targetAgeRanges: ['18-24'],
        targetInterests: ['fashion'],
        minContacts: 100,
        minViewRate: 0.5,
      };

      const mockUsers = [
        {
          id: 'user-poor-match',
          locationCountry: 'US', // Different country
          locationCity: 'New York',
          ageRange: '55+', // Different age range
          interests: ['gaming'], // Different interests
          avgViewRate: '0.20', // Low view rate
          reputationScore: '0.50',
          contactCount: 50,
        },
      ];

      (prisma.campaign.findUnique as jest.Mock) = jest.fn().mockResolvedValue(mockCampaign);
      (prisma.user.findMany as jest.Mock) = jest.fn().mockResolvedValue(mockUsers);

      const matches = await campaignsService.matchUsersToCampaign(campaignId);

      // Poor match should be filtered out (score < 0.3)
      expect(matches.length).toBe(0);
    });
  });

  describe('createCampaign', () => {
    it('should create campaign with valid data', async () => {
      const brandId = 'brand-123';
      const campaignData = {
        name: 'Test Campaign',
        creativeUrl: 'https://example.com/creative.jpg',
        targetLocations: ['Nairobi'],
        targetAgeRanges: ['18-24' as const],
        targetInterests: ['fashion' as const],
        totalBudget: 1000,
        cpm: 3.0,
        userCpm: 2.5,
        flatFee: 0.5,
        maxPosters: 100,
        targetImpressions: 50000,
      };

      (prisma.brand.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: brandId,
        balance: 5000,
      });

      (prisma.campaign.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'campaign-123',
        brandId,
        ...campaignData,
        watermarkId: 'watermark-123',
        status: 'DRAFT',
      });

      const result = await campaignsService.createCampaign(brandId, campaignData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('watermarkId');
      expect(result.name).toBe(campaignData.name);
    });

    it('should throw error if brand has insufficient balance', async () => {
      const brandId = 'brand-123';
      const campaignData = {
        name: 'Test Campaign',
        creativeUrl: 'https://example.com/creative.jpg',
        targetLocations: ['Nairobi'],
        targetAgeRanges: ['18-24' as const],
        targetInterests: ['fashion' as const],
        totalBudget: 10000, // More than balance
        cpm: 3.0,
        userCpm: 2.5,
        flatFee: 0.5,
        maxPosters: 100,
        targetImpressions: 50000,
      };

      (prisma.brand.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        id: brandId,
        balance: 500, // Insufficient
      });

      await expect(campaignsService.createCampaign(brandId, campaignData))
        .rejects
        .toThrow('INSUFFICIENT_BALANCE');
    });
  });
});




