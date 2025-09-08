# Magizh Quiz App - Development Commands

.PHONY: help dev test lint format clean build docker-build docker-run seed reset-db

# Default target
help:
	@echo "Available commands:"
	@echo "  dev          - Start development servers (frontend + backend)"
	@echo "  test         - Run all tests"
	@echo "  lint         - Run linting for all code"
	@echo "  format       - Format all code"
	@echo "  clean        - Clean build artifacts"
	@echo "  build        - Build for production"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run with Docker Compose"
	@echo "  seed         - Seed database with sample data"
	@echo "  reset-db     - Reset database and reseed"

# Development
dev:
	@echo "Starting development servers..."
	@cd server && python main.py &
	@cd web && npm run dev

# Testing
test:
	@echo "Running backend tests..."
	@cd server && python -m pytest
	@echo "Running frontend tests..."
	@cd web && npm test

# Linting
lint:
	@echo "Linting backend..."
	@cd server && python -m black --check . && python -m isort --check-only .
	@echo "Linting frontend..."
	@cd web && npm run lint

# Formatting
format:
	@echo "Formatting backend..."
	@cd server && python -m black . && python -m isort .
	@echo "Formatting frontend..."
	@cd web && npm run format

# Clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf web/dist
	@rm -rf server/__pycache__
	@rm -rf server/.pytest_cache
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} +

# Build
build:
	@echo "Building frontend..."
	@cd web && npm run build
	@echo "Build complete!"

# Docker
docker-build:
	@echo "Building Docker image..."
	@docker build -t magizh-quiz:latest .

docker-run:
	@echo "Starting with Docker Compose..."
	@docker-compose up -d

# Database
seed:
	@echo "Seeding database..."
	@cd server && python seed_data.py

reset-db:
	@echo "Resetting database..."
	@rm -f server/magizh_quiz.db
	@cd server && python seed_data.py

# Development setup
setup:
	@echo "Setting up development environment..."
	@cd server && pip install -r requirements.txt
	@cd web && npm install
	@echo "Setup complete! Run 'make dev' to start development servers."