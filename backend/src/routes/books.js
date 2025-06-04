const express = require('express');
const {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook,
    searchBooks
} = require('../controllers/bookController');
const { createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { 
    validateBook,
    validateReview,
    validatePagination,
    validateSearch,
    validateBookFilters,
    validateObjectId
} = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/books
// @desc    Create a new book
// @access  Private
router.post('/books', protect, validateBook, createBook);

// @route   GET /api/books
// @desc    Get all books with pagination and filters
// @access  Public
router.get('/books', validatePagination, validateBookFilters, getAllBooks);

// @route   GET /api/search
// @desc    Search books by title or author
// @access  Public
router.get('/search', validateSearch, validatePagination, searchBooks);

// @route   GET /api/books/:id
// @desc    Get single book by ID with reviews
// @access  Public
router.get('/books/:id', validateObjectId('id'), getBookById);

// @route   PUT /api/books/:id
// @desc    Update a book
// @access  Private (Only book creator)
router.put('/books/:id', protect, validateObjectId('id'), validateBook, updateBook);

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private (Only book creator)
router.delete('/books/:id', protect, validateObjectId('id'), deleteBook);

// @route   POST /api/books/:id/reviews
// @desc    Submit a review for a book
// @access  Private
router.post('/books/:id/reviews', protect, validateObjectId('id'), validateReview, createReview);

module.exports = router;