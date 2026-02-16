#!/bin/bash

# AWS S3 Setup Script for MozEdu Frontend
# This script creates and configures the S3 bucket for production hosting

set -e  # Exit on any error

# Configuration
BUCKET_NAME="mozedu-frontend-prod-af"
REGION="af-south-1"
ERROR_DOCUMENT="404.html"
INDEX_DOCUMENT="index.html"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MozEdu Frontend S3 Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Function to print error and exit
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" 1>&2
    exit 1
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    error_exit "AWS CLI is not installed. Please install it first."
fi

# Check if user is logged in
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    error_exit "Not logged into AWS. Please run 'aws configure' or 'aws sso login' first."
fi

# Get current AWS identity
IDENTITY=$(aws sts get-caller-identity)
echo "Logged in as:"
echo "$IDENTITY"
echo ""

# Check if bucket already exists
echo "Checking if bucket already exists..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    warning "Bucket '$BUCKET_NAME' already exists!"
    read -p "Do you want to reconfigure it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping bucket creation..."
        BUCKET_EXISTS=true
    else
        warning "Will reconfigure existing bucket..."
        BUCKET_EXISTS=true
    fi
else
    echo "Bucket does not exist. Creating..."
    BUCKET_EXISTS=false
fi

# Create bucket if it doesn't exist
if [ "$BUCKET_EXISTS" = false ]; then
    echo "Creating S3 bucket '$BUCKET_NAME' in region '$REGION'..."
    
    # For af-south-1, we need to specify LocationConstraint
    if aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION" 2>&1 | tee /tmp/aws_create_bucket_error.log; then
        success "Bucket created successfully!"
    else
        cat /tmp/aws_create_bucket_error.log
        error_exit "Failed to create bucket. See error above."
    fi
    
    # Wait for bucket to be available (eventual consistency)
    echo "Waiting for bucket to be available..."
    sleep 5
    
    # Verify bucket was created
    if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
        success "Bucket is now available!"
    else
        error_exit "Bucket was created but is not yet available. Please wait a moment and run the script again."
    fi
fi

# Configure bucket for static website hosting
echo ""
echo "Configuring static website hosting..."
if aws s3api put-bucket-website \
    --bucket "$BUCKET_NAME" \
    --website-configuration "{
        \"IndexDocument\": {\"Suffix\": \"$INDEX_DOCUMENT\"},
        \"ErrorDocument\": {\"Key\": \"$ERROR_DOCUMENT\"}
    }" 2>&1 | tee /tmp/aws_website_error.log; then
    success "Static website hosting configured!"
else
    cat /tmp/aws_website_error.log
    error_exit "Failed to configure static website hosting."
fi

# Disable Block Public Access settings
echo ""
echo "Configuring public access settings..."
if aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>&1 | tee /tmp/aws_public_access_error.log; then
    success "Public access settings configured!"
else
    cat /tmp/aws_public_access_error.log
    error_exit "Failed to configure public access settings."
fi

# Wait for settings to propagate
echo "Waiting for settings to propagate..."
sleep 3

# Create and apply bucket policy for public read access
echo ""
echo "Applying bucket policy for public read access..."
POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF
)

if echo "$POLICY" | aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///dev/stdin 2>&1 | tee /tmp/aws_policy_error.log; then
    success "Bucket policy applied successfully!"
else
    cat /tmp/aws_policy_error.log
    error_exit "Failed to apply bucket policy."
fi

# Configure CORS (if needed for API calls from the frontend)
echo ""
echo "Configuring CORS..."
CORS_CONFIG=$(cat <<EOF
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
}
EOF
)

if echo "$CORS_CONFIG" | aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///dev/stdin 2>&1 | tee /tmp/aws_cors_error.log; then
    success "CORS configuration applied!"
else
    cat /tmp/aws_cors_error.log
    warning "Failed to apply CORS configuration (this may not be critical)."
fi

# Get the website endpoint
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"
echo "Website Endpoint: http://${BUCKET_NAME}.s3-website.${REGION}.amazonaws.com"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your GitHub secrets with AWS credentials"
echo "2. Push to the master branch to trigger deployment"
echo "3. (Optional) Set up CloudFront for HTTPS and custom domain"
echo ""
echo -e "${GREEN}GitHub Secrets needed:${NC}"
echo "  - AWS_ACCESS_KEY_ID"
echo "  - AWS_SECRET_ACCESS_KEY"
echo ""
