const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { validateReview } = require('../middleware/validation');

// @desc    Get all reviews for a book
// @route   GET /api/books/:bookId/reviews
router.get('/', reviewController.getBookReviews);

// @desc    Get all reviews by a user
// @route   GET /api/reviews/user/:userId
router.get('/user/:userId', reviewController.getUserReviews);

// @desc    Get a single review
// @route   GET /api/reviews/:id
router.get('/:id', reviewController.getReview);

// @desc    Create a new review
// @route   POST /api/books/:bookId/reviews
router.post(
    '/',
    protect,
    validateReview,
    reviewController.createReview
);

// @desc    Update a review
// @route   PUT /api/reviews/:id
router.put(
    '/:id',
    protect,
    validateReview,
    reviewController.updateReview
);

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
router.delete(
    '/:id',
    protect,
    reviewController.deleteReview
);

// @desc    Like/Unlike a review
// @route   POST /api/reviews/:id/like
router.post(
    '/:id/like',
    protect,
    reviewController.toggleLikeReview
);

// @desc    Get review statistics for a book
// @route   GET /api/books/:bookId/reviews/stats
router.get('/stats', reviewController.getReviewStats);

module.exports = router;