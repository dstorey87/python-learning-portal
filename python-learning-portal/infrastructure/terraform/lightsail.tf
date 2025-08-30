terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for Lightsail deployment"
  type        = string
  default     = "eu-west-1"
}

variable "instance_name" {
  description = "Name of the Lightsail instance"
  type        = string
  default     = "python-portal-real"
}

variable "blueprint_id" {
  description = "Lightsail blueprint ID"
  type        = string
  default     = "docker"
}

variable "bundle_id" {
  description = "Lightsail bundle ID (instance size)"
  type        = string
  default     = "nano_2_0" # Free tier: 512MB RAM, 1 vCPU, 20GB SSD
}

variable "key_pair_name" {
  description = "SSH key pair name"
  type        = string
  default     = "python-portal-key"
}

variable "container_service_name" {
  description = "Name of the Lightsail container service"
  type        = string
  default     = "python-portal-containers"
}

# Lightsail Container Service (Free tier: 3 months free, then $10/month)
resource "aws_lightsail_container_service" "python_portal" {
  name  = var.container_service_name
  power = "nano"  # 512MB RAM, 0.25 vCPU
  scale = 1       # Single container

  tags = {
    Environment = "production"
    Project     = "python-portal"
    CostCenter  = "free-tier"
  }

  # Public domain settings
  public_domain_names {
    certificate {
      certificate_name = "python-portal-cert"
      domain_names     = ["${var.container_service_name}.${var.aws_region}.cs.amazonlightsail.com"]
    }
  }
}

# Container deployment configuration
resource "aws_lightsail_container_service_deployment_version" "python_portal_deployment" {
  service_name = aws_lightsail_container_service.python_portal.name

  container {
    container_name = "nginx"
    image         = "python-portal-nginx:latest"
    
    ports = {
      80 = "HTTP"
    }

    environment = {
      NODE_ENV = "production"
    }

    command = []
  }

  container {
    container_name = "frontend"
    image         = "python-portal-frontend:latest"
    
    environment = {
      NODE_ENV = "production"
      VITE_BACKEND_URL = "https://${aws_lightsail_container_service.python_portal.url}/api"
    }
  }

  container {
    container_name = "backend" 
    image         = "python-portal-backend:latest"
    
    environment = {
      NODE_ENV = "production"
      PORT = "3000"
      FRONTEND_URL = "https://${aws_lightsail_container_service.python_portal.url}"
      EXECUTOR_SERVICE_URL = "http://localhost:3003"
    }
  }

  container {
    container_name = "executor"
    image         = "python-portal-executor:latest"
    
    environment = {
      NODE_ENV = "production"
      PORT = "3000"
    }
  }

  public_endpoint {
    container_name = "nginx"
    container_port = 80
    health_check {
      healthy_threshold   = 2
      unhealthy_threshold = 2
      timeout_seconds     = 5
      interval_seconds    = 30
      path               = "/health"
      success_codes      = "200"
    }
  }
}

# SSH Key Pair for debugging access
resource "aws_lightsail_key_pair" "python_portal_key" {
  name = var.key_pair_name
  
  tags = {
    Environment = "production"
    Project     = "python-portal"
  }
}

# Outputs
output "container_service_url" {
  description = "URL of the Lightsail container service"
  value       = aws_lightsail_container_service.python_portal.url
}

output "container_service_arn" {
  description = "ARN of the Lightsail container service"
  value       = aws_lightsail_container_service.python_portal.arn
}

output "ssh_key_fingerprint" {
  description = "SSH key fingerprint"
  value       = aws_lightsail_key_pair.python_portal_key.fingerprint
}

# Cost estimation comments:
# - Container Service: $0 for 3 months (free tier), then $10/month
# - Data transfer: 1 TB/month included (free tier)
# - Storage: 20GB included (free tier)
# - Total estimated cost: $0 for 3 months, then $10/month (within $100/year budget)