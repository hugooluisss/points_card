# Spec Delta

## Purpose

Definir el libro de movimientos que es la fuente de verdad de sellos, puntos y canjes, con saldo derivado, idempotencia y trazabilidad.

## ADDED Requirements

### Requirement: Transaction recording
The system SHALL record every accumulation, redemption, adjustment and reversal as an immutable transaction with actor, branch, amount, reference and timestamp.

#### Scenario: Accumulation
- **WHEN** an authorized staff user accumulates one stamp on a card
- **THEN** a transaction is stored and the account progress increases by one

#### Scenario: Transactions are immutable
- **WHEN** a correction is needed
- **THEN** a reversing or adjusting transaction is added and the original is kept unchanged

### Requirement: Derived balance
The account balance SHALL be derived from its transactions and MUST never be negative.

#### Scenario: Insufficient balance
- **WHEN** a redemption costs more than the balance
- **THEN** the redemption is rejected and no transaction is stored

### Requirement: Idempotency
Each write operation SHALL carry an idempotency key, and repeating a request with the same key MUST NOT create a second transaction.

#### Scenario: Retried request
- **WHEN** the same request with the same key is sent twice
- **THEN** a single transaction exists and both responses report the same result

### Requirement: Concurrent safety
Simultaneous operations on the same account SHALL not corrupt the balance or allow a double redemption.

#### Scenario: Double redemption
- **WHEN** two redemptions of the same reward arrive at the same time and the balance covers only one
- **THEN** exactly one succeeds and the other is rejected

### Requirement: Redemption
The system SHALL redeem a reward by recording a redemption and its transaction atomically.

#### Scenario: Successful redemption
- **WHEN** staff redeems a reward the account can afford
- **THEN** the cost is deducted and a redemption record is created in one operation

### Requirement: Goal reached for stamps
When a stamps account reaches the program goal, the system SHALL mark the reward as available without discarding extra stamps.

#### Scenario: Goal reached
- **WHEN** the stamp count reaches the goal
- **THEN** the reward becomes redeemable and redeeming it deducts the goal amount
