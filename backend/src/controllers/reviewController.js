const Review = require('../models/Review');
const Book = require('../models/Book');
const mongoose = require('mongoose');

// @desc    Submit a review for a book
// @route   POST /api/books/:id/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const bookId = req.params.id;
        const { rating, reviewText } = req.body;
        const userId = req.user._id;

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                status: 'error',
                message: 'Book not found'
            });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({ bookId, userId });
        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'You have already reviewed this book'
            });
        }

        // Create new review
        const review = new Review({
            bookId,
            userId,
            rating,
            reviewText
        });

        await review.save();

        // Populate user information
        await review.populate('userId', 'username');

        res.status(201).json({
            status: 'success',
            message: 'Review submitted successfully',
            data: {
                review
            }
        });

    } catch (error) {
        console.error('Create review error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: messages
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid book ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating review'
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Only review owner)
const updateReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { rating, reviewText } = req.body;
        const userId = req.user._id;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only update your own reviews'
            });
        }

        // Update review fields
        review.rating = rating !== undefined ? rating : review.rating;
        review.reviewText = reviewText !== undefined ? reviewText : review.reviewText;

        await review.save();

        // Populate user information
        await review.populate('userId', 'username');

        res.status(200).json({
            status: 'success',
            message: 'Review updated successfully',
            data: {
                review
            }
        });

    } catch (error) {
        console.error('Update review error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: messages
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating review'
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Only review owner)
const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user._id;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only delete your own reviews'
            });
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        res.status(200).json({
            status: 'success',
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('Delete review error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting review'
        });
    }
};

// @desc    Get all reviews for a book
// @route   GET /api/books/:bookId/reviews
const getBookReviews = async (req, res) => {
    try {
        const bookId = req.params.bookId;
        const reviews = await Review.find({ bookId })
            .populate('userId', 'username')
            .sort('-createdAt');

        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching book reviews'
        });
    }
};

// @desc    Get all reviews by a user
// @route   GET /api/reviews/user/:userId
const getUserReviews = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalReviews = await Review.countDocuments({ userId });
        const totalPages = Math.ceil(totalReviews / limit);

        // Get reviews with pagination
        const reviews = await Review.find({ userId })
            .populate('bookId', 'title author averageRating')
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: 'success',
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalReviews,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get user reviews error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching user reviews'
        });
    }
};

// @desc    Get a single review
// @route   GET /api/reviews/:id
const getReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('userId', 'username')
            .populate('bookId', 'title author');

        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching review'
        });
    }
};

// @desc    Toggle like/unlike a review
// @route   POST /api/reviews/:id/like
const toggleLikeReview = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        // Initialize likes array if it doesn't exist
        if (!review.likes) {
            review.likes = [];
        }

        // Toggle like
        const userLikeIndex = review.likes.indexOf(userId);
        if (userLikeIndex === -1) {
            review.likes.push(userId);
        } else {
            review.likes.splice(userLikeIndex, 1);
        }

        await review.save();

        res.status(200).json({
            status: 'success',
            message: userLikeIndex === -1 ? 'Review liked' : 'Review unliked',
            data: { likes: review.likes.length }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error toggling review like'
        });
    }
};

// @desc    Get review statistics for a book
// @route   GET /api/books/:bookId/reviews/stats
const getReviewStats = async (req, res) => {
    try {
        const bookId = req.params.bookId;
        
        const stats = await Review.aggregate([
            { $match: { bookId: new mongoose.Types.ObjectId(bookId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    numReviews: { $sum: 1 },
                    numRatings: {
                        $push: {
                            rating: '$rating'
                        }
                    }
                }
            },
            {
                $addFields: {
                    ratingDistribution: {
                        1: { $size: { $filter: { input: '$numRatings', as: 'item', cond: { $eq: ['$$item.rating', 1] } } } },
                        2: { $size: { $filter: { input: '$numRatings', as: 'item', cond: { $eq: ['$$item.rating', 2] } } } },
                        3: { $size: { $filter: { input: '$numRatings', as: 'item', cond: { $eq: ['$$item.rating', 3] } } } },
                        4: { $size: { $filter: { input: '$numRatings', as: 'item', cond: { $eq: ['$$item.rating', 4] } } } },
                        5: { $size: { $filter: { input: '$numRatings', as: 'item', cond: { $eq: ['$$item.rating', 5] } } } }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    avgRating: { $round: ['$avgRating', 1] },
                    numReviews: 1,
                    ratingDistribution: 1
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats: stats[0] || { avgRating: 0, numReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching review statistics'
        });
    }
};

// @desc    Get current user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalReviews = await Review.countDocuments({ userId });
        const totalPages = Math.ceil(totalReviews / limit);

        // Get reviews with pagination
        const reviews = await Review.find({ userId })
            .populate('bookId', 'title author averageRating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: 'success',
            data: {
                reviews,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalReviews,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching your reviews'
        });
    }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = async (req, res) => {
    try {
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId)
            .populate('userId', 'username')
            .populate('bookId', 'title author');

        if (!review) {
            return res.status(404).json({
                status: 'error',
                message: 'Review not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                review
            }
        });

    } catch (error) {
        console.error('Get review by ID error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid review ID format'
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching review'
        });
    }
};

module.exports = {
    createReview,
    updateReview,
    deleteReview,
    getUserReviews,
    getMyReviews,
    getReviewById,
    getBookReviews,
    getReview,
    toggleLikeReview,
    getReviewStats
};