# Rate Limit Guide - What Users See

## 🎯 Overview

Your app has **two layers of rate limiting** to protect costs and ensure stability:

1. **Your App's Rate Limit**: 3 songs/minute per user
2. **Suno API Rate Limit**: 20 requests/10 seconds (global)

---

## 📱 User Experience - Different Scenarios

### ✅ **Normal Usage** (Happy Path)

**User Action:**
- Creates 1-2 songs
- Waits for them to process
- Creates another song

**What Happens:**
- ✅ Request passes your rate limit
- ✅ Request passes Suno API limit
- 🎵 Song starts generating
- User redirected to "My Songs" page

**User Sees:**
- Success! Song appears as "Processing..."
- Updates automatically as song completes

---

### ⚠️ **Scenario 1: User Spamming** (Your Rate Limit)

**User Action:**
- Rapidly clicks "Create Song" 4 times in 30 seconds
- Tries to create 5th song

**What Happens:**
- 1st, 2nd, 3rd songs: ✅ Created successfully
- 4th song: ❌ Blocked by your rate limit (NO API call to Suno = no cost!)

**User Sees:**
```
⏸️ Please slow down!

You're creating songs too quickly.
Wait a moment and try again.
```

**When Can They Try Again:**
- After 60 seconds from their first request
- Rate limit resets automatically

**Your Costs:**
- Only 3 songs charged ✅
- 4th attempt = $0 (blocked before calling Suno)

---

### 🔥 **Scenario 2: Traffic Spike** (Suno Rate Limit)

**Situation:**
- 25 users simultaneously create songs within 10 seconds
- Your rate limit: ✅ Each user is under 3/min
- Suno's limit: ❌ 25 requests > 20 requests/10s

**What Happens:**
- First 20 requests: ✅ Suno accepts them
- Requests 21-25: ❌ Suno returns 429 error

**User Sees (for requests 21-25):**
```
🎵 High demand right now!

Our song generation service is experiencing
high traffic. Please wait a few seconds and
try again.
```

**What Happens Next:**
- Users wait 5-10 seconds
- Try again → ✅ Success (Suno's limit has reset)

**Your Costs:**
- First 20 songs: Charged ✅
- Last 5 attempts: $0 (Suno rejected them)

---

## 🔢 Rate Limit Math

### Your App Limit (3/minute per user)

**Example:**
- User creates song at `12:00:00`
- User creates song at `12:00:20`
- User creates song at `12:00:40`
- User tries again at `12:00:50` → ❌ Blocked
- User tries again at `12:01:05` → ✅ Allowed (60s passed since first)

### Suno API Limit (20/10 seconds global)

**Example with 100 concurrent users:**
- 100 users all click "Create Song" at same time
- Your app sends 100 requests to Suno
- Suno accepts first 20 within 10 seconds
- Remaining 80 get 429 errors
- After 10 seconds, next batch of 20 succeeds
- After 20 seconds, next batch of 20 succeeds
- etc.

**Result:**
- Users experience delays during high traffic
- But system stays stable
- No one's account is damaged

---

## 🎛️ Adjusting Rate Limits

### If You Get Too Many Suno 429 Errors:

**Option 1: Tighten Your Rate Limit**
```typescript
// In lib/ratelimit.ts
SONG_CREATION: {
  maxRequests: 2,  // Down from 3
  windowSeconds: 60,
}
```

**Effect:**
- Spreads requests more evenly
- Less likely to hit Suno's limit
- Users wait longer between songs

---

**Option 2: Add Queue System (Advanced)**
- When Suno returns 429, retry after 10 seconds
- Implement with job queue (Bull, BullMQ)
- User sees "Song queued - will start soon"

---

**Option 3: Increase Window (More Strict)**
```typescript
SONG_CREATION: {
  maxRequests: 3,
  windowSeconds: 120,  // 3 songs per 2 minutes instead of 1 minute
}
```

---

## 📊 Monitoring Rate Limits

### Check Rate Limit Hits

Look for these in your logs:
```bash
# Your rate limit being hit
"Too many requests. Please wait a moment and try again."

# Suno rate limit being hit
"Suno API rate limit exceeded"
```

### If You See Many Suno Rate Limits:

**Diagnosis:**
- Many concurrent users creating songs
- Traffic spike during peak hours
- Your rate limit isn't tight enough

**Solutions:**
1. Reduce `maxRequests` to 2 per minute
2. Add queuing system
3. Upgrade to higher Suno API tier (if available)

---

## ✅ Current Configuration

**Your Settings:**
```typescript
Per-user limit: 3 songs per 60 seconds
Suno's limit:   20 songs per 10 seconds (global)
```

**Theoretical Max Capacity:**
- With perfect distribution: 120 songs/minute across all users
- Realistically: 60-80 songs/minute (accounting for burst traffic)

**When to Worry:**
- If you have 100+ concurrent users creating songs
- Solution: Implement queue or reduce per-user limit

---

## 🚀 Summary

**What's Protected:**
✅ Your wallet (rate limits prevent cost spikes)
✅ Suno API stability (graceful handling of 429s)
✅ User experience (clear error messages)
✅ Your server (no infinite retry loops)

**What Users Experience:**
- Normal usage: Seamless, no issues
- Spamming: Polite "slow down" message
- Traffic spikes: "High demand" message, retry succeeds

**Action Items:**
1. Monitor logs for rate limit errors
2. If Suno 429s are common, reduce your rate limit
3. Consider queue system for scaling beyond 100 concurrent users
