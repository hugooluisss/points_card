# Spec Delta

## Purpose

Define qué debe demostrar la prueba de concepto sobre emisión y actualización de pases de sellos, puntos y club en Apple Wallet y Google Wallet, para decidir el tipo de pase de cada modalidad con evidencia.

## ADDED Requirements

### Requirement: Pass issuance per mode and platform
The proof of concept SHALL issue one pass for each combination of mode (stamps, points, club) and platform (Apple Wallet, Google Wallet), and each pass MUST be saved on a real device.

#### Scenario: All six passes saved
- **WHEN** the proof of concept is executed
- **THEN** six passes are issued and each one is confirmed as saved on a physical Android or iOS device, with a screenshot as evidence

#### Scenario: Combination not supported
- **WHEN** a mode cannot be represented on a platform
- **THEN** the combination is recorded as not viable together with the official documentation reason, and the closest alternative pass type is proposed

### Requirement: Card identity QR
Each issued pass SHALL show a code that uniquely identifies the card and that does not contain the balance or personal data of the customer.

#### Scenario: Code identifies the card only
- **WHEN** the code of an issued pass is decoded
- **THEN** the content is an opaque identifier that the backend can resolve, and it contains no balance, name, email or phone

#### Scenario: Code readable from a browser
- **WHEN** the code of a pass saved on a device is scanned with the camera of a mobile browser
- **THEN** the identifier is read correctly under normal indoor lighting

### Requirement: Backend-driven balance update
The proof of concept SHALL change the stamps or points shown on an already saved pass from the backend, without the customer re-adding the pass.

#### Scenario: Stamps update
- **WHEN** the backend adds one stamp to a saved stamps pass
- **THEN** the pass shows the new progress and the elapsed time between the backend call and the visible change is recorded

#### Scenario: Points update
- **WHEN** the backend changes the points of a saved points pass
- **THEN** the pass shows the new balance and the elapsed time is recorded

#### Scenario: Update while the device is offline
- **WHEN** the backend updates a pass while the device has no connectivity and the connectivity returns later
- **THEN** the pass shows the latest value after reconnecting, or the behavior observed is recorded if it does not

### Requirement: Stamps representation limits
The proof of concept SHALL record how each platform can display stamp progress, including the available fields, images and their limits.

#### Scenario: Progress shown with the available elements
- **WHEN** a stamps pass is displayed with N of M stamps
- **THEN** the report documents which element represents the progress (text, image or field) and the maximum M that displays correctly

### Requirement: Club pass without balance
The proof of concept SHALL issue a club pass that holds identity and informational content and no stamps or points.

#### Scenario: Informational content update
- **WHEN** the backend changes the informational text of a saved club pass
- **THEN** the pass shows the new text and whether the platform surfaces that change to the customer is recorded
