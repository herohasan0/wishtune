# Cost Control & Scalability Guide

This guide explains how to manage costs and scale your WishTune app to thousands of users.

## ✅ Implemented Solutions

### 1. Rate Limiting (ACTIVE)

**Per-Minute Limits:**
- Song Creation: 3 songs/minute per user/IP
- API Calls: 30 requests/minute
- Audio Proxy: 20 fetches/minute

**Daily Limits (Anonymous Users Only):**
- Max 10 songs per day per anonymous user
- Encourages sign-ups while preventing abuse

**Files:**
- `lib/ratelimit.ts` - Rate limiting logic
- `app/api/create-song/route.ts` - Applied to song creation

### 2. Cost Monitoring (READY TO ENABLE)

Tracks every API call to help you monitor spending.

**To Enable:**
Add to your `.env` file:
```bash
ENABLE_COST_MONITORING=true
DAILY_COST_LIMIT=1000  # Set your daily budget (in credits)
```

**What Gets Tracked:**
- Every song creation (success & failures)
- User ID or Visitor ID
- Timestamp
- Estimated cost (1 credit per song)

**Files:**
- `lib/cost-monitor.ts` - Monitoring logic
- `app/api/create-song/route.ts` - Integrated logging

**View Stats:**
Create an admin dashboard that calls `getDailyUsageStats()` to see:
- Total songs created today
- Total cost
- Unique users

### 3. Polling Optimization

**Current Settings:**
- Anonymous users: Refresh every 5 seconds
- Logged-in users: Real-time Firebase (no polling)

**To Reduce Server Load:**
In `app/account/page.tsx:220`, change:
```typescript
}, 5000); // Change to 10000 or 15000 for less frequent polling
```

---

## 📊 Real Cost Drivers (Priority Order)

### 🔴 **1. Suno API Calls** (HIGHEST COST)
**Current:** ~$X per song generation

**Optimization Strategies:**
- ✅ Rate limiting (implemented)
- ✅ Daily limits (implemented)
- ⚠️ Consider caching popular songs (if applicable)
- ⚠️ Monitor failed generations (wasted API calls)

### 🟡 **2. Firebase Operations** (MEDIUM COST)
**Costs:** Per read/write operation

**Current Usage:**
- Song creation: 1 write
- Song updates: 1 write (via webhook)
- Song fetches: 1 read per user
- Real-time listeners: Continuous connection

**Optimization:**
- ✅ Polling for anonymous users (cheaper than real-time)
- ⚠️ Consider pagination for users with many songs
- ⚠️ Use Firebase indexes efficiently

### 🟢 **3. Bandwidth/Storage** (LOW COST)
**Costs:** Audio file proxying, image serving

**Current:**
- Audio proxy has rate limit (20/minute)
- Already well-controlled

---

## 🚀 Scaling to 1000+ Users

### Expected Load with 1000 Daily Users

**Song Creations:**
- Average: 2 songs/user = 2000 songs/day
- Peak hour: ~300 songs/hour
- Rate limiting will queue requests smoothly

**API Requests:**
- Song fetches: ~10,000/day (users checking status)
- Polling (anonymous): ~17,000/hour if 100 concurrent users
  - Solution: Increase polling interval to 10-15 seconds

**Firebase:**
- Reads: ~15,000/day
- Writes: ~4,000/day (creation + updates)
- Well within Firebase free tier limits initially

### What to Monitor

**Critical Metrics:**
1. **Daily Suno API calls** - Your biggest cost
2. **Failed API calls** - Wasted money
3. **Firebase read/write counts** - Secondary cost
4. **Anonymous vs logged-in ratio** - Anonymous users cost more (polling)

### When to Upgrade Infrastructure

**You'll need to consider upgrades when:**
- 5,000+ daily active users
- Firebase starts throttling (check dashboard)
- Polling creates too much load
- Rate limits are hit frequently

**Upgrade Path:**
1. Move rate limiting to Redis (distributed)
2. Use Firebase Admin SDK batching
3. Implement CDN for audio files
4. Consider WebSocket for real-time updates

---

## 💰 Cost Estimation

### Conservative Estimate (1000 daily users):
```
Suno API:
- 2000 songs/day × $X/song = $X/day

Firebase (assuming you stay in free tier):
- Reads: 50,000/day (free: 50,000/day) = $0
- Writes: 4,000/day (free: 20,000/day) = $0
- Storage: Minimal (only metadata)

Total: ~$X/day (mainly Suno API)
```

### At Scale (10,000 daily users):
```
Suno API:
- 20,000 songs/day × $X/song = $X/day

Firebase (likely over free tier):
- Reads: 500,000/day × $0.06/100k = $X
- Writes: 40,000/day × $0.18/100k = $X

Total: ~$X/day
```

*Replace $X with your actual Suno API pricing*

---

## 🔧 Quick Tweaks for Cost Control

### Reduce Costs by 30-50%:

1. **Increase polling interval** (anonymous users)
   ```typescript
   // In app/account/page.tsx:220
   }, 10000); // 10 seconds instead of 5
   ```

2. **Stricter rate limits**
   ```typescript
   // In lib/ratelimit.ts
   SONG_CREATION: {
     maxRequests: 2, // Down from 3
     windowSeconds: 60,
   },
   ```

3. **Lower daily limit**
   ```typescript
   SONG_CREATION_DAILY: {
     maxRequests: 5, // Down from 10
     windowSeconds: 86400,
   },
   ```

---

## 📈 Monitoring Dashboard (TODO)

Create `/app/admin/page.tsx` to view:
```typescript
import { getDailyUsageStats } from '@/lib/cost-monitor';

// Show daily stats
const stats = await getDailyUsageStats();
```

Display:
- Total songs created today
- Total cost
- Unique users
- Trends over time

---

## ⚠️ Emergency Cost Controls

If costs spike unexpectedly:

1. **Pause song creation temporarily**
   - Add environment variable: `PAUSE_SONG_CREATION=true`
   - Check in API: return maintenance message

2. **Aggressive rate limits**
   - Set `SONG_CREATION.maxRequests = 1`
   - Set `SONG_CREATION_DAILY.maxRequests = 3`

3. **Check for abuse**
   - Query `api_usage_logs` for suspicious patterns
   - Block specific IPs/users if needed

---

## 📚 Next Steps

1. Enable cost monitoring in production
2. Monitor for 1 week to establish baseline
3. Adjust rate limits based on actual usage
4. Build admin dashboard for monitoring
5. Set up alerts for daily cost thresholds

---

## Questions?

- Rate limits too strict? Adjust `lib/ratelimit.ts`
- Costs too high? Check `COST_CONTROL_GUIDE.md` tweaks
- Need real-time for anonymous users? Consider upgrading polling to WebSocket
