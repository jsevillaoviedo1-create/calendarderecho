# Security Specification & Test Protocol

## 1. Data Invariants

1. **Strict User Isolation**:
   - Every user document `/users/{userId}` can ONLY be read, created, or updated by the authenticated user whose `request.auth.uid == userId`.
   - Every event in `/users/{userId}/events/{eventId}` belongs exclusively to `{userId}`. An authenticated user `userB` can never read, list, create, update, or delete any event under `/users/{userA}/events`.

2. **Immutable Identity**:
   - The `userId` field inside any `CalendarEvent` payload must strictly equal `request.auth.uid` and `{userId}` in the document path.
   - During updates, `incoming().userId == existing().userId`.

3. **Field & Type Boundaries**:
   - Titles are strictly non-empty strings with maximum length of 200 characters.
   - Start and end dates must be strings with maximum length 50 characters.
   - Description must not exceed 3000 characters.
   - Location must not exceed 500 characters.

4. **Default Deny**:
   - All paths not explicitly matched and authorized are strictly denied.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Cross-Tenant User Profile Read)**:
   - Target: `GET /users/user_target_victim`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Expected Result: `PERMISSION_DENIED`

2. **Payload 2 (Cross-Tenant Event Snooping)**:
   - Target: `GET /users/user_target_victim/events/secret_meeting_123`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Expected Result: `PERMISSION_DENIED`

3. **Payload 3 (Cross-Tenant Event Listing)**:
   - Target: `LIST /users/user_target_victim/events`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Expected Result: `PERMISSION_DENIED`

4. **Payload 4 (Unauthenticated Document Write)**:
   - Target: `CREATE /users/user_victim/events/evil_injection`
   - Request Auth: `null`
   - Expected Result: `PERMISSION_DENIED`

5. **Payload 5 (Identity Spoofing in Event Creation)**:
   - Target: `CREATE /users/user_attacker/events/forged_event`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Payload: `{ "title": "Phishing", "start": "2026-10-14T10:00:00Z", "userId": "user_victim" }`
   - Expected Result: `PERMISSION_DENIED` (userId does not match request.auth.uid)

6. **Payload 6 (Shadow Key Injection / Unknown Properties)**:
   - Target: `CREATE /users/user_attacker/events/malicious_props`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Payload: `{ "title": "Good Event", "start": "2026-10-14T10:00:00Z", "userId": "user_attacker", "isAdmin": true, "elevatePrivilege": true }`
   - Expected Result: `PERMISSION_DENIED`

7. **Payload 7 (Oversized Title - Denial of Wallet Attack)**:
   - Target: `CREATE /users/user_attacker/events/bloated_title`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Payload: `{ "title": "A".repeat(5000), "start": "2026-10-14T10:00:00Z", "userId": "user_attacker" }`
   - Expected Result: `PERMISSION_DENIED`

8. **Payload 8 (Empty Title Creation)**:
   - Target: `CREATE /users/user_attacker/events/empty_title`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Payload: `{ "title": "", "start": "2026-10-14T10:00:00Z", "userId": "user_attacker" }`
   - Expected Result: `PERMISSION_DENIED`

9. **Payload 9 (Cross-User Event Deletion)**:
   - Target: `DELETE /users/user_victim/events/vital_event`
   - Request Auth: `auth.uid = 'user_attacker'`
   - Expected Result: `PERMISSION_DENIED`

10. **Payload 10 (Event Ownership Hijacking via Update)**:
    - Target: `UPDATE /users/user_attacker/events/event_1`
    - Request Auth: `auth.uid = 'user_attacker'`
    - Payload: `{ "userId": "user_victim" }`
    - Expected Result: `PERMISSION_DENIED` (Immutable userId)

11. **Payload 11 (Invalid Path Character / ID Poisoning)**:
    - Target: `CREATE /users/user_attacker/events/../../escape_path`
    - Request Auth: `auth.uid = 'user_attacker'`
    - Expected Result: `PERMISSION_DENIED`

12. **Payload 12 (Type Poisoning - String Start Date Replaced With Object)**:
    - Target: `CREATE /users/user_attacker/events/type_poison`
    - Request Auth: `auth.uid = 'user_attacker'`
    - Payload: `{ "title": "Valid Title", "start": { "$corrupt": true }, "userId": "user_attacker" }`
    - Expected Result: `PERMISSION_DENIED`
