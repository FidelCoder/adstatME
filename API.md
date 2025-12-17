# AdstatMe API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Users](#users-endpoints)
3. [Brands](#brands-endpoints)
4. [Campaigns](#campaigns-endpoints)
5. [Posts](#posts-endpoints)
6. [Payments](#payments-endpoints)

---

## Authentication Endpoints

### Send OTP
Send verification code to phone number.

**Endpoint:** `POST /auth/send-otp`

**Request Body:**
```json
{
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 900
  }
}
```

---

### Verify OTP
Verify OTP and authenticate user.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+254712345678",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phoneNumber": "+254712345678",
      "role": "USER",
      "name": null
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    },
    "isNewUser": true
  }
}
```

---

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token",
      "expiresIn": 900
    }
  }
}
```

---

### Logout
Invalidate refresh token.

**Endpoint:** `POST /auth/logout`

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

---

### Get Current User
Get authenticated user info.

**Endpoint:** `GET /auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "uuid",
      "role": "USER",
      "phoneNumber": "+254712345678"
    }
  }
}
```

---

## Users Endpoints

### Get Profile
Get current user's full profile.

**Endpoint:** `GET /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "phoneNumber": "+254712345678",
      "name": "John Doe",
      "tier": "BRONZE",
      "totalEarned": "125.50",
      "campaignsCompleted": 10,
      "totalViews": 5000,
      "reputationScore": "0.95"
    }
  }
}
```

---

### Update Profile
Update user profile information.

**Endpoint:** `PATCH /users/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Doe",
  "ageRange": "25-34",
  "locationCity": "Nairobi",
  "locationCountry": "KE",
  "interests": ["tech", "fashion", "sports"],
  "contactCount": 500,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

---

### Get User Stats
Get user statistics.

**Endpoint:** `GET /users/stats`

**Headers:** `Authorization: Bearer <token>`

---

### Get User Earnings
Get earnings breakdown.

**Endpoint:** `GET /users/earnings`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "earnings": {
      "totalEarned": "125.50",
      "pendingEarnings": "45.20",
      "lastPayout": {
        "amount": "80.30",
        "date": "2025-12-01T10:00:00Z"
      }
    }
  }
}
```

---

### Get User Activity
Get recent posts activity.

**Endpoint:** `GET /users/activity?limit=10`

**Headers:** `Authorization: Bearer <token>`

---

## Campaigns Endpoints

### Get Available Campaigns
Get active campaigns available for users.

**Endpoint:** `GET /campaigns/available?limit=20`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "name": "Summer Fashion Campaign",
        "creativeUrl": "https://...",
        "userCpm": "2.50",
        "flatFee": "0.50",
        "targetLocations": ["Nairobi", "Lagos"],
        "targetInterests": ["fashion", "lifestyle"]
      }
    ]
  }
}
```

---

### Create Campaign (Brand Only)
Create a new campaign.

**Endpoint:** `POST /campaigns`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Summer Fashion Campaign",
  "description": "Promote our new summer collection",
  "creativeUrl": "https://cdn.example.com/creative.jpg",
  "targetLocations": ["Nairobi", "Lagos", "Accra"],
  "targetAgeRanges": ["18-24", "25-34"],
  "targetInterests": ["fashion", "lifestyle", "beauty"],
  "minContacts": 200,
  "totalBudget": 1000,
  "cpm": 3.00,
  "userCpm": 2.50,
  "flatFee": 0.50,
  "maxPosters": 100,
  "targetImpressions": 50000
}
```

---

### Get Campaign
Get campaign details.

**Endpoint:** `GET /campaigns/:id`

**Headers:** `Authorization: Bearer <token>`

---

### List My Campaigns (Brand Only)
List brand's campaigns.

**Endpoint:** `GET /campaigns?status=ACTIVE&limit=20`

**Headers:** `Authorization: Bearer <token>`

---

### Update Campaign Status (Brand Only)
Update campaign status.

