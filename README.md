# 🏥 Secure Pharmaceutical Supply Chain Deployment with DevSecOps Pipeline

A production-inspired pharmaceutical supply chain management system with an embedded **hash-chain ledger** for counterfeit detection and a complete **DevSecOps CI/CD pipeline** integrating security at every stage.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [DevSecOps Pipeline](#devsecops-pipeline)
- [Security Integration](#security-integration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [ELK Stack (Logging)](#elk-stack-logging)
- [Ansible Automation](#ansible-automation)

---

## 🏗️ Architecture Overview

```
Developer → GitHub → Jenkins CI/CD Pipeline → Docker Image → Kubernetes → Running App → ELK Stack
                          │
                          ├── Lint (ESLint)
                          ├── Unit Tests (Jest)
                          ├── SAST (SonarQube)
                          ├── Dependency Scan (npm audit)
                          ├── Secrets Detection (Gitleaks)
                          ├── Docker Build
                          ├── Image Scan (Trivy)
                          ├── Push to DockerHub
                          └── Deploy to K8s (Ansible)
```

### End-to-End Flow

1. **Developer** pushes code to **GitHub**
2. **Jenkins** triggers the CI/CD pipeline automatically
3. **Security gates** run at multiple stages (SAST, dependency scan, secrets, image scan)
4. **Docker image** is built and pushed to DockerHub
5. **Kubernetes** deploys the application with rolling updates
6. **ELK Stack** collects and visualizes application logs
7. **Ansible** automates the deployment process

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Node.js + Express | REST API server |
| Security | Helmet, CORS, Rate Limiting | HTTP security headers & protection |
| Integrity | SHA-256 Hash Chain | Counterfeit detection ledger |
| Testing | Jest + Supertest | Unit & integration tests |
| Linting | ESLint | Code quality |
| SAST | SonarQube | Static security analysis |
| Dependency Scan | npm audit | Vulnerability scanning |
| Secrets Detection | Gitleaks | Credential leak detection |
| Containerization | Docker | Application packaging |
| Image Scanning | Trivy | Container vulnerability scanning |
| CI/CD | Jenkins | Pipeline orchestration |
| Orchestration | Kubernetes & HPA | Deployment and Autoscaling |
| Logging | ELK Stack | Log aggregation & visualization |
| Automation | Ansible | Deployment automation |
| Secrets Management | Ansible Vault | Secure storage of deployment credentials |

---

## 📁 Project Structure

```
pharma-devops-project/
├── app/                              # Application source code
│   ├── src/
│   │   ├── server.js                 # Express app with middleware
│   │   ├── index.js                  # Entry point
│   │   ├── routes/
│   │   │   ├── drugRoutes.js         # Drug registration API
│   │   │   ├── shipmentRoutes.js     # Shipment tracking API
│   │   │   └── verifyRoutes.js       # Verification & health API
│   │   ├── ledger/
│   │   │   └── hashChain.js          # SHA-256 hash-chain ledger
│   │   └── utils/
│   │       └── logger.js             # Winston JSON logger
│   ├── tests/
│   │   ├── ledger.test.js            # Hash-chain unit tests
│   │   ├── drugs.test.js             # Drug API tests
│   │   ├── shipments.test.js         # Shipment API tests
│   │   └── verify.test.js            # Verification tests
│   ├── package.json
│   ├── .eslintrc.json
│   └── sonar-project.properties
├── docker/
│   ├── Dockerfile                    # Multi-stage Docker build
│   └── .dockerignore
├── jenkins/
│   └── Jenkinsfile                   # 11-stage DevSecOps pipeline
├── k8s/
│   ├── namespace.yaml                # Kubernetes namespace
│   ├── deployment.yaml               # App deployment (2 replicas)
│   ├── service.yaml                  # NodePort service
│   └── hpa.yaml                      # Horizontal Pod Autoscaler
├── elk/
│   ├── docker-compose.yml            # ELK stack setup
│   ├── logstash/logstash.conf        # Log processing pipeline
│   └── kibana/kibana.yml             # Dashboard config
├── ansible/
│   ├── ansible.cfg                   # Ansible Vault configuration
│   ├── deploy.yml                    # Deployment playbook
│   ├── inventory.ini                 # Host inventory
│   ├── group_vars/all/vault.yml      # Encrypted vault secrets
│   ├── .vault_pass                   # Local vault password (gitignored)
│   └── roles/pharma-deploy/tasks/main.yml
├── .gitleaks.toml                    # Secrets detection config
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 26+ and npm
- Docker (for containerization)
- Minikube or kubectl (for Kubernetes)
- Jenkins (for CI/CD pipeline)

### 1. Run Locally

```bash
# Clone the repository
git clone https://github.com/Abhi-3009/pharmaceutical-supply-chain.git
cd pharmaceutical-supply-chain

# Install dependencies
cd app
npm install

# Run the application
npm start
# Server starts at http://localhost:3000

# Run tests
npm test

# Run linter
npm run lint
```

### 2. Run with Docker

```bash
# Build the Docker image
docker build -t pharma-app -f docker/Dockerfile .

# Run the container
docker run -p 3000:3000 pharma-app

# Access at http://localhost:3000
```

### 3. Run Tests with Coverage

```bash
cd app
npm run test:coverage
```

---

## 📡 API Documentation

### Drug Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/drugs` | Register a new drug |
| `GET` | `/drugs` | List all registered drugs |
| `GET` | `/drugs/:id` | Get drug by ID |

**POST /drugs** — Register a drug:
```bash
curl -X POST http://localhost:3000/drugs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin",
    "manufacturer": "PharmaCorp",
    "batchId": "BATCH-001",
    "expiryDate": "2026-12-31",
    "description": "Pain reliever"
  }'
```

### Shipment Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/shipments` | Create a shipment |
| `GET` | `/shipments` | List all shipments |
| `GET` | `/shipments/:id` | Track a specific shipment |
| `PUT` | `/shipments/:id/status` | Update shipment status |

**POST /shipments** — Create a shipment:
```bash
curl -X POST http://localhost:3000/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "drugId": "drug-uuid-here",
    "drugName": "Aspirin",
    "origin": "Mumbai Warehouse",
    "destination": "Delhi Hospital",
    "quantity": 500
  }'
```

**PUT /shipments/:id/status** — Update status:
```bash
curl -X PUT http://localhost:3000/shipments/SHIPMENT_ID/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-transit",
    "location": "Highway NH-48"
  }'
```

Valid statuses: `created`, `in-transit`, `at-checkpoint`, `delivered`, `recalled`

### Verification & System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/verify` | Verify supply chain integrity (counterfeit detection) |
| `GET` | `/ledger` | View full hash-chain ledger |
| `GET` | `/health` | Health check |
| `GET` | `/` | API information |

**GET /verify** — Check for tampering:
```bash
curl http://localhost:3000/verify
# Response:
# {
#   "message": "✅ Supply chain integrity verified — no tampering detected",
#   "verification": { "valid": true, "totalBlocks": 5, "invalidBlocks": [] }
# }
```

---

## 🔒 DevSecOps Pipeline

The Jenkins pipeline consists of **11 stages** with **4 security gates**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Jenkins DevSecOps Pipeline                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Clone Repository                                            │
│  2. Install Dependencies                                        │
│  3. Lint (ESLint)                        ← Code Quality         │
│  4. Unit Tests (Jest + Coverage)         ← Functional Tests     │
│  5. SAST (SonarQube)                     ← 🔒 Security Gate    │
│  6. Dependency Scan (npm audit)          ← 🔒 Security Gate    │
│  7. Secrets Detection (Gitleaks)         ← 🔒 Security Gate    │
│  8. Docker Build                                                │
│  9. Container Image Scan (Trivy)         ← 🔒 Security Gate    │
│ 10. Push to DockerHub                                           │
│ 11. Deploy to Kubernetes                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Pipeline Fails On:
- ❌ Critical/High SAST findings (SonarQube)
- ❌ High-severity CVEs in dependencies (npm audit)
- ❌ Any detected secrets or credentials (Gitleaks)
- ❌ Critical vulnerabilities in container image (Trivy)

---

## 🔐 Security Integration

Security is embedded at **every stage** of the development lifecycle:

| Stage | Tool | What It Catches |
|-------|------|-----------------|
| **Code** | ESLint | Dangerous patterns (eval, implied-eval) |
| **Application** | Helmet + Rate Limiting | HTTP attacks, DDoS |
| **SAST** | SonarQube | SQL injection, XSS, insecure crypto |
| **Dependencies** | npm audit | Known CVEs in packages |
| **Secrets** | Gitleaks | API keys, passwords in code |
| **Container** | Trivy | OS/library CVEs in Docker image |
| **Deployment**| Ansible Vault | Protects environment configurations during deploy |
| **Runtime** | ELK Stack | Anomaly detection via logs |
| **Infrastructure** | K8s Security Context | Non-root containers, resource limits |

---

## 🐳 Docker Deployment

```bash
# Build the image (from project root)
docker build -t pharma-app -f docker/Dockerfile .

# Run the container
docker run -d --name pharma-app -p 3000:3000 pharma-app

# Check health
curl http://localhost:3000/health

# View logs
docker logs pharma-app
```

### Dockerfile Security Features:
- ✅ Multi-stage build (smaller attack surface)
- ✅ Non-root user (`appuser`)
- ✅ No dev dependencies in production
- ✅ Built-in health check
- ✅ Minimal Alpine base image

---

## ☸️ Kubernetes Deployment

```bash
# Start Minikube (if using locally)
minikube start --driver=docker --cpus=2 --memory=4096
minikube addons enable metrics-server

# Apply manifests manually (or let Ansible do it)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Check deployment status
kubectl get pods -n pharma-app
kubectl get hpa -n pharma-app

# Access the application
minikube service pharma-app-service -n pharma-app
```

### K8s Features:
- 2 replicas with rolling updates
- **Horizontal Pod Autoscaler (HPA)** scales pods dynamically up to 5 based on CPU (>70%) or Memory (>80%) load
- Liveness & readiness probes
- Resource limits (CPU/memory)
- Non-root security context

---

## 📊 ELK Stack (Logging)

```bash
# Start ELK stack
cd elk
docker-compose up -d

# Access Kibana dashboard
open http://localhost:5601

# Create index pattern: pharma-logs-*
```

### Log Flow:
```
App (Winston JSON) → Logstash (port 5000) → Elasticsearch → Kibana Dashboard
```

---

## 🤖 Ansible Automation & Vault

The deployment to the Kubernetes cluster is entirely automated via Ansible. Furthermore, sensitive environment configuration and secrets are managed via Ansible Vault.

```bash
# Deploy using Ansible (This is automatically triggered by Jenkins)
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml

# Edit the encrypted vault securely
ansible-vault edit ansible/group_vars/all/vault.yml
```

### Ansible Features:
- Pulls the latest container image.
- Automatically applies Namespaces, Deployments, Services, and HPA.
- Decrypts secure variables dynamically using `.vault_pass` without leaving plain-text passwords in GitHub.
- Verifies successful Kubernetes rollout status before marking deployment as successful.

---

## 🧬 Hash-Chain Ledger (Counterfeit Detection)

The application uses an immutable hash-chain to detect tampering:

```
Block 0 (Genesis)          Block 1 (Drug Reg)         Block 2 (Shipment)
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ prevHash: "0"    │       │ prevHash: hash₀  │       │ prevHash: hash₁  │
│ data: GENESIS    │──────▶│ data: DRUG_REG   │──────▶│ data: SHIPMENT   │
│ hash: hash₀     │       │ hash: hash₁      │       │ hash: hash₂      │
└──────────────────┘       └──────────────────┘       └──────────────────┘
```

**How it works:**
1. Each block's hash = `SHA-256(previousHash + data + timestamp)`
2. Modifying any block invalidates all subsequent hashes
3. `GET /verify` re-computes every hash and detects any changes
4. This enables **counterfeit detection** — if anyone alters drug records, the chain breaks

---

## 👤 Author

**Abhijeet Rai** & **Nikhil Garg**

Built as a Major Project for Secure Pharmaceutical Supply Chain with DevSecOps practices.
