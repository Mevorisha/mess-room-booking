#!/bin/bash

# Check if directory is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <directory> <ext>"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Usage: $0 <directory> <ext>"
  exit 1
fi

# Assign the provided directory
TARGET_DIR="$1"
EXT="$2"

# Find all .$EXT files recursively
find "$TARGET_DIR" -type f -name "*.$EXT" | while read -r file; do
  # Extract base filename without extension
  basename=$(basename "$file" .$EXT)

  # Get the directory where the file is located
  filedir=$(dirname "$file")

  # Create a new directory with the basename inside its parent folder
  newdir="$filedir/$basename"
  mkdir -p "$newdir"

  # Move the file into the new directory as index.$EXT
  mv "$file" "$newdir/index.$EXT"

  echo "Moved $file -> $newdir/index.$EXT"
done