**Endpoint:** `PATCH /campaigns/:id/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

---

### Get Campaign Stats (Brand Only)
Get campaign performance statistics.

**Endpoint:** `GET /campaigns/:id/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalImpressions": 25000,
      "uniquePosters": 45,
      "totalReshares": 320,
      "spentBudget": "500.00",
      "remainingBudget": "500.00",
      "avgViewsPerPost": 556,
      "completionRate": 50
    }
  }
}
```

---

### Get Matched Users (Brand Only)
Get users matched to campaign.

**Endpoint:** `GET /campaigns/:id/matches?limit=100`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "userId": "uuid",
        "score": 0.85,
        "reasons": ["Location match", "2 interest match(es)", "High view rate"]
      }
    ]
  }
}
```

---

## Posts Endpoints

### Claim Campaign
Create a post (claim a campaign).

**Endpoint:** `POST /posts`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "campaignId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "campaignId": "uuid",
      "status": "PENDING",
      "createdAt": "2025-12-10T10:00:00Z"
    }
  }
}
```

---

### Upload Screenshot
Submit screenshot for verification.

**Endpoint:** `POST /posts/:id/screenshot`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "screenshotUrl": "https://storage.example.com/screenshot.jpg",
  "viewsCount": 450,
  "resharesCount": 12,
  "postedAt": "2025-12-10T09:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "uuid",
      "status": "PENDING",
      "viewsCount": 450,
      "totalEarnings": "1.625"
    }
  }
}
```

---

### Get Post
Get post details.

**Endpoint:** `GET /posts/:id`

**Headers:** `Authorization: Bearer <token>`

---

### List My Posts
Get user's posts.

**Endpoint:** `GET /posts?limit=20&cursor=uuid`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "nextCursor": "uuid",
    "hasMore": true
  }
}
```

---

### List Campaign Posts (Brand Only)
Get all posts for a campaign.

**Endpoint:** `GET /posts/campaign/:campaignId?limit=50`

**Headers:** `Authorization: Bearer <token>`

---

### Verify Post (Admin Only)
Manually verify or reject a post.

**Endpoint:** `POST /posts/:id/verify`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "VERIFIED",
  "verificationNotes": "Looks good!"
}
```

---

## Payments Endpoints

### Get Balance
Get available balance for payout.

**Endpoint:** `GET /payments/balance`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "45.20"
  }
}
```

---

### Request Payout
Request a payout.

**Endpoint:** `POST /payments/payouts`

**Headers:** `Authorization: Bearer <token>`

**Request Body (Crypto):**
```json
{
  "method": "NEXUSPAY",
  "amount": 40.00,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "polygon"
}
```

**Request Body (M-Pesa):**
```json
{
  "method": "MPESA",
  "amount": 40.00,
  "phoneNumber": "+254712345678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payout": {
      "id": "uuid",
      "amount": "40.00",
      "method": "NEXUSPAY",
      "status": "PENDING",
      "createdAt": "2025-12-10T10:00:00Z"
    }
  }
}
```

---

### Get Payout
Get payout details.

**Endpoint:** `GET /payments/payouts/:id`

**Headers:** `Authorization: Bearer <token>`

---

### List Payouts
Get user's payout history.

**Endpoint:** `GET /payments/payouts?limit=20`

**Headers:** `Authorization: Bearer <token>`

---

### Get Payout Stats
Get payout statistics.

**Endpoint:** `GET /payments/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalPaidOut": "500.00",
      "pendingPayouts": "40.00",
      "completedPayouts": 5,
      "failedPayouts": 0
    }
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Not authorized for this action
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., duplicate)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INSUFFICIENT_BALANCE` - Not enough balance
- `CAMPAIGN_FULL` - Campaign reached max posters

---

## Rate Limits

- Global: 100 requests/minute per IP
- Auth endpoints: 5 requests/15 minutes per IP
- Upload endpoints: 10 requests/hour per user

---

## User Roles

- `USER` - Regular users who post WhatsApp Status
- `BRAND` - Brand accounts who create campaigns
- `ADMIN` - Platform administrators

---

## Pagination

List endpoints support cursor-based pagination:

**Query Parameters:**
- `limit` - Number of items (max 100)
- `cursor` - Cursor from previous response

**Response:**
```json
{
  "items": [...],
  "nextCursor": "uuid",
  "hasMore": true
}
```




