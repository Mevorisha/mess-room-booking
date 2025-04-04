#!/bin/bash

# Loop through ports 9000-9005
for port in {9000..9005}; do
  # Find PIDs listening on the current port
  pids=$(lsof -i :$port -t 2>/dev/null)
  
  if [ -n "$pids" ]; then    
    # Kill each process with kill -9
    for pid in $pids; do
      kill -9 $pid
      echo "$port: Killed $pid"
    done
  else
    echo "$port: Not Found"
  fi
done

echo "Checked ports 9000-9005"
