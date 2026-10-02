# NNC HR Security Specification & Invariants

## 1. Data Invariants
- Admin email `nnc.cabletv242@gmail.com` has global administrative oversight and approval rights.
- Employees can view their own profile and attendance, as well as team directory (name, code, department, position).
- Sensitive fields like salary, bank account details, and 2FA secrets are restricted to the employee themselves or HR Admins.
- Leave requests can be submitted by the employee (`employeeId == request.auth.uid`), and only HR/Admin or designated approver can update status to 'approved' or 'rejected'.
- Payroll records can only be generated, edited, and approved by HR Admins; employees can read only their own approved/paid payslips.
- Timestamps and key IDs cannot be maliciously forged.

## 2. The Dirty Dozen Payloads (Designed to break laws of Identity, Integrity, and State)
1. **Malicious Role Escalation**: An employee updates their own role from 'employee' to 'admin'.
2. **Ghost Salary Tamper**: An employee updates their own baseSalary from 25,000 to 150,000.
3. **Impersonated Leave Submission**: User A submits a leave request with `employeeId: "user_B"`.
4. **Self-Approval Exploit**: An employee updates their own leave status directly from 'pending' to 'approved'.
5. **Unauthorized Payroll Generation**: Non-admin user writes a payroll document with massive bonus.
6. **Other Employee's Payslip Snooping**: Employee A queries and reads Employee B's confidential payslip.
7. **Junk String ID Exhaustion Attack**: Payload targeting document ID with 50KB junk string to exhaust memory.
8. **Negative Leave Balances / Floats Injection**: Injecting string values into `totalDays` or negative day amounts.
9. **Fake Clock-In Forgery**: Writing an attendance record for a non-existent employee or another user.
10. **Line Notify Token Scraping**: Non-admin accessing system settings to read the secret Line Notify token.
11. **Immutable Field Mutator**: Updating `createdAt` or `employeeId` on a confirmed payroll record.
12. **Unauthenticated Query Crawl**: Reading employee records without being logged in.
