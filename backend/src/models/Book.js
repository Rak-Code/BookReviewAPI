const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Book title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true,
        maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    genre: {
        type: String,
        required: [true, 'Genre is required'],
        trim: true,
        maxlength: [50, 'Genre cannot exceed 50 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    publicationDate: {
        type: Date,
        required: [true, 'Publication date is required']
    },
    isbn: {
        type: String,
        trim: true,
        sparse: true, // Allows multiple documents to have null/undefined ISBN
        match: [/^[\d-]{10,17}$/, 'Please enter a valid ISBN']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Virtual field for average rating will be calculated
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
bookSchema.index({ title: 'text', author: 'text' }); // Text search
bookSchema.index({ author: 1 });
bookSchema.index({ genre: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ averageRating: -1 });

// Virtual populate for reviews
bookSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'bookId'
});

// Static method to search books
bookSchema.statics.searchBooks = function(searchTerm, type = 'both') {
    const query = {};
    
    if (type === 'title') {
        query.title = { $regex: searchTerm, $options: 'i' };
    } else if (type === 'author') {
        query.author = { $regex: searchTerm, $options: 'i' };
    } else {
        query.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { author: { $regex: searchTerm, $options: 'i' } }
        ];
    }
    
    return this.find(query);
};

// Method to update rating statistics
bookSchema.methods.updateRatingStats = async function() {
    const Review = mongoose.model('Review');
    
    const stats = await Review.aggregate([
        { $match: { bookId: this._id } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    
    if (stats.length > 0) {
        this.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
        this.totalReviews = stats[0].totalReviews;
    } else {
        this.averageRating = 0;
        this.totalReviews = 0;
    }
    
    return this.save();
};

module.exports = mongoose.model('Book', bookSchema);