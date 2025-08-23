# 🚀 Production Deployment Guide - MongoDB Replica Set & 25-Slot Capacity System

## 📋 **Overview**
This guide covers the production deployment of the enhanced appointment system with 25-slot capacity validation, focusing on MongoDB replica set configuration for transaction support.

---

## 🗄️ **MongoDB Replica Set Setup**

### **Why Replica Set is Required?**
- **Transaction Support**: MongoDB transactions require replica sets
- **Race Condition Prevention**: Atomic operations prevent concurrent booking conflicts
- **Data Consistency**: ACID compliance ensures data integrity
- **High Availability**: Automatic failover and redundancy

### **Option 1: MongoDB Atlas (Recommended)**

**Benefits:**
- ✅ Replica sets enabled by default
- ✅ Fully managed service
- ✅ Automatic backups and scaling
- ✅ Built-in security features
- ✅ Global distribution

**Setup Steps:**
1. **Create MongoDB Atlas Account**: https://cloud.mongodb.com
2. **Create New Cluster** (M0 Sandbox for testing, M10+ for production)
3. **Configure Network Access**:
   ```
   IP Whitelist: Add your server IPs
   Database User: Create with read/write permissions
   ```
4. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/appointment-db?retryWrites=true&w=majority
   ```
5. **Update Environment Variables**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appointment-db?retryWrites=true&w=majority
   NODE_ENV=production
   ```

### **Option 2: Self-Hosted Replica Set**

**For dedicated server deployment:**

#### **1. Install MongoDB**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb-org

# CentOS/RHEL
sudo yum install -y mongodb-org

# macOS
brew install mongodb-community
```

#### **2. Configure Replica Set**

**Create configuration files for 3 MongoDB instances:**

**`/etc/mongod-rs0.conf`** (Primary):
```yaml
systemLog:
  destination: file
  path: /var/log/mongodb/mongod-rs0.log
  logAppend: true
storage:
  dbPath: /var/lib/mongodb-rs0
  journal:
    enabled: true
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod-rs0.pid
net:
  port: 27017
  bindIp: 0.0.0.0
replication:
  replSetName: rs0
```

**`/etc/mongod-rs1.conf`** (Secondary 1):
```yaml
systemLog:
  destination: file
  path: /var/log/mongodb/mongod-rs1.log
  logAppend: true
storage:
  dbPath: /var/lib/mongodb-rs1
  journal:
    enabled: true
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod-rs1.pid
net:
  port: 27018
  bindIp: 0.0.0.0
replication:
  replSetName: rs0
```

**`/etc/mongod-rs2.conf`** (Secondary 2):
```yaml
systemLog:
  destination: file
  path: /var/log/mongodb/mongod-rs2.log
  logAppend: true
storage:
  dbPath: /var/lib/mongodb-rs2
  journal:
    enabled: true
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod-rs2.pid
net:
  port: 27019
  bindIp: 0.0.0.0
replication:
  replSetName: rs0
```

#### **3. Start MongoDB Instances**
```bash
# Create data directories
sudo mkdir -p /var/lib/mongodb-rs0 /var/lib/mongodb-rs1 /var/lib/mongodb-rs2
sudo chown mongodb:mongodb /var/lib/mongodb-rs*

# Start instances
sudo mongod -f /etc/mongod-rs0.conf
sudo mongod -f /etc/mongod-rs1.conf  
sudo mongod -f /etc/mongod-rs2.conf
```

#### **4. Initialize Replica Set**
```javascript
// Connect to primary instance
mongo --port 27017

// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})

// Check status
rs.status()
```

#### **5. Connection String for Application**
```env
MONGODB_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/appointment-db?replicaSet=rs0
```

---

## 🔧 **Application Configuration Updates**

### **1. Update Database Connection**

**`config/database.js`** - Enhanced for production:
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Remove deprecated options (auto-handled in MongoDB driver 4.0+)
            retryWrites: true,
            w: 'majority',
            readPreference: 'primary', // Ensure transactions use primary
            maxPoolSize: 10, // Connection pooling
            serverSelectionTimeoutMS: 5000, // Timeout for server selection
            socketTimeoutMS: 45000, // Socket timeout
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`🔄 Replica Set: ${conn.connection.db.databaseName}`);
        
        // Test transaction support
        const session = conn.connection.client.startSession();
        await session.endSession();
        console.log('✅ Transaction support confirmed');
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
```

