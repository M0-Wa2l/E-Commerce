# E-commerce API (Node.js + Express + MongoDB)

## Setup
```bash
npm install
cp .env.example .env     # then edit MONGO_URI and JWT_SECRET
npm run seed             # optional: sample products + admin/user accounts
npm run dev              # or: npm start
```
Seed accounts: `admin@example.com / admin123` and `user@example.com / user123`.

## Endpoints
All routes are prefixed with `/api`. Send `Authorization: Bearer <token>` for protected routes.

| Method | Route | Access | Description |
|---|---|---|---|
| POST | /auth/register | Public | Create account `{name,email,password}` |
| POST | /auth/login | Public | Login `{email,password}` |
| GET/PUT | /auth/me | User | Get / update profile |
| GET | /products | Public | List. Query: `search, category, minPrice, maxPrice, sort, page, limit` |
| GET | /products/categories | Public | Distinct categories |
| GET | /products/:id | Public | Single product |
| POST | /products | Admin | Create product |
| PUT/DELETE | /products/:id | Admin | Update / soft-delete |
| GET | /cart | User | View cart with subtotal |
| POST | /cart | User | Add item `{productId, quantity}` |
| PUT/DELETE | /cart/:productId | User | Change quantity / remove item |
| DELETE | /cart | User | Clear cart |
| POST | /orders | User | Place order from cart `{shippingAddress, paymentMethod}` |
| GET | /orders/mine | User | My orders |
| GET | /orders/:id | Owner/Admin | Order details |
| PUT | /orders/:id/pay | Owner | Mock payment |
| PUT | /orders/:id/cancel | Owner/Admin | Cancel + restock |
| GET | /orders | Admin | All orders (`?status=`) |
| PUT | /orders/:id/status | Admin | `{status}` pending → processing → shipped → delivered |

## Example order body
```json
{
  "shippingAddress": {
    "fullName": "Medo", "phone": "01000000000",
    "address": "12 Main St", "city": "Zagazig", "country": "Egypt"
  },
  "paymentMethod": "cod"
}
```

## Design notes
- Passwords hashed with bcrypt; JWT auth; role comes only from the DB (never from request body).
- Order prices are calculated server-side from the database.
- Stock is decremented atomically (`stock >= qty` condition) to prevent overselling, with rollback on failure.
- Products are soft-deleted so old orders stay intact.
- Helmet, CORS, and rate limiting are enabled.

## Ideas to extend
Stripe payments, product reviews, image uploads (Multer + Cloudinary), email verification, refresh tokens, wishlists, coupons, tests (Jest + Supertest).
