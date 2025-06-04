const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'Book ID is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    reviewText: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters long'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index to ensure one review per user per book
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

// Indexes for queries
reviewSchema.index({ bookId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Virtual populate for user info
reviewSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for book info
reviewSchema.virtual('book', {
    ref: 'Book',
    localField: 'bookId',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware to prevent duplicate reviews
reviewSchema.pre('save', async function(next) {
    // Only check for duplicates on new documents
    if (!this.isNew) return next();
    
    try {
        const existingReview = await this.constructor.findOne({
            bookId: this.bookId,
            userId: this.userId
        });
        
        if (existingReview) {
            const error = new Error('You have already reviewed this book');
            error.status = 400;
            return next(error);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Post-save middleware to update book rating stats
reviewSchema.post('save', async function(doc) {
    try {
        const Book = mongoose.model('Book');
        const book = await Book.findById(doc.bookId);
        if (book) {
            await book.updateRatingStats();
        }
    } catch (error) {
        console.error('Error updating book rating stats:', error);
    }
});

// Post-remove middleware to update book rating stats
reviewSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        try {
            const Book = mongoose.model('Book');
            const book = await Book.findById(doc.bookId);
            if (book) {
                await book.updateRatingStats();
            }
        } catch (error) {
            console.error('Error updating book rating stats after deletion:', error);
        }
    }
});

// Static method to get reviews for a book with pagination
reviewSchema.statics.getBookReviews = function(bookId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return this.find({ bookId })
        .populate('userId', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Static method to get user's reviews
reviewSchema.statics.getUserReviews = function(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    return this.find({ userId })
        .populate('bookId', 'title author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema);