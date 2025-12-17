import { prisma } from '../config/database';
import { logger } from '../config/logger';

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create test users
  const user1 = await prisma.user.upsert({
    where: { phoneNumber: '+254712345678' },
    update: {},
    create: {
      phoneNumber: '+254712345678',
      name: 'John Doe',
      whatsappVerified: true,
      ageRange: '25-34',
      locationCity: 'Nairobi',
      locationCountry: 'KE',
      interests: ['fashion', 'tech', 'sports'],
      contactCount: 500,
      tier: 'SILVER',
      reputationScore: 0.85,
      avgViewRate: 0.75,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { phoneNumber: '+254723456789' },
    update: {},
    create: {
      phoneNumber: '+254723456789',
      name: 'Jane Smith',
      whatsappVerified: true,
      ageRange: '18-24',
      locationCity: 'Nairobi',
      locationCountry: 'KE',
      interests: ['fashion', 'beauty', 'lifestyle'],
      contactCount: 800,
      tier: 'GOLD',
      reputationScore: 0.92,
      avgViewRate: 0.82,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { phoneNumber: '+2348012345678' },
    update: {},
    create: {
      phoneNumber: '+2348012345678',
      name: 'Chidi Okafor',
      whatsappVerified: true,
      ageRange: '25-34',
      locationCity: 'Lagos',
      locationCountry: 'NG',
      interests: ['tech', 'business', 'music'],
      contactCount: 650,
      tier: 'SILVER',
      reputationScore: 0.78,
      avgViewRate: 0.68,
    },
  });

  logger.info(`✅ Created ${3} test users`);

  // Create test brand
  const brand1 = await prisma.brand.upsert({
    where: { email: 'brand@fashionhouse.com' },
    update: {},
    create: {
      name: 'Fashion House',
      email: 'brand@fashionhouse.com',
      company: 'Fashion House Ltd',
      balance: 10000,
      apiKey: 'adstat_test_key_1234567890',
    },
  });

  const brand2 = await prisma.brand.upsert({
    where: { email: 'marketing@techcorp.com' },
    update: {},
    create: {
      name: 'Tech Corp',
      email: 'marketing@techcorp.com',
      company: 'Tech Corporation',
      balance: 15000,
      apiKey: 'adstat_test_key_0987654321',
    },
  });

  logger.info(`✅ Created ${2} test brands`);

  // Create test campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      brandId: brand1.id,
      name: 'Summer Fashion Collection 2025',
      description: 'Promote our latest summer collection',
      creativeUrl: 'https://example.com/summer-fashion.jpg',
      watermarkId: 'wm_summer_fashion_2025',
      callToAction: 'Shop Now at FashionHouse.com',
      targetLocations: ['Nairobi', 'Lagos', 'Accra', 'KE', 'NG', 'GH'],
      targetAgeRanges: ['18-24', '25-34'],
      targetInterests: ['fashion', 'lifestyle', 'beauty'],
      minContacts: 200,
      minViewRate: 0.5,
      totalBudget: 5000,
      cpm: 3.5,
      userCpm: 2.8,
      flatFee: 0.5,
      reshareBonus: 0.2,
      maxPosters: 200,
      targetImpressions: 100000,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      brandId: brand2.id,
      name: 'New Smartphone Launch',
      description: 'Introducing the TechPro X1',
      creativeUrl: 'https://example.com/techpro-x1.jpg',
      watermarkId: 'wm_techpro_x1_launch',
      callToAction: 'Pre-order Now!',
      targetLocations: ['Nairobi', 'Lagos', 'Johannesburg', 'KE', 'NG', 'ZA'],
      targetAgeRanges: ['18-24', '25-34', '35-44'],
      targetInterests: ['tech', 'gaming', 'business'],
      minContacts: 300,
      minViewRate: 0.6,
      totalBudget: 8000,
      cpm: 4.0,
      userCpm: 3.2,
      flatFee: 1.0,
      reshareBonus: 0.5,
      maxPosters: 150,
      targetImpressions: 150000,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      brandId: brand1.id,
      name: 'Black Friday Sale',
      description: 'Up to 70% off everything!',
      creativeUrl: 'https://example.com/black-friday.jpg',
      watermarkId: 'wm_black_friday_2025',
      targetLocations: ['Nairobi', 'KE'],
      targetAgeRanges: ['18-24', '25-34', '35-44'],
      targetInterests: ['fashion', 'shopping'],
      minContacts: 150,
      totalBudget: 3000,
      cpm: 3.0,
      userCpm: 2.4,
      flatFee: 0.3,
      maxPosters: 100,
      targetImpressions: 50000,
      status: 'DRAFT',
    },
  });

  logger.info(`✅ Created ${3} test campaigns`);

  // Create test posts
  const post1 = await prisma.post.create({
    data: {
      userId: user1.id,
      campaignId: campaign1.id,
      screenshotUrl: 'https://example.com/screenshot1.jpg',
      viewsCount: 450,
      resharesCount: 12,
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      screenshotUploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'VERIFIED',
      verifiedBy: 'auto',
      baseEarnings: 1.26, // (450/1000) * 2.8
      bonusEarnings: 0.24, // Tier bonus
      totalEarnings: 2.0, // Including flat fee
      deviceFingerprint: 'fp_user1_device',
    },
  });

  const post2 = await prisma.post.create({
    data: {
      userId: user2.id,
      campaignId: campaign1.id,
      screenshotUrl: 'https://example.com/screenshot2.jpg',
      viewsCount: 620,
      resharesCount: 18,
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      screenshotUploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'VERIFIED',
      verifiedBy: 'auto',
      baseEarnings: 1.736, // (620/1000) * 2.8
      bonusEarnings: 0.42, // Tier bonus (GOLD)
      totalEarnings: 2.656,
      deviceFingerprint: 'fp_user2_device',
    },
  });

  const post3 = await prisma.post.create({
    data: {
      userId: user3.id,
      campaignId: campaign2.id,
      screenshotUrl: 'https://example.com/screenshot3.jpg',
      viewsCount: 380,
      resharesCount: 8,
      postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      screenshotUploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'PENDING',
      baseEarnings: 1.216, // (380/1000) * 3.2
      bonusEarnings: 0.18,
      totalEarnings: 2.396,
      deviceFingerprint: 'fp_user3_device',
    },
  });

  logger.info(`✅ Created ${3} test posts`);

  // Update campaign impressions
  await prisma.campaign.update({
    where: { id: campaign1.id },
    data: {
      currentImpressions: 1070, // 450 + 620
      spentBudget: 4.656, // 2.0 + 2.656
    },
  });

  // Create test payout
  const payout1 = await prisma.payout.create({
    data: {
      userId: user1.id,
      amount: 50.00,
      currency: 'USDT',
      method: 'MPESA',
      phoneNumber: user1.phoneNumber,
      postIds: [post1.id],
      status: 'COMPLETED',
      processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  logger.info(`✅ Created ${1} test payout`);

  // Update user stats
  await prisma.user.update({
    where: { id: user1.id },
    data: {
      campaignsCompleted: 1,
      totalViews: 450,
      totalReshares: 12,
      totalEarned: 50.00,
    },
  });

  await prisma.user.update({
    where: { id: user2.id },
    data: {
      campaignsCompleted: 1,
      totalViews: 620,
      totalReshares: 18,
    },
  });

  logger.info('🎉 Database seeded successfully!');
  logger.info('\n📝 Test Accounts:');
  logger.info('   Users:');
  logger.info(`   - ${user1.phoneNumber} (${user1.name}) - ${user1.tier}`);
  logger.info(`   - ${user2.phoneNumber} (${user2.name}) - ${user2.tier}`);
  logger.info(`   - ${user3.phoneNumber} (${user3.name}) - ${user3.tier}`);
  logger.info('   \n   Brands:');
  logger.info(`   - ${brand1.email} (${brand1.name})`);
  logger.info(`   - ${brand2.email} (${brand2.name})`);
  logger.info('   \n   Campaigns:');
  logger.info(`   - ${campaign1.name} (${campaign1.status})`);
  logger.info(`   - ${campaign2.name} (${campaign2.status})`);
  logger.info(`   - ${campaign3.name} (${campaign3.status})`);
}

main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




