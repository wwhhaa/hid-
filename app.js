require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

// Initialize DBs (Async in background)
const Product = require('./models/product');
const WheelPrize = require('./models/wheelPrize');
const Transaction = require('./models/transaction');
const User = require('./models/user');
// Start initialization
(async () => {
    try {
        await User.initDb();
        await Product.initDb();
        await WheelPrize.initDb();
        await Transaction.initDb();
        console.log('All databases initialized.');
    } catch (e) {
        console.error('DB Init Error:', e);
    }
})();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
        },
    },
}));
app.use(cors());
app.use(compression());
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    validate: { trustProxy: false } // fix trust proxy validation error on Vercel
});
app.use(limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sessionStore;
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (dbUrl) {
    const pgSession = require('connect-pg-simple')(session);
    sessionStore = new pgSession({
        conString: dbUrl,
        tableName: 'session',
        createTableIfMissing: true
    });
} else {
    const SQLiteStore = require('connect-sqlite3')(session);
    sessionStore = new SQLiteStore({
        db: 'sessions.sqlite',
        dir: '.'
    });
}

// Trust proxy is required for Render/Heroku/Vercel and secure cookies
app.set('trust proxy', true);

// Session Management
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));


// CSRF Protection
// Note: csrf protection requires session or cookie-parser to be initialized first
const csrfProtection = csrf({ cookie: true });
// Apply specific csrf protection to routes that modify state (POST, PUT, DELETE)
// For now, we apply it globally, but handle exclusion for API if needed.
// We'll apply it to routes later.

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', require('./routes/auth'));
const { dashboardMsg, featuresRouter } = require('./routes/features');
app.use('/', dashboardMsg);
app.use('/features', featuresRouter);
app.use('/admin', require('./routes/admin'));

// Simple root route -> redirected in dashboardMsg
// app.get('/', ...);
app.get('/', (req, res) => {
    res.send('Secure Node.js App Running');
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io); // make accessible in routes using req.app.get('io')

io.on('connection', (socket) => {
    console.log('A user connected to Socket.IO');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server & Socket.IO running on port ${PORT}`);
});
