# Book Review API

A RESTful API for a Book Review system built with Node.js, Express, and MongoDB. This backend allows users to register, authenticate, manage books, write reviews, and interact with book and review data securely.

---

## Features
- User registration and authentication (JWT)
- CRUD operations for books
- Submit, update, delete, and like/unlike reviews
- Pagination, filtering, and search for books and reviews
- Validation and error handling
- Ready for Postman testing and frontend integration

---

## Project Structure
```
backend/
├── src/
│   ├── controllers/   # Route handlers (auth, books, reviews)
│   ├── middleware/    # Validation and authentication
│   ├── models/        # Mongoose schemas (User, Book, Review)
│   ├── routes/        # API route definitions
│   ├── utils/         # Utility functions (e.g., database connection)
│   └── app.js         # Main Express app
├── .env.example       # Example environment variables
├── package.json       # Dependencies and scripts
└── README.md          # Project documentation
```

---

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
- Copy `.env.example` to `.env` and fill in your values:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bookreview
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the server
```bash
npm run dev   # For development (nodemon)
# or
npm start     # For production
```

The API will be running at `http://localhost:3000` (or your chosen port).

---

## API Endpoints & Schemas

### **Auth**

#### Register
- **POST** `/api/auth/signup`
- **Body:**
```json
{
  "username": "user_name1",   // 3-30 chars, letters/numbers/underscores only
  "email": "user@example.com",// valid email
  "password": "Password123"   // min 6 chars, at least 1 uppercase, 1 lowercase, 1 number
}
```

#### Login
- **POST** `/api/auth/login`
- **Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

#### Get Current User Profile
- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`

---

### **Books**

#### Create Book
- **POST** `/api/books`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "title": "Book Title",           // required, max 200 chars
  "author": "Author Name",         // required, max 100 chars
  "genre": "Genre",                // required, max 50 chars
  "description": "Book desc...",   // required, max 2000 chars
  "publicationDate": "2023-01-01", // ISO8601, not in future
  "isbn": "123-4567890123"         // optional, 10-17 digits/hyphens
}
```

#### Get All Books
- **GET** `/api/books`
- **Query:** `page`, `limit`, `author`, `genre`

#### Search Books
- **GET** `/api/search`
- **Query:** `q` (required), `type` (title|author|both), `page`, `limit`

#### Get Book by ID (with Reviews)
- **GET** `/api/books/:id`
- **Params:** `id` (MongoDB ObjectId)
- **Query:** `reviewPage`, `reviewLimit` (for paginated reviews)

#### Update Book
- **PUT** `/api/books/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (same as create)

#### Delete Book
- **DELETE** `/api/books/:id`
- **Headers:** `Authorization: Bearer <token>`

---

### **Reviews**

#### Create Review for a Book
- **POST** `/api/books/:id/reviews`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "rating": 5,                  // integer 1-5
  "reviewText": "Great book!"   // 10-1000 chars
}
```

#### Get All Reviews for a Book
- **GET** `/api/books/:bookId/reviews`
- **Params:** `bookId` (MongoDB ObjectId)
- **Query:** `page`, `limit`

#### Get All Reviews by a User
- **GET** `/api/reviews/user/:userId`
- **Params:** `userId` (MongoDB ObjectId)
- **Query:** `page`, `limit`

#### Get Current User's Reviews
- **GET** `/api/reviews/my-reviews`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page`, `limit`

#### Get Single Review by ID
- **GET** `/api/reviews/:id`
- **Params:** `id` (MongoDB ObjectId)

#### Update Review
- **PUT** `/api/reviews/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (same as create review)

#### Delete Review
- **DELETE** `/api/reviews/:id`
- **Headers:** `Authorization: Bearer <token>`

#### Like/Unlike a Review
- **POST** `/api/reviews/:id/like`
- **Headers:** `Authorization: Bearer <token>`

#### Get Review Statistics for a Book
- **GET** `/api/books/:bookId/reviews/stats`
- **Params:** `bookId` (MongoDB ObjectId)

---

## Data Models

### User
```js
{
  username: String, // 3-30 chars, unique
  email: String,    // valid, unique
  password: String, // hashed, min 6 chars
  createdAt: Date,
  updatedAt: Date
}
```

### Book
```js
{
  title: String,           // required, max 200
  author: String,          // required, max 100
  genre: String,           // required, max 50
  description: String,     // required, max 2000
  publicationDate: Date,   // required
  isbn: String,            // optional, 10-17 digits/hyphens
  createdBy: ObjectId,     // User
  averageRating: Number,   // auto
  totalReviews: Number,    // auto
  createdAt: Date,
  updatedAt: Date
}
```

### Review
```js
{
  bookId: ObjectId,        // Book
  userId: ObjectId,        // User
  rating: Number,          // 1-5
  reviewText: String,      // 10-1000 chars
  likes: [ObjectId],       // Users who liked
  createdAt: Date,
  updatedAt: Date
}
```

---

## Validation Rules
- All endpoints use strong validation (see `src/middleware/validation.js`).
- Common rules:
  - **Username:** 3-30 chars, only letters, numbers, underscores
  - **Email:** valid format
  - **Password:** min 6 chars, at least 1 uppercase, 1 lowercase, 1 number
  - **Book fields:** required, max lengths, valid date, optional ISBN
  - **Review:** rating 1-5, reviewText 10-1000 chars
  - **Pagination:** `page` and `limit` must be positive integers

---

## Error Handling
- All errors return JSON with `status: 'error'` and a descriptive `message`.
- Validation errors return an array of error details.

---

## Testing with Postman
- Import the above endpoints and schemas into Postman.
- For protected routes, first register/login and use the returned JWT token in the `Authorization` header as `Bearer <token>`.
- Use the example request bodies and query parameters as shown above.

---

## License
MIT

---

## Author
Rakesh Gupta 