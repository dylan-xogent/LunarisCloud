# LunarisCloud API Documentation

## Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.lunaris.win/api`

## Authentication
All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "plan": "FREE",
    "emailVerified": true
  }
}
```

#### POST /auth/verify-email
Verify email address with token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

#### POST /auth/resend-verification
Resend email verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### User Management

#### GET /users/profile
Get current user profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "plan": "FREE",
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PATCH /users/profile
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith"
}
```

#### GET /users/quota
Get user quota information.

**Response:**
```json
{
  "usedBytes": "1073741824",
  "totalBytes": "16106127360",
  "usedPercentage": 6.67,
  "plan": "FREE"
}
```

### Folders

#### POST /folders
Create a new folder.

**Request Body:**
```json
{
  "name": "My Documents",
  "parentId": "optional_parent_folder_id"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Documents",
  "parentId": null,
  "userId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "deletedAt": null,
  "_count": {
    "children": 0,
    "files": 0
  }
}
```

#### GET /folders/:id
Get folder details.

#### GET /folders/:id/children
Get folder contents with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "folders": [...],
  "files": [...],
  "total": 25,
  "page": 1,
  "limit": 50
}
```

#### GET /folders/:id/breadcrumbs
Get folder breadcrumb navigation.

**Response:**
```json
[
  {
    "id": "root_folder_id",
    "name": "Root",
    "parentId": null
  },
  {
    "id": "parent_folder_id",
    "name": "Documents",
    "parentId": "root_folder_id"
  },
  {
    "id": "current_folder_id",
    "name": "Work",
    "parentId": "parent_folder_id"
  }
]
```

#### PATCH /folders/:id
Update folder (rename or move).

**Request Body:**
```json
{
  "name": "New Name",
  "parentId": "new_parent_id"
}
```

#### DELETE /folders/:id
Delete folder (soft delete).

### Files

#### POST /files/upload/initiate
Initiate file upload.

**Request Body:**
```json
{
  "folderId": "optional_folder_id",
  "name": "document.pdf",
  "size": 1048576,
  "mimeType": "application/pdf"
}
```

**Response:**
```json
{
  "uploadId": "multipart_upload_id",
  "parts": [
    {
      "partNumber": 1,
      "presignedUrl": "https://minio.example.com/..."
    }
  ],
  "s3Key": "user_id/filename.pdf"
}
```

#### POST /files/upload/complete
Complete file upload.

**Request Body:**
```json
{
  "uploadId": "multipart_upload_id",
  "etag": "etag_from_s3"
}
```

#### GET /files
Get files with pagination.

**Query Parameters:**
- `folderId` (optional): Filter by folder
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### GET /files/:id
Get file details.

#### PATCH /files/:id
Update file (rename or move).

**Request Body:**
```json
{
  "name": "new_filename.pdf",
  "folderId": "new_folder_id"
}
```

#### DELETE /files/:id
Delete file (soft delete).

#### GET /files/:id/download
Get download URL.

**Response:**
```json
{
  "downloadUrl": "https://minio.example.com/presigned_url",
  "fileName": "document.pdf",
  "contentType": "application/pdf"
}
```

### Trash Management

#### GET /files/trash
Get trash contents.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### POST /files/trash/empty
Empty trash (permanently delete all items).

#### POST /files/trash/:id/restore
Restore item from trash.

#### POST /files/reconcile
Reconcile user's used bytes.

### Shares

#### POST /shares
Create a share link.

**Request Body:**
```json
{
  "fileId": "file_id_here",
  "password": "optional_password",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxDownloads": 10
}
```

**Response:**
```json
{
  "id": "share_id",
  "fileId": "file_id",
  "userId": "user_id",
  "password": null,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxDownloads": 10,
  "downloadCount": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "file": {
    "id": "file_id",
    "name": "document.pdf",
    "size": 1048576
  }
}
```

#### GET /shares
Get user's shares.

#### DELETE /shares/:id
Delete a share.

### Public Share Access

#### GET /shares/s/:id
Get public share information.

**Response:**
```json
{
  "id": "share_id",
  "fileId": "file_id",
  "requiresPassword": false,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxDownloads": 10,
  "downloadCount": 5,
  "file": {
    "id": "file_id",
    "name": "document.pdf",
    "size": 1048576,
    "mimeType": "application/pdf"
  }
}
```

#### POST /shares/s/:id/validate
Validate share password.

**Request Body:**
```json
{
  "password": "share_password"
}
```

#### POST /shares/s/:id/download
Increment download count.

### Health & Monitoring

#### GET /health
Get system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "memory": {
    "used": 52428800,
    "total": 1073741824,
    "percentage": 4.88
  }
}
```

#### GET /health/detailed
Get detailed health information (requires authentication).

#### GET /health/metrics
Get system metrics.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute
- General API endpoints: 100 requests per minute

## File Upload Process

1. **Initiate Upload**: Call `POST /files/upload/initiate` with file metadata
2. **Upload Parts**: Use the returned presigned URLs to upload file parts directly to S3
3. **Complete Upload**: Call `POST /files/upload/complete` with the upload ID and ETag

## Quota Enforcement

- Free tier: 15GB
- Pro tier: 100GB
- Quota is checked before upload initiation
- Quota is updated after successful upload completion

## Security Features

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt
- Email verification required for account activation
- Rate limiting on sensitive endpoints
- CORS protection
- Helmet security headers
- Input validation with class-validator
- SQL injection protection via Prisma ORM
