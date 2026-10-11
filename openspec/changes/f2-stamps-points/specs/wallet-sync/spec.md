# Spec Delta

## Purpose

Definir cómo los cambios de saldo se reflejan en el pase del Wallet de forma asíncrona, con reintentos y sin perder cambios.

## ADDED Requirements

### Requirement: Sync after balance change
The system SHALL enqueue a pass update whenever a transaction changes an account, in the same database transaction as the change.

#### Scenario: Change recorded
- **WHEN** a transaction is committed
- **THEN** exactly one pending sync job exists for that account

### Requirement: Retries
Failed updates SHALL be retried with increasing delay up to a maximum number of attempts, after which the job is marked failed and visible.

#### Scenario: Temporary failure
- **WHEN** the Wallet provider returns a temporary error
- **THEN** the job is retried later and the balance in the backend is unaffected

#### Scenario: Permanent failure
- **WHEN** the maximum attempts are reached
- **THEN** the job is marked failed with the error and appears in the failed list

### Requirement: Latest state wins
The sync SHALL send the latest account state, so multiple pending jobs for one account result in one update with the final value.

#### Scenario: Rapid changes
- **WHEN** several transactions occur before the sync runs
- **THEN** the pass receives the final balance

### Requirement: Backend remains source of truth
A failed or delayed sync MUST NOT change balances, and the backend balance SHALL prevail over what the pass shows.

#### Scenario: Pass shows stale data
- **WHEN** the pass displays an older value
- **THEN** the next scan uses the backend value
