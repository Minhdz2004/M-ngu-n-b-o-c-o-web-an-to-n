const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const client = require('prom-client');

const app = express();
const PORT = 3000;

// ===== CẤU HÌNH LOGGER =====
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/app.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// ===== CẤU HÌNH METRICS =====
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Thời gian xử lý yêu cầu HTTP (giây)',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Tổng số yêu cầu HTTP',
  labelNames: ['method', 'route', 'status_code']
});

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Tệp tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Middleware ghi nhận metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .inc();
  });
  next();
});

// ===== CÁC ROUTE =====

// Phục vụ trang index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Route đăng nhập
app.post('/login', (req, res) => {
  // Chấp nhận dữ liệu từ JSON body, urlencoded body, query params hoặc custom headers
  let username = req.body?.username || req.query?.username || req.headers['x-username'] || '';
  let password = req.body?.password || req.query?.password || req.headers['x-password'] || '';
  username = String(username).trim();
  password = String(password).trim();
  const mode = req.query.mode || req.body?.mode || 'basic';

  // Kiểm tra dữ liệu bắt buộc
  if (!username || !password) {
    logger.warn('Đăng nhập thất bại: Thiếu thông tin đăng nhập', { username, source: req.ip });
    return res.status(400).json({
      status: 'error',
      message: '❌ Tên đăng nhập và mật khẩu là bắt buộc'
    });
  }

  // Quy tắc đăng nhập demo:
  // - Chấp nhận admin/password123 là tài khoản demo cố định
  // - Ngoài ra mật khẩu phải >= 3 ký tự
  const isDemoCredential = (username === 'admin' && password === 'password123');
  const isValid = isDemoCredential || password.length >= 3;

  if (isValid) {
    const logData = {
      timestamp: new Date().toISOString(),
      event: 'login_success',
      username,
      mode,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (mode === 'structured') {
      logger.info('Người dùng đăng nhập thành công', logData);
    } else {
      logger.info(`✅ Đăng nhập thành công: ${username} (${logData.timestamp})`);
    }

    return res.status(200).json({
      status: 'success',
      message: `✅ Đăng nhập thành công! Xin chào ${username}`,
      data: logData
    });
  } else {
    const logData = {
      timestamp: new Date().toISOString(),
      event: 'login_failed',
      username,
      reason: 'Thông tin đăng nhập không hợp lệ (mật khẩu quá ngắn)',
      ip: req.ip
    };

    logger.warn('Đăng nhập thất bại', logData);

    return res.status(401).json({
      status: 'error',
      message: '❌ Tên đăng nhập hoặc mật khẩu không chính xác (mật khẩu phải >= 3 ký tự)'
    });
  }
});

// Route lấy dữ liệu
app.get('/api/data', (req, res) => {
  const mode = req.query.mode || 'basic';

  logger.info('Lấy dữ liệu /api/data', { mode, timestamp: new Date().toISOString() });

  res.json({
    status: 'success',
    mode: mode,
    data: {
      message: 'Dữ liệu demo từ API',
      timestamp: new Date().toISOString(),
      server: 'Node.js Express',
      database: 'Elasticsearch',
      logging: 'Winston + ELK Stack',
      description: 'Hệ thống quản lý logs & monitoring'
    }
  });
});

// Route kiểm tra sức khỏe
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Hệ thống hoạt động bình thường',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Route metrics (cho Prometheus)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
});

// Xử lý route không tìm thấy
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route không tìm thấy',
    path: req.path
  });
});

// ===== KHỞI ĐỘNG SERVER =====
app.listen(PORT, () => {
  logger.info(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log(`✅ Ứng dụng khởi động trên cổng ${PORT}`);
  console.log(`📊 Metrics có sẵn tại http://localhost:${PORT}/metrics`);
  console.log(`🌐 Giao diện tại http://localhost:${PORT}`);
});

module.exports = app;
