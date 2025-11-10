#!/bin/bash
# TypeScript Error Checker Script
# Usage: ./check-ts-errors.sh

echo "🔍 Checking TypeScript Errors..."
echo "================================"
echo ""

# Run TypeScript compiler
OUTPUT=$(npx tsc --noEmit --skipLibCheck 2>&1)

# Count errors
TOTAL_ERRORS=$(echo "$OUTPUT" | grep "^src/" | wc -l)
ERROR_FILES=$(echo "$OUTPUT" | grep "^src/" | cut -d'(' -f1 | sort -u | wc -l)

echo "📊 Summary:"
echo "  Total Errors: $TOTAL_ERRORS"
echo "  Files with Errors: $ERROR_FILES"
echo ""

# List files with errors
echo "📁 Files with TypeScript Errors:"
echo "$OUTPUT" | grep "^src/" | cut -d'(' -f1 | sort -u | nl
echo ""

# Group errors by file
echo "📋 Detailed Error Report:"
echo "================================"
echo ""

for file in $(echo "$OUTPUT" | grep "^src/" | cut -d'(' -f1 | sort -u); do
    ERROR_COUNT=$(echo "$OUTPUT" | grep "^$file" | wc -l)
    echo "📄 $file ($ERROR_COUNT errors)"
    echo "$OUTPUT" | grep "^$file" | head -5
    echo ""
done

# Show summary from tsc
echo "================================"
echo "$OUTPUT" | tail -3
