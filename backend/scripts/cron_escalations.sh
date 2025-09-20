#!/bin/bash

# Cron job script for processing workflow escalations
# Add this to crontab to run every 15 minutes:
# */15 * * * * /path/to/mdc-backend/scripts/cron_escalations.sh >> /var/log/mdc_escalations.log 2>&1

# Change to the Django project directory
cd "$(dirname "$0")/.."

# Activate virtual environment if using one
# source venv/bin/activate

# Set environment variables if needed
# export DJANGO_SETTINGS_MODULE=mdc_backend.settings

# Run the escalation processing command
echo "$(date): Starting workflow escalation processing..."

# Process workflow escalations
python manage.py process_workflow_escalations

# Process workflow rules
python manage.py process_workflow_rules

echo "$(date): Workflow escalation processing completed."