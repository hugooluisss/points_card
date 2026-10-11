# Spec Delta

## Purpose

Definir los planes de suscripción, sus límites y cómo se aplican a un comercio, sin fijar precios en el código.

## ADDED Requirements

### Requirement: Plan definition
The system SHALL store plans as data with name, monthly price, currency and limits of branches, staff users and issued cards.

#### Scenario: Plan edited
- **WHEN** a platform administrator changes a plan limit
- **THEN** the new limit applies to later operations and existing data is kept

### Requirement: Limit enforcement
The system SHALL reject operations that would exceed the limits of the business plan with a message that offers an upgrade.

#### Scenario: Branch limit reached
- **WHEN** a business at its branch limit tries to create another branch
- **THEN** the creation is rejected and the message names the limit

#### Scenario: Existing data above new limit
- **WHEN** a plan change leaves a business above a limit
- **THEN** existing records keep working and only new creations are blocked

### Requirement: Default plan
A newly registered business SHALL start on a trial plan with defined limits and duration.

#### Scenario: New business
- **WHEN** a business registers
- **THEN** it starts on trial and its remaining days are visible

### Requirement: Plan visibility
The panel SHALL show the current plan, limits and usage.

#### Scenario: Usage display
- **WHEN** the owner opens the billing screen
- **THEN** current usage against each limit is shown
