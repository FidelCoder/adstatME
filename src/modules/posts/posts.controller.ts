import { Request, Response } from 'express';
import { PostsService } from './posts.service';
import { createPostSchema, uploadScreenshotSchema, verifyPostSchema } from './posts.types';
import { asyncHandler } from '@shared/middleware/async-handler';
import { AppError } from '@shared/errors/app-error';
import type { ApiResponse } from '@shared/types';

export class PostsController {
  private postsService: PostsService;

  constructor() {
    this.postsService = new PostsService();
  }

  /**
   * POST /api/v1/posts
   * Create a new post (claim campaign)
   */
  createPost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const validatedData = createPostSchema.parse(req.body);
    const post = await this.postsService.createPost(req.user.userId, validatedData);

    const response: ApiResponse = {
      success: true,
      data: { post },
    };

    res.status(201).json(response);
  });

  /**
   * POST /api/v1/posts/:id/screenshot
   * Upload screenshot for post
   */
  uploadScreenshot = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const postId = req.params.id;
    const validatedData = uploadScreenshotSchema.parse(req.body);

    const post = await this.postsService.uploadScreenshot(
      postId,
      req.user.userId,
      validatedData
    );

    const response: ApiResponse = {
      success: true,
      data: { post },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/posts/:id
   * Get post by ID
   */
  getPost = asyncHandler(async (req: Request, res: Response) => {
    const postId = req.params.id;
    const userId = req.user?.userId;

    const post = await this.postsService.getPost(postId, userId);

    const response: ApiResponse = {
      success: true,
      data: { post },
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/posts
   * List user's posts
   */
  listUserPosts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await this.postsService.listUserPosts(req.user.userId, limit, cursor);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/v1/posts/campaign/:campaignId
   * List campaign posts (for brands)
   */
  listCampaignPosts = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const campaignId = req.params.campaignId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const posts = await this.postsService.listCampaignPosts(
      campaignId,
      req.user.userId,
      limit
    );

    const response: ApiResponse = {
      success: true,
      data: { posts },
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/v1/posts/:id/verify
   * Verify post (admin only for now)
   */
  verifyPost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const postId = req.params.id;
    const validatedData = verifyPostSchema.parse(req.body);

    const post = await this.postsService.verifyPost(
      postId,
      validatedData.status,
      'manual', // verifiedBy
      validatedData.verificationNotes
    );

    const response: ApiResponse = {
      success: true,
      data: { post },
    };

    res.status(200).json(response);
  });

  /**
   * DELETE /api/v1/posts/:id
   * Delete post (before submission)
   */
  deletePost = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const postId = req.params.id;
    await this.postsService.deletePost(postId, req.user.userId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Post deleted successfully' },
    };

    res.status(200).json(response);
  });
}

