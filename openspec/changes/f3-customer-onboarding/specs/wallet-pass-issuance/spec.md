# Spec Delta

## Purpose

Definir cómo se emite el pase al cliente tras el registro, cómo se guarda en su Wallet y cómo recupera su tarjeta.

## ADDED Requirements

### Requirement: Pass issuance after registration
The system SHALL issue a pass of the business program right after registration and offer the Wallet option suited to the customer device.

#### Scenario: Android device
- **WHEN** a customer registers from an Android device
- **THEN** the landing offers adding the pass to Google Wallet

#### Scenario: iPhone device
- **WHEN** a customer registers from an iPhone
- **THEN** the landing offers adding the pass to Apple Wallet

#### Scenario: Unsupported device
- **WHEN** the device supports neither Wallet
- **THEN** the landing shows the card code and a link to retrieve it later

### Requirement: Opaque card identifier
The pass code SHALL contain only an opaque identifier that does not reveal personal data or balance.

#### Scenario: Code content
- **WHEN** the pass code is decoded
- **THEN** it contains no name, email, phone or balance

### Requirement: Card recovery
The system SHALL let a customer recover the card through a secure, expiring link sent to their registered contact.

#### Scenario: Lost phone
- **WHEN** a customer requests recovery
- **THEN** a single-use expiring link is sent and the old pass keeps working until disabled

### Requirement: Pass lifecycle
The system SHALL support disabling a pass and reissuing a new one for the same account without losing balance.

#### Scenario: Reissue
- **WHEN** a manager reissues a card
- **THEN** the old code stops working and the new pass shows the same balance
