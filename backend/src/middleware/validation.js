const { body, query, param, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User validation rules
const validateSignup = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Book validation rules
const validateBook = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Book title is required')
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
    
    body('author')
        .trim()
        .notEmpty()
        .withMessage('Author is required')
        .isLength({ max: 100 })
        .withMessage('Author name cannot exceed 100 characters'),
    
    body('genre')
        .trim()
        .notEmpty()
        .withMessage('Genre is required')
        .isLength({ max: 50 })
        .withMessage('Genre cannot exceed 50 characters'),
    
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
    
    body('publicationDate')
        .isISO8601()
        .withMessage('Please provide a valid publication date')
        .custom((value) => {
            const date = new Date(value);
            const now = new Date();
            if (date > now) {
                throw new Error('Publication date cannot be in the future');
            }
            return true;
        }),
    
    body('isbn')
        .optional()
        .matches(/^[\d-]{10,17}$/)
        .withMessage('Please provide a valid ISBN'),
    
    handleValidationErrors
];

// Review validation rules
const validateReview = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    
    body('reviewText')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Review text must be between 10 and 1000 characters'),
    
    handleValidationErrors
];

// Query validation rules
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    handleValidationErrors
];

const validateSearch = [
    query('q')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    query('type')
        .optional()
        .isIn(['title', 'author', 'both'])
        .withMessage('Search type must be title, author, or both'),
    
    handleValidationErrors
];

const validateBookFilters = [
    query('author')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Author filter must be between 1 and 100 characters'),
    
    query('genre')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Genre filter must be between 1 and 50 characters'),
    
    handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
    param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`),
    
    handleValidationErrors
];

module.exports = {
    validateSignup,
    validateLogin,
    validateBook,
    validateReview,
    validatePagination,
    validateSearch,
    validateBookFilters,
    validateObjectId,
    handleValidationErrors
};