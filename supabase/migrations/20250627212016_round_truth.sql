/*
  # Add Programming and DevOps Challenges

  1. New Challenges
    - DevOps challenges (Beginner & Advanced)
    - React challenges (Beginner & Advanced) 
    - Docker challenge (Intermediate)
    - Python challenge (Intermediate)
    - Bash scripting challenge (Intermediate)

  2. Challenge Categories
    - DevOps
    - Frontend Development
    - Backend Development
    - Containerization
    - Scripting

  3. Features
    - Realistic coding scenarios
    - Appropriate difficulty levels
    - Comprehensive test cases
    - Starter code templates
    - Time limits based on complexity
*/

-- DevOps Beginner Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'CI/CD Pipeline Configuration',
  'Create a basic CI/CD pipeline configuration file for a Node.js application. The pipeline should include stages for installing dependencies, running tests, and building the application. Use GitHub Actions YAML syntax.',
  'Beginner',
  50,
  45,
  'DevOps',
  'name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # Add your pipeline jobs here
  build:
    runs-on: ubuntu-latest
    
    steps:
    # Add your pipeline steps here
    - name: Checkout code
      uses: actions/checkout@v3
',
  ARRAY[
    'Pipeline triggers on push to main branch',
    'Pipeline triggers on pull requests to main branch',
    'Job runs on ubuntu-latest',
    'Includes step to checkout code',
    'Includes step to setup Node.js',
    'Includes step to install dependencies',
    'Includes step to run tests',
    'Includes step to build application'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- DevOps Advanced Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'Kubernetes Deployment with Auto-scaling',
  'Design a complete Kubernetes deployment configuration for a microservices application. Include deployment, service, ingress, horizontal pod autoscaler, and configmap resources. The application should auto-scale based on CPU usage and handle rolling updates.',
  'Advanced',
  150,
  90,
  'DevOps',
  'apiVersion: apps/v1
kind: Deployment
metadata:
  name: microservice-app
  labels:
    app: microservice-app
spec:
  # Add your deployment configuration here
  replicas: 3
  selector:
    matchLabels:
      app: microservice-app
  template:
    metadata:
      labels:
        app: microservice-app
    spec:
      containers:
      - name: app
        image: nginx:1.21
        # Add container configuration
---
# Add Service, Ingress, HPA, and ConfigMap resources below
',
  ARRAY[
    'Deployment has proper metadata and labels',
    'Deployment specifies resource requests and limits',
    'Service exposes the deployment correctly',
    'Ingress configures external access with proper routing',
    'HorizontalPodAutoscaler targets CPU utilization',
    'ConfigMap is properly mounted in deployment',
    'Rolling update strategy is configured',
    'Health checks (readiness and liveness probes) are included'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- React Beginner Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'Todo List Component',
  'Create a functional Todo List component in React. The component should allow users to add new todos, mark todos as complete/incomplete, and delete todos. Use React hooks (useState) for state management.',
  'Beginner',
  75,
  60,
  'Frontend Development',
  'import React, { useState } from ''react'';

function TodoList() {
  // Add your state management here
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('''');

  // Add your functions here
  const addTodo = () => {
    // Implement add todo functionality
  };

  const toggleTodo = (id) => {
    // Implement toggle todo functionality
  };

  const deleteTodo = (id) => {
    // Implement delete todo functionality
  };

  return (
    <div className="todo-list">
      <h1>Todo List</h1>
      {/* Add your JSX here */}
      <div className="input-section">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      
      <ul className="todos">
        {/* Render todos here */}
      </ul>
    </div>
  );
}

export default TodoList;',
  ARRAY[
    'Component renders without errors',
    'Input field updates state correctly',
    'Add button creates new todos',
    'Todos display in a list format',
    'Each todo shows text and completion status',
    'Todos can be marked as complete/incomplete',
    'Completed todos have different styling',
    'Todos can be deleted',
    'Empty input validation prevents adding empty todos'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- React Advanced Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'Real-time Data Dashboard with Custom Hooks',
  'Build a real-time data dashboard component that fetches and displays data from multiple APIs. Implement custom hooks for data fetching, error handling, and WebSocket connections. Include data visualization, filtering, and real-time updates.',
  'Advanced',
  200,
  120,
  'Frontend Development',
  'import React, { useState, useEffect, useCallback } from ''react'';

// Custom hook for API data fetching
function useApiData(url, interval = 5000) {
  // Implement custom hook for data fetching with polling
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add your implementation here

  return { data, loading, error, refetch: () => {} };
}

// Custom hook for WebSocket connection
function useWebSocket(url) {
  // Implement WebSocket custom hook
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(''Connecting'');

  // Add your implementation here

  return { lastMessage, connectionStatus, sendMessage: () => {} };
}

function Dashboard() {
  // Implement dashboard component
  const [filters, setFilters] = useState({});
  
  // Use your custom hooks here
  const { data: apiData, loading, error } = useApiData(''/api/dashboard-data'');
  const { lastMessage, connectionStatus } = useWebSocket(''ws://localhost:8080'');

  return (
    <div className="dashboard">
      <h1>Real-time Dashboard</h1>
      {/* Implement your dashboard UI here */}
    </div>
  );
}

export default Dashboard;',
  ARRAY[
    'useApiData hook fetches data correctly',
    'useApiData hook handles loading states',
    'useApiData hook handles error states',
    'useApiData hook implements polling/refresh functionality',
    'useWebSocket hook establishes connection',
    'useWebSocket hook handles connection status',
    'useWebSocket hook receives and processes messages',
    'Dashboard renders data visualization components',
    'Filtering functionality works correctly',
    'Real-time updates reflect in the UI',
    'Error boundaries handle component errors',
    'Performance optimizations (useMemo, useCallback) are implemented'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- Docker Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'Multi-stage Docker Build for Node.js App',
  'Create a multi-stage Dockerfile for a Node.js application that optimizes for both development and production. Include stages for dependency installation, building, and running. Also create a docker-compose.yml file that sets up the application with a database.',
  'Intermediate',
  100,
  75,
  'Containerization',
  '# Dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app
# Add dependency installation steps

# Stage 2: Build
FROM dependencies AS build
# Add build steps

# Stage 3: Production
FROM node:18-alpine AS production
WORKDIR /app
# Add production setup

# Expose port and define startup command
EXPOSE 3000
CMD ["npm", "start"]

---

# docker-compose.yml
version: ''3.8''

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    # Add database connection and other services
    
  database:
    # Add database service configuration',
  ARRAY[
    'Dockerfile uses multi-stage build pattern',
    'Dependencies stage installs npm packages efficiently',
    'Build stage compiles/builds the application',
    'Production stage uses minimal base image',
    'Production stage only includes necessary files',
    'Dockerfile follows security best practices',
    'docker-compose.yml defines app service correctly',
    'docker-compose.yml includes database service',
    'Environment variables are properly configured',
    'Volumes are configured for data persistence',
    'Health checks are implemented',
    'Build process is optimized for layer caching'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- Python Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'API Rate Limiter with Redis',
  'Implement a rate limiting system for an API using Python and Redis. The rate limiter should support different limits per user, sliding window algorithm, and provide detailed metrics. Include proper error handling and logging.',
  'Intermediate',
  125,
  90,
  'Backend Development',
  'import redis
import time
import json
from typing import Dict, Optional, Tuple
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_limit = 100  # requests per hour
        self.window_size = 3600   # 1 hour in seconds
    
    def is_allowed(self, user_id: str, limit: Optional[int] = None) -> Tuple[bool, Dict]:
        """
        Check if a request is allowed for the given user.
        
        Args:
            user_id: Unique identifier for the user
            limit: Custom rate limit (requests per hour)
            
        Returns:
            Tuple of (is_allowed: bool, metrics: dict)
        """
        # Implement sliding window rate limiting algorithm
        current_time = time.time()
        limit = limit or self.default_limit
        
        # Add your implementation here
        # Use Redis sorted sets for sliding window
        
        return True, {}
    
    def get_user_stats(self, user_id: str) -> Dict:
        """Get current usage statistics for a user."""
        # Implement user statistics retrieval
        pass
    
    def reset_user_limit(self, user_id: str) -> bool:
        """Reset rate limit for a specific user."""
        # Implement limit reset functionality
        pass

# Example usage
if __name__ == "__main__":
    # Initialize Redis connection
    r = redis.Redis(host=''localhost'', port=6379, db=0)
    limiter = RateLimiter(r)
    
    # Test the rate limiter
    user_id = "user123"
    allowed, metrics = limiter.is_allowed(user_id)
    print(f"Request allowed: {allowed}")
    print(f"Metrics: {metrics}")
',
  ARRAY[
    'RateLimiter class initializes correctly with Redis client',
    'is_allowed method implements sliding window algorithm',
    'Rate limiting works correctly within time windows',
    'Different limits per user are supported',
    'Metrics include current usage and remaining requests',
    'Redis operations are atomic and efficient',
    'get_user_stats returns accurate statistics',
    'reset_user_limit clears user data correctly',
    'Error handling for Redis connection issues',
    'Code includes proper logging',
    'Memory usage is optimized (old entries are cleaned up)',
    'Thread-safe implementation for concurrent requests'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);

-- Bash Scripting Challenge
INSERT INTO challenges (
  title,
  description,
  difficulty,
  points,
  time_limit,
  category,
  starter_code,
  test_cases,
  created_by,
  status
) VALUES (
  'System Monitoring and Backup Script',
  'Create a comprehensive bash script that monitors system resources (CPU, memory, disk usage) and performs automated backups. The script should send alerts when thresholds are exceeded, log activities, and handle errors gracefully.',
  'Intermediate',
  100,
  75,
  'Scripting',
  '#!/bin/bash

# System Monitoring and Backup Script
# Author: Your Name
# Description: Monitors system resources and performs backups

# Configuration
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
BACKUP_DIR="/backup"
LOG_FILE="/var/log/system_monitor.log"
EMAIL_ALERT="admin@company.com"

# Functions
log_message() {
    local message="$1"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

check_cpu_usage() {
    # Implement CPU usage checking
    # Return CPU usage percentage
    echo "Checking CPU usage..."
}

check_memory_usage() {
    # Implement memory usage checking
    # Return memory usage percentage
    echo "Checking memory usage..."
}

check_disk_usage() {
    # Implement disk usage checking for specified path
    local path="$1"
    echo "Checking disk usage for $path..."
}

send_alert() {
    local subject="$1"
    local message="$2"
    # Implement email alert functionality
    echo "Alert: $subject - $message"
}

perform_backup() {
    local source_dir="$1"
    local backup_name="$2"
    # Implement backup functionality with compression
    echo "Performing backup of $source_dir..."
}

cleanup_old_backups() {
    # Implement cleanup of backups older than specified days
    local days="$1"
    echo "Cleaning up backups older than $days days..."
}

main() {
    log_message "Starting system monitoring and backup script"
    
    # Add your main script logic here
    # 1. Check system resources
    # 2. Send alerts if thresholds exceeded
    # 3. Perform backups
    # 4. Cleanup old backups
    # 5. Log completion
    
    log_message "Script execution completed"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
',
  ARRAY[
    'Script has proper shebang and header comments',
    'Configuration variables are defined at the top',
    'log_message function writes timestamped entries',
    'check_cpu_usage returns accurate CPU percentage',
    'check_memory_usage returns accurate memory percentage', 
    'check_disk_usage accepts path parameter and returns usage',
    'send_alert function handles email notifications',
    'perform_backup creates compressed archives',
    'cleanup_old_backups removes files older than specified days',
    'Main function orchestrates all operations correctly',
    'Error handling prevents script crashes',
    'Script can be run with different parameters',
    'Exit codes indicate success/failure status',
    'Script includes help/usage information'
  ],
  (SELECT id FROM profiles WHERE role = 'interviewer' LIMIT 1),
  'active'
);