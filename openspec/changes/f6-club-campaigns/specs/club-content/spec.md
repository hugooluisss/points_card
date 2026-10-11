# Spec Delta

## Purpose

Definir el pase de la modalidad club y cómo el comercio publica contenido informativo que se refleja en él.

## ADDED Requirements

### Requirement: Club program
The system SHALL support a club program that issues passes with identity and informational content and no stamps or points.

#### Scenario: Club card issued
- **WHEN** a customer registers in a club program
- **THEN** the pass shows the business identity and the customer card code and no balance

### Requirement: Content publishing
A manager SHALL be able to publish informational content with title, text and validity dates, and the system SHALL reflect it on issued passes.

#### Scenario: New content
- **WHEN** a manager publishes content
- **THEN** a sync job updates the passes of that program with the latest content

#### Scenario: Expired content
- **WHEN** the validity of the content ends
- **THEN** it is removed from the passes on the next sync

### Requirement: Pass content limits
Content SHALL respect the display limits documented in the wallet findings, and the panel MUST warn when text exceeds them.

#### Scenario: Text too long
- **WHEN** a manager enters text above the limit
- **THEN** the panel shows the limit and blocks publishing

### Requirement: Value without notifications
The club mode SHALL remain useful when no promotional alert is delivered, by keeping identity and up-to-date information on the pass.

#### Scenario: No alert delivered
- **WHEN** content is updated and the platform shows no alert
- **THEN** the updated content is visible when the customer opens the pass
