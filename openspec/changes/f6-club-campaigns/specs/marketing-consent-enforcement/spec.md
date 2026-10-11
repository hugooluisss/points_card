# Spec Delta

## Purpose

Garantizar que ningún mensaje promocional llegue a un cliente que no haya dado su consentimiento de marketing vigente.

## ADDED Requirements

### Requirement: Consent gate
Every promotional send SHALL include only customers with active marketing consent for the channel at send time.

#### Scenario: Consent revoked before send
- **WHEN** a customer revokes consent after a campaign was scheduled
- **THEN** the customer is excluded at send time

#### Scenario: No consent
- **WHEN** a customer never gave marketing consent
- **THEN** the customer is never part of a promotional audience

### Requirement: Operational messages separated
Operational information about the card SHALL be distinguished from promotional messages and MUST NOT be used to carry promotion.

#### Scenario: Message classification
- **WHEN** a message is created
- **THEN** it must be labeled operational or promotional and promotional ones go through the consent gate

### Requirement: Opt-out in every channel
Each promotional message on a channel with that capability SHALL provide a way to opt out.

#### Scenario: Opt-out
- **WHEN** a customer uses the opt-out
- **THEN** the revocation is recorded and applies to later sends

### Requirement: Audit of sends
The system SHALL log which audience was selected and which consent state justified each send.

#### Scenario: Audit review
- **WHEN** an owner reviews a campaign
- **THEN** the audience count and consent basis are visible
