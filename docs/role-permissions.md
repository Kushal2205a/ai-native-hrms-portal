# Role Permissions

## Roles
- Admin
- HR
- Employee
- Candidate

## Permission Matrix

| Feature | Admin | HR | Employee | Candidate |
|---|---|---|---|---|
| View admin dashboard | Yes | No | No | No |
| View HR dashboard | Yes | Yes | No | No |
| View employee dashboard | No | No | Yes | No |
| View candidate dashboard | No | No | No | Yes |
| Manage users | Yes | Limited | No | No |
| Manage departments | Yes | Limited | No | No |
| Create job postings | Yes | Yes | No | No |
| Edit job postings | Yes | Yes | No | No |
| View open jobs | Yes | Yes | Limited | Yes |
| Apply to jobs | No | No | No | Yes |
| View all applications | Yes | Yes | No | No |
| View own applications | No | No | No | Yes |
| Schedule interviews | Yes | Yes | No | No |
| View own interviews | No | No | No | Yes |
| Manage employee records | Yes | Yes | Own profile request only | No |
| Submit employee update request | No | No | Yes | No |
| View analytics | Yes | Yes | Own metrics only | No |
| View flight risk | Yes | Yes | No | No |
| Use HR chatbot | Yes | Yes | Yes | Limited |

## Routing Rule
After login, redirect users based on `profiles.role`.

- admin -> /dashboard/admin
- hr -> /dashboard/hr
- employee -> /dashboard/employee
- candidate -> /dashboard/candidate

## Authorization Rule
Frontend visibility is not enough. Protected data must also be checked server-side using Supabase session and profile role.