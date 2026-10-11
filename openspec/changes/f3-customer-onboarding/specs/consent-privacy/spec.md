# Spec Delta

## Purpose

Definir el manejo de aviso de privacidad, consentimientos y derechos ARCO conforme a la legislación mexicana de protección de datos personales.

## ADDED Requirements

### Requirement: Privacy notice acceptance
The system SHALL show the privacy notice before registration and SHALL record acceptance with notice version, timestamp and origin.

#### Scenario: Registration without acceptance
- **WHEN** the customer does not accept the privacy notice
- **THEN** the registration is not completed

#### Scenario: Acceptance recorded
- **WHEN** the customer accepts
- **THEN** a consent record stores purpose, version, timestamp and origin

### Requirement: Separate marketing consent
Marketing consent SHALL be a separate, optional, unchecked-by-default choice, and refusing it MUST NOT prevent issuing the card.

#### Scenario: Marketing refused
- **WHEN** the customer leaves marketing consent unchecked
- **THEN** the card is issued and no promotional message is allowed for that customer

### Requirement: Consent revocation
The customer SHALL be able to revoke marketing consent at any time, and the revocation MUST take effect immediately.

#### Scenario: Revocation
- **WHEN** the customer revokes consent through the secure link
- **THEN** a revocation is recorded with timestamp and the customer is excluded from promotional use

### Requirement: ARCO rights
The system SHALL let a customer request access, rectification and cancellation of personal data, and the business SHALL be able to resolve them.

#### Scenario: Cancellation request
- **WHEN** a customer requests deletion
- **THEN** personal data is removed or anonymized, the card is disabled, and the request is recorded

#### Scenario: Access request
- **WHEN** a customer requests access to their data
- **THEN** the business can export the data held for that customer

### Requirement: Data minimization and retention
The system SHALL store only data required for the configured purposes and SHALL apply a documented retention period.

#### Scenario: Unused field
- **WHEN** a business has not enabled a field
- **THEN** that data is not collected or stored
