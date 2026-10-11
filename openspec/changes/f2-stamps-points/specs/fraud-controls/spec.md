# Spec Delta

## Purpose

Definir los límites y controles que reducen el fraude en la acumulación de sellos y puntos, dado que el código de la tarjeta es estático y puede copiarse.

## ADDED Requirements

### Requirement: Minimum interval per card
The system SHALL reject an accumulation on a card if the previous accumulation happened within the configured minimum interval.

#### Scenario: Too soon
- **WHEN** staff accumulates on a card twice within the minimum interval
- **THEN** the second operation is rejected with the remaining wait time

### Requirement: Staff and daily limits
The system SHALL enforce configurable limits of accumulations per card per day and per staff user per day.

#### Scenario: Daily limit reached
- **WHEN** a card reaches its daily limit
- **THEN** further accumulations that day are rejected

### Requirement: Points amount control
For a points program, the system SHALL limit the amount a single operation may grant and SHALL store the reference entered by staff.

#### Scenario: Amount above limit
- **WHEN** an operation exceeds the per-operation maximum
- **THEN** it requires a manager and is otherwise rejected

### Requirement: Reversal with reason
The system SHALL allow a manager to reverse a transaction with a mandatory reason.

#### Scenario: Reversal without reason
- **WHEN** a reversal is submitted without a reason
- **THEN** it is rejected

### Requirement: Anomaly visibility
The system SHALL flag a staff user whose number of operations exceeds a configured threshold.

#### Scenario: Unusual activity
- **WHEN** a staff user exceeds the threshold in a day
- **THEN** the activity is flagged and visible to the owner
