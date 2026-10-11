# Spec Delta

## Purpose

Definir cómo un cliente se registra escaneando el QR público de un comercio y cómo el comercio configura qué datos pide.

## ADDED Requirements

### Requirement: Public registration QR
The system SHALL generate a public QR for each business that opens its registration landing, and the QR MUST NOT grant stamps or points.

#### Scenario: Scan opens landing
- **WHEN** a customer scans the business QR
- **THEN** the landing opens with the business logo, colors and name

#### Scenario: QR grants nothing
- **WHEN** the registration QR is scanned repeatedly
- **THEN** no transaction is created

### Requirement: Configurable registration form
The system SHALL let the business choose which fields the form requests among name, email, phone and birthday, and the form MUST request the minimum by default.

#### Scenario: Default fields
- **WHEN** a business has not configured the form
- **THEN** the form asks only for name and one contact method

#### Scenario: Business adds a field
- **WHEN** the business enables birthday
- **THEN** the form shows it as optional unless the business marks it required

### Requirement: Customer creation per business
The system SHALL create a customer isolated per business, and the same person registering in two businesses MUST produce two unrelated customer records.

#### Scenario: Two businesses
- **WHEN** the same email registers in business A and business B
- **THEN** each business sees only its own customer record

### Requirement: Duplicate prevention
The system SHALL prevent creating a second card for the same customer in the same business when a unique contact data matches.

#### Scenario: Repeated registration
- **WHEN** a customer registers again with the same email in the same business
- **THEN** no new card is created and the existing card is offered through a secure link

### Requirement: Abuse protection
The public registration endpoint SHALL be rate limited and protected against automated submissions.

#### Scenario: Burst of requests
- **WHEN** one origin sends registrations above the limit
- **THEN** further requests are rejected temporarily
