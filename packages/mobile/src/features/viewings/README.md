# Viewings Feature (Mobile)

## Overview
Handles scheduling and managing property viewings.

## Screens
| Screen | Description |
|--------|-------------|
| `ViewingsScreen` | List of scheduled/past viewings |
| `ScheduleViewingScreen` | Schedule a new viewing |

## Viewing Statuses
- 🟡 Pending - Awaiting response
- 🟢 Confirmed - Viewing scheduled
- 🔵 Rescheduled - New time proposed
- ✅ Completed - Viewing done
- ❌ Cancelled - Viewing cancelled

## Testing
```bash
npm test -- --testPathPatterns="viewing"
```

## Related Features
- [Chat](../chat/README.md) - Schedule viewings via chat
- [Matching](../matching/README.md) - Only matches can schedule viewings