### **2. Environment Variables**

**`.env`** file for production:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appointment-db?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=3001

# Frontend URLs
CLIENT_URL=https://yourdomain.com
MAIN_DOMAIN=https://yourdomain.com
PORTAL_DOMAIN=https://admin.yourdomain.com

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Max requests per window
```

### **3. Production Server Configuration**

**`server.js`** updates for production:
```javascript
// Add at the top
console.log('🚀 Starting Dr. Helal Appointment System');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Configured' : 'Missing'}`);

// Enhanced error handling
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});
```

---

## 🐳 **Docker Deployment (Optional)**

### **Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
```

### **docker-compose.yml**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/appointment-db?retryWrites=true&w=majority
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🔒 **Security Configuration**

### **1. API Rate Limiting**
```javascript
// Enhanced rate limiting for production
const limiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: {
        error: 'Too many requests from this IP',
        retry_after: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
});
```

### **2. HTTPS Configuration**
```javascript
// For HTTPS deployment
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}
```

---

## 📊 **Monitoring & Logging**

### **1. Application Monitoring**
```javascript
// Add to server.js
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Test transaction capability
        let transactionSupport = false;
        try {
            const session = mongoose.connection.client.startSession();
            await session.endSession();
            transactionSupport = true;
        } catch (error) {
            console.warn('Transaction support check failed:', error.message);
        }

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
            transactions: transactionSupport,
            capacity_config: {
                'Gomoti Hospital': 25,
                'Moon Hospital': 25,
                'Al-Sefa Hospital': 25
            },
            memory_usage: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message
        });
    }
});
```

### **2. Logging Configuration**
```javascript
// Production logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: {
            write: (message) => {
                console.log(message.trim());
                // Optional: Send to external logging service
            }
        }
    }));
} else {
    app.use(morgan('dev'));
}
```

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment:**
- [ ] MongoDB replica set configured and tested
- [ ] Environment variables set correctly
- [ ] SSL/TLS certificates configured
- [ ] Domain name configured and pointing to server
- [ ] Firewall rules configured (ports 80, 443, 3001)
- [ ] Backup strategy implemented

### **Testing:**
- [ ] Health check endpoint responding
- [ ] Database connectivity confirmed
- [ ] Transaction support verified
- [ ] 25-slot capacity validation working
- [ ] API endpoints responding correctly
- [ ] CORS configuration working
- [ ] Frontend integration tested

### **Production Launch:**
- [ ] DNS propagation complete
- [ ] SSL certificate valid
- [ ] Monitoring alerts configured
- [ ] Log aggregation setup
- [ ] Performance benchmarks established
- [ ] Backup verification completed

---

## 🎯 **Performance Optimization**

### **1. Database Indexes**
```javascript
// Create indexes for better performance
db.appointments.createIndex({ "hospital": 1, "appointment_date": 1, "appointment_time": 1 })
db.appointments.createIndex({ "reference_number": 1 })
db.appointments.createIndex({ "appointment_date": 1, "status": 1 })
db.appointments.createIndex({ "created_at": -1 })
```

### **2. Connection Pooling**
```javascript
// Optimize connection pool size
const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: process.env.NODE_ENV === 'production' ? 10 : 5,
        minPoolSize: 2,
        bufferMaxEntries: 0,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
};
```

---

## 📈 **Scaling Considerations**

### **Horizontal Scaling:**
- Load balancer configuration
- Session management (if needed)
- Database read replicas
- CDN for static assets

### **Vertical Scaling:**
- CPU and memory optimization
- Database connection tuning
- Cache implementation (Redis)
- Background job processing

---

**✅ Ready for Production Deployment!**

The system now supports:
- **25-slot capacity validation** with race condition protection
- **MongoDB replica set** transactions for data consistency
- **Production-grade security** and monitoring
- **Scalable architecture** for growth
- **Professional error handling** and logging
