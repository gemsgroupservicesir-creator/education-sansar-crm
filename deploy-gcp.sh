#!/usr/bin/env bash
set -e

export PATH="/opt/homebrew/bin:$PATH"

# ==============================================================================
# Education Sansar CRM — Google Cloud Run Automated Deployment Script
# ==============================================================================

echo "================================================================="
echo "  🚀 Deploying Education Sansar CRM to Google Cloud Run"
echo "================================================================="

# 1. Verify gcloud installation
if ! command -v gcloud &> /dev/null; then
  echo ""
  echo "❌ Google Cloud CLI (gcloud) is not installed."
  echo "Installing Google Cloud SDK via Homebrew..."
  if command -v brew &> /dev/null; then
    brew install --cask google-cloud-sdk
    # Source path if needed
    if [ -f "/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/path.zsh.inc" ]; then
      source "/opt/homebrew/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/path.zsh.inc"
    fi
  else
    echo "Please install gcloud from: https://cloud.google.com/sdk/docs/install"
    exit 1
  fi
fi

# 2. Check Authentication
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
if [ -z "$ACTIVE_ACCOUNT" ]; then
  echo ""
  echo "🔑 No active Google Cloud account detected."
  echo "Please authenticate using:"
  gcloud auth login
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
echo "✅ Authenticated as: $ACTIVE_ACCOUNT"

# 3. Check and Set Project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" = "(unset)" ]; then
  echo ""
  echo "Available Google Cloud projects:"
  gcloud projects list
  echo ""
  read -p "Enter your Google Cloud Project ID: " USER_PROJECT
  gcloud config set project "$USER_PROJECT"
  CURRENT_PROJECT="$USER_PROJECT"
fi

echo "✅ Active Google Cloud Project: $CURRENT_PROJECT"

# 4. Enable Required APIs
echo ""
echo "⚙️  Enabling Cloud Run, Cloud Build, and Artifact Registry APIs..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="$CURRENT_PROJECT"

# 5. Build and Deploy directly to Cloud Run using Google Cloud Build
REGION=${GCP_REGION:-"asia-south1"}
SERVICE_NAME="education-sansar-crm"

echo ""
echo "🚀 Building container image and deploying to Cloud Run in region: $REGION..."
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --project "$CURRENT_PROJECT"

echo ""
echo "================================================================="
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$CURRENT_PROJECT" --format="value(status.url)")
echo "🎉 SUCCESS! Education Sansar CRM is LIVE at:"
echo "   🌐 $SERVICE_URL"
echo ""
echo "Super Admin Credentials:"
echo "   📧 Email:    admin@educationsansar.com"
echo "   🔑 Password: admin123"
echo "================================================================="
