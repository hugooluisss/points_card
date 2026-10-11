# Spec Delta

## Purpose

Definir cómo un comercio configura sus programas de sellos o puntos, las reglas de acumulación y las recompensas disponibles.

## ADDED Requirements

### Requirement: Program configuration
The system SHALL let an owner or manager create a program with a mode (stamps or points), a name, a validity period and its accumulation rule.

#### Scenario: Stamps program
- **WHEN** a manager creates a stamps program with a goal of N stamps
- **THEN** the program is stored with that goal and the rule of one stamp per valid operation

#### Scenario: Points program
- **WHEN** a manager creates a points program with a rule of P points per currency unit
- **THEN** the program is stored with that rule

#### Scenario: Invalid configuration
- **WHEN** the goal or rate is zero or negative
- **THEN** the program is rejected with a validation message

### Requirement: Rewards catalog
The system SHALL let a program define rewards with a name, a cost (stamps or points) and optional conditions.

#### Scenario: Reward available
- **WHEN** an account reaches the cost of a reward
- **THEN** the reward is shown as redeemable for that account

### Requirement: Single active program per mode
A business SHALL have at most one active program per mode at the same time.

#### Scenario: Second active program
- **WHEN** a manager activates a second program of the same mode
- **THEN** the system rejects the activation until the first one is deactivated

### Requirement: Program change protection
Changing a program rule MUST NOT alter balances already recorded.

#### Scenario: Rule change
- **WHEN** the points rate of a program changes
- **THEN** existing transactions and balances remain unchanged and the new rate applies to later operations
