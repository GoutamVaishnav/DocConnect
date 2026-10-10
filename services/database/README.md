# DocConnect database schema

`schema/001_initial.sql` is the first PostgreSQL schema for DocConnect. It is not automatically executed yet, because a PostgreSQL instance and migration runner have not been configured in this local project.

## Before running it

1. Install PostgreSQL locally.
2. Create a dedicated development database such as `docconnect_dev`.
3. Set `DATABASE_URL` in your local `.env` file.
4. Run the SQL through `psql` or the migration tool selected in the next backend phase.

The schema covers users, role-specific profiles, email OTP challenges, consultations, messages, and notification records. It deliberately holds no production medical data in the repository.
