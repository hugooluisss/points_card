# Spec Delta

## Purpose

Definir el lector web con el que un empleado autorizado escanea la tarjeta del cliente y registra una operación sin instalar una app.

## ADDED Requirements

### Requirement: Browser scanning
The scanner SHALL read a card code using the camera of a mobile browser and SHALL resolve it to the card of the staff user's business.

#### Scenario: Valid card
- **WHEN** staff scans a code of a card of the same business
- **THEN** the customer progress or balance and the available operations are shown

#### Scenario: Card of another business
- **WHEN** the scanned code belongs to another business
- **THEN** the scanner reports an unknown card and reveals nothing about it

#### Scenario: Camera unavailable
- **WHEN** the camera cannot be used
- **THEN** the staff user can enter the code manually

### Requirement: Operation confirmation
The scanner SHALL require staff to choose the operation and confirm it before it is recorded.

#### Scenario: Add a stamp
- **WHEN** staff confirms one stamp
- **THEN** the operation is recorded and the new progress is shown

#### Scenario: Add points by amount
- **WHEN** staff enters a purchase amount and confirms
- **THEN** the points granted follow the program rule and are shown before confirming

### Requirement: Redemption flow
The scanner SHALL let staff redeem an available reward after confirmation.

#### Scenario: Redeem
- **WHEN** staff selects an available reward and confirms
- **THEN** the redemption is recorded and the new balance is shown

### Requirement: Failure feedback
The scanner SHALL show clear messages for rejected operations and for connection problems, without duplicating an operation on retry.

#### Scenario: Connection lost
- **WHEN** the connection drops after confirming
- **THEN** a retry reuses the same idempotency key and does not duplicate the operation
