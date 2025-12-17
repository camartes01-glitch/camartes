#!/bin/bash

# This script automates the setup and execution of the backend server.

# Step 1: Create a virtual environment
echo "Creating a virtual environment..."
python3 -m venv venv

# Step 2: Activate the virtual environment
echo "Activating the virtual environment..."
source venv/bin/activate

# Step 3: Remove problematic dependency
echo "Cleaning up requirements file..."
sed -i '/emergentintegrations/d' backend/requirements.txt

# Step 4: Install Python dependencies
echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

# Step 5: Run the FastAPI server
echo "Starting the backend server..."
uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
