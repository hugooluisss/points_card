# Spec Delta

## Purpose

Definir las métricas con las que un comercio puede demostrar el retorno del programa, con definiciones inequívocas.

## ADDED Requirements

### Requirement: Metric definitions
The system SHALL calculate and document these metrics: registrations, saved passes, active customers, repeat visit rate and redemption rate.

#### Scenario: Repeat visit rate
- **WHEN** the repeat visit rate is calculated for a period
- **THEN** it equals customers with two or more valid operations divided by customers with at least one

#### Scenario: Redemption rate
- **WHEN** the redemption rate is calculated
- **THEN** it equals redemptions divided by rewards that became available in the period

### Requirement: Saved pass detection
The system SHALL count a pass as saved only when the platform confirms the pass was added, and SHALL otherwise report issued passes separately.

#### Scenario: Platform without confirmation
- **WHEN** a platform gives no confirmation of saving
- **THEN** the metric shows issued passes and labels saved passes as unavailable for that platform

### Requirement: Consistency with ledger
Metrics MUST be derived from the ledger and customer records, and reversed transactions SHALL not count as valid operations.

#### Scenario: Reversed operation
- **WHEN** an operation is reversed
- **THEN** it is excluded from valid operations and visit counts

### Requirement: Query performance
Dashboard queries SHALL return within a defined time for a business with up to a stated volume, using indexed aggregate queries.

#### Scenario: Large business
- **WHEN** a business has the reference volume of operations
- **THEN** the home loads within the defined time
