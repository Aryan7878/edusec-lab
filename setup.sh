#!/bin/bash

echo "🚀 Setting up EduSec Labs..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running. Please start MongoDB."
    echo "On Ubuntu: sudo systemctl start mongod"
    echo "On macOS: brew services start mongodb/brew/mongodb-community"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Initialize database with sample labs
echo "🗄️  Initializing database..."
cd ../backend
node scripts/initLabs.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "1. Terminal 1 (Backend): cd backend && npm run dev"
echo "2. Terminal 2 (Frontend): cd frontend && npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "For Kali VM:"
echo "4. Terminal 3: cd vagrant && vagrant up"
echo ""