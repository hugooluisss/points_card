# Spec Delta

## Purpose

Definir la consulta y exportación de clientes, tarjetas, movimientos y canjes por parte del comercio.

## ADDED Requirements

### Requirement: Customer list and detail
The system SHALL list customers with search and pagination and show for each its card status, balance, last visit and movements.

#### Scenario: Search
- **WHEN** staff searches by name or contact
- **THEN** matching customers of the business are listed

#### Scenario: Detail
- **WHEN** a manager opens a customer
- **THEN** the card, balance and chronological movements are shown

### Requirement: Movements and redemptions list
The system SHALL list movements and redemptions with filters by date range, branch, staff user and type.

#### Scenario: Filtered list
- **WHEN** the user filters by branch and dates
- **THEN** only matching movements are listed with totals

### Requirement: CSV export
The system SHALL export customers and movements as CSV limited to the business and the user's permissions.

#### Scenario: Export by manager
- **WHEN** a manager exports movements
- **THEN** a CSV with the filtered rows is downloaded and the export is audited

#### Scenario: Cashier export denied
- **WHEN** a cashier requests an export
- **THEN** the request is denied

### Requirement: Marketing consent visibility
Customer views and exports SHALL show whether marketing consent is active.

#### Scenario: Consent flag
- **WHEN** a customer revoked marketing consent
- **THEN** lists and exports show it as not consented

### Requirement: Failed sync visibility
The system SHALL show passes whose update failed and allow retrying them.

#### Scenario: Retry
- **WHEN** a manager retries a failed sync
- **THEN** the job is queued again and its result is shown
