#!/bin/bash
cd /home/kavia/workspace/code-generation/meeting-organizer-162949-162958/meeting_manager_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

