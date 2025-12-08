#!/bin/bash
# Server Performance Monitoring Script
# Run this on your VPS to identify CPU and memory issues

echo "======================================"
echo "WishTune Server Performance Monitor"
echo "======================================"
echo ""
echo "Date: $(date)"
echo ""

echo "=== TOP 10 CPU CONSUMING PROCESSES ==="
ps aux --sort=-%cpu | head -11
echo ""

echo "=== TOP 10 MEMORY CONSUMING PROCESSES ==="
ps aux --sort=-%mem | head -11
echo ""

echo "=== CHECKING FOR CRYPTOMINER PROCESSES ==="
MINERS=$(ps aux | grep -iE '(xmrig|kdevtmpfsi|kinsing|kthrotlds|miner|crypto|minerd|bioset)' | grep -v grep)
if [ -n "$MINERS" ]; then
    echo "⚠️  WARNING: SUSPICIOUS PROCESSES FOUND:"
    echo "$MINERS"
else
    echo "✅ No obvious cryptominer processes detected"
fi
echo ""

echo "=== CHECKING FOR MINING POOL CONNECTIONS ==="
POOLS=$(netstat -tunap 2>/dev/null | grep -E '(:3333|:5555|:14433|:14444|pool|stratum)')
if [ -n "$POOLS" ]; then
    echo "⚠️  WARNING: POTENTIAL MINING POOL CONNECTIONS FOUND:"
    echo "$POOLS"
else
    echo "✅ No obvious mining pool connections detected"
fi
echo ""

echo "=== NODE.JS PROCESSES ==="
NODE_PROCS=$(ps aux | grep node | grep -v grep)
if [ -n "$NODE_PROCS" ]; then
    echo "$NODE_PROCS"
    echo ""
    echo "Node.js memory usage:"
    ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print "Total: " sum/1024 " MB"}'
else
    echo "No Node.js processes found"
fi
echo ""

echo "=== SYSTEM MEMORY USAGE ==="
free -h
echo ""

echo "=== DISK USAGE ==="
df -h /
echo ""

echo "=== RECENT SUSPICIOUS CRON JOBS ==="
echo "User crontabs:"
crontab -l 2>/dev/null || echo "No crontab for current user"
echo ""
echo "System crontabs:"
cat /etc/crontab 2>/dev/null || echo "Cannot read /etc/crontab"
echo ""

echo "=== DOCKER CONTAINERS (if using Docker) ==="
docker ps 2>/dev/null || echo "Docker not running or not installed"
echo ""
docker stats --no-stream 2>/dev/null || echo "No docker stats available"
echo ""

echo "======================================"
echo "Monitoring complete. Review the output above for issues."
echo "======================================"
