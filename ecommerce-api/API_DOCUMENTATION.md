# API Documentation

Base URL: `http://localhost:5000/api` (Development)  
Production: `https://your-domain.com/api`

All responses follow this format:
```json
{
  "success": true,
  "data": "..."
}
```

Errors:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

Most endpoints require authentication. Include the token in the header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK` (same format as register)

### Get Current User
**GET** `/auth/me`  
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Update Profile
**PUT** `/auth/me`  
**Auth:** Required

**Body:**
```json
{
  "name": "Jane Doe",
  "currentPassword": "oldpassword",
  "password": "newpassword"
}
```

---

## 🛍️ Product Endpoints

### List Products
**GET** `/products`

**Query Parameters:**
- `search` - Search in name/description
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sort` - Sort by: `price`, `-price`, `name`, `-name`, `createdAt`, `-createdAt`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12, max: 100)

**Example:**
```
GET /products?category=Electronics&minPrice=100&maxPrice=500&sort=-price&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "total": 45,
  "page": 1,
  "pages": 4,
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Laptop",
      "description": "High-performance laptop",
      "price": 999.99,
      "category": "Electronics",
      "brand": "TechBrand",
      "stock": 50,
      "images": ["url1.jpg", "url2.jpg"],
      "isActive": true,
      "createdAt": "2026-10-01T00:00:00.000Z",
      "updatedAt": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

### Get Categories
**GET** `/products/categories`

**Response:**
```json
{
  "success": true,
  "categories": ["Electronics", "Clothing", "Books"]
}
```

### Get Single Product
**GET** `/products/:id`

**Response:**
```json
{
  "success": true,
  "product": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "Electronics",
    "brand": "TechBrand",
    "stock": 50,
    "images": ["url1.jpg"],
    "isActive": true
  }
}
```

### Create Product
**POST** `/products`  
**Auth:** Admin only

**Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 49.99,
  "category": "Electronics",
  "brand": "BrandName",
  "stock": 100,
  "images": ["image1.jpg", "image2.jpg"]
}
```

### Update Product
**PUT** `/products/:id`  
**Auth:** Admin only

**Body:** (partial update supported)
```json
{
  "price": 39.99,
  "stock": 150
}
```

### Delete Product
**DELETE** `/products/:id`  
**Auth:** Admin only

Soft deletes the product (sets `isActive: false`)

---

## 🛒 Cart Endpoints

### Get Cart
**GET** `/cart`  
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "cart": {
    "id": "507f1f77bcf86cd799439011",
    "items": [
      {
        "product": {
          "_id": "507f191e810c19729de860ea",
          "name": "Laptop",
          "price": 999.99,
          "images": ["laptop.jpg"],
          "stock": 50
        },
        "quantity": 2
      }
    ],
    "subtotal": 1999.98
  }
}
```

### Add Item to Cart
**POST** `/cart`  
**Auth:** Required

**Body:**
```json
{
  "productId": "507f191e810c19729de860ea",
  "quantity": 2
}
```

### Update Item Quantity
**PUT** `/cart/:productId`  
**Auth:** Required

**Body:**
```json
{
  "quantity": 3
}
```

### Remove Item
**DELETE** `/cart/:productId`  
**Auth:** Required

### Clear Cart
**DELETE** `/cart`  
**Auth:** Required

---

## 📦 Order Endpoints

### Create Order
**POST** `/orders`  
**Auth:** Required

Creates order from current cart items and clears the cart.

**Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "01234567890",
    "address": "123 Main Street",
    "city": "New York",
    "postalCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "cod"
}
```

**Payment Methods:** `cod` (Cash on Delivery), `card`

**Response:** `201 Created`
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f191e810c19729de860ea",
    "items": [...],
    "shippingAddress": {...},
    "paymentMethod": "cod",
    "itemsPrice": 1999.98,
    "shippingPrice": 10,
    "totalPrice": 2009.98,
    "status": "pending",
    "isPaid": false,
    "createdAt": "2026-10-04T00:00:00.000Z"
  }
}
```

### Get My Orders
**GET** `/orders/mine`  
**Auth:** Required

### Get Order Details
**GET** `/orders/:id`  
**Auth:** Required (owner or admin)

### Pay Order (Mock)
**PUT** `/orders/:id/pay`  
**Auth:** Required (owner only)

Marks order as paid (mock payment for development)

### Cancel Order
**PUT** `/orders/:id/cancel`  
**Auth:** Required (owner or admin)

Cancels order and restocks products. Only works for `pending` or `processing` orders.

---

## 👑 Admin Endpoints

### Get All Orders
**GET** `/orders`  
**Auth:** Admin only

**Query Parameters:**
- `status` - Filter by status: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Update Order Status
**PUT** `/orders/:id/status`  
**Auth:** Admin only

**Body:**
```json
{
  "status": "processing"
}
```

**Valid Transitions:**
- `pending` → `processing` or `cancelled`
- `processing` → `shipped` or `cancelled`
- `shipped` → `delivered`
- `delivered` → (final state)
- `cancelled` → (final state)

When status changes to `delivered`:
- Sets `deliveredAt` timestamp
- For COD orders, marks as paid

---

## 📊 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 🔒 Rate Limiting

- General API: 300 requests per 15 minutes
- Auth endpoints: 30 requests per 15 minutes

---

## 💡 Notes

- Free shipping on orders over $100
- Shipping fee: $10 for orders under $100
- Stock is validated and decremented atomically
- Soft-deleted products remain visible in old orders
- All prices are calculated server-side
- Admin users must be created via database or seed script
