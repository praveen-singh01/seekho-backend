# 🧱 Microservices Architecture Guide (Node.js + MongoDB)

## 🌟 Goal

To build a scalable, production-ready microservices system using **Node.js**, **MongoDB**, and separate environments for **Test** and **Production**.

---

## 📦 Folder Structure (Monorepo Style)

```bash
project-root/
├── services/
│   ├── auth-service/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   │   ├── env/
│   │   │   │   ├── .env.test
│   │   │   │   └── .env.prod
│   │   └── app.js
│   ├── payment-service/
│   ├── notification-service/
│   ├── user-profile-service/
│   ├── onboarding-service/
│   └── ...
│
├── config-service/
│   ├── controllers/
│   ├── routes/
│   ├── config/
│   ├── configs/
│   │   ├── auth-service.test.json
│   │   ├── payment-service.prod.json
│   │   └── ...
│   └── app.js
│
├── gateway/
│   ├── kong/
│   │   ├── kong.conf
│   │   └── services.yml
│   └── express-gateway/ (optional)
│
├── docker/
│   ├── docker-compose.test.yml
│   ├── docker-compose.prod.yml
│   └── Dockerfile (per service)
│
├── .github/workflows/
│   ├── ci-auth.yml
│   ├── ci-payment.yml
│   └── ...
└── README.md
```

---

## 🛠️ Tech Stack

* **Backend:** Node.js (Express.js / Fastify)
* **Database:** MongoDB (one per service)
* **Gateway:** Kong Gateway (preferred), or Express Gateway
* **CI/CD:** GitHub Actions (or GitLab CI)
* **Containers:** Docker + Docker Compose
* **Environment Separation:** `.env.test` and `.env.prod`
* **Central Config:** Config Service (REST-based) to serve per-service and per-app configs

---

## 🔐 Environment Variables (.env Example)

`.env.test`

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/auth_test_db
JWT_SECRET=test-secret
X_APP_ID=test-app
```

`.env.prod`

```env
PORT=3001
MONGO_URI=mongodb://auth-prod-db:27017/auth_prod_db
JWT_SECRET=prod-secret
X_APP_ID=prod-app
```

---

## 🚀 Best Practices Checklist

### ✅ Microservices

* Keep each service **self-contained**
* Each service should manage **its own database**
* Expose only necessary APIs (REST/gRPC)
* Use shared libraries via npm packages (if needed)

### ✅ MongoDB

* Use one DB **per microservice**
* Use **indexes** for performance
* Split schemas logically (avoid monolithic documents)

### ✅ API Gateway

* Use **Kong** for centralized routing
* Set up **rate limiting**, **JWT auth**, **CORS**, and **transformers**
* Separate routes for **test** and **prod** via subdomain or port

### ✅ CI/CD

* Use **GitHub Actions** per service (triggered on push/tag)
* Auto-build and push Docker images
* Separate **deploy jobs** for test and prod environments
* Use **versioned tags** for releases

### ✅ Environments

* Separate databases and configs for **test** and **prod**
* Flutter apps should switch using `--dart-define=ENV=test`
* Kong should proxy `api.test.domain.com` vs `api.domain.com`

### ✅ Config Service

* A dedicated `config-service` should serve per-service, per-env, and per-app configurations
* Support endpoints like: `GET /config/:serviceName?env=test&appId=polimart-app`
* Store configs in version-controlled JSON files or external KV store
* Services fetch config on boot or periodically

### ✅ Secrets

* Never commit secrets
* Use GitHub Secrets, Vault, AWS Secrets Manager, or `.env` only in CI

### ✅ Monitoring & Logs

* Use centralized logging (e.g., Loki, ELK)
* Use Prometheus + Grafana for service health
* Alert on error rates and downtime

### ✅ Testing

* Write **unit tests** per service
* Use Postman or automated scripts for **integration tests** on test env

---

## 📘 Example Service: auth-service (Express + MongoDB)

* `POST /auth/login`
* `POST /auth/register`
* `GET /auth/me`

---

## 🔀 Deployment Environments

### Test

* Domain: `api.test.yourdomain.com`
* Mongo URIs: `auth_test_db`, `payment_test_db`, etc.
* Fake payment gateway keys (e.g., Razorpay test)

### Production

* Domain: `api.yourdomain.com`
* Live Mongo URIs
* Secure keys, logging, monitoring

---

## 💬 App Identification

Pass `X-App-ID` in all requests:

```http
X-App-ID: polimart-app
```

Then in middleware:

```js
req.appId = req.headers['x-app-id'];
```

Use this to customize logic per app across all services.

---


