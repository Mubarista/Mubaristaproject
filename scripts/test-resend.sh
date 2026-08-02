#!/bin/bash
# Test Resend email delivery
# Replace `re_xxxxxxxxx` with your actual Resend API key before running.

set -e

curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_xxxxxxxxx' \
  -H 'Content-Type: application/json' \
  -d $'{
    "from": "onboarding@resend.dev",
    "to": "iraguhamubarak23@gmail.com",
    "subject": "Hello World",
    "html": "<p>Congrats on sending your <strong>first email</strong>!</p>"
  }'
