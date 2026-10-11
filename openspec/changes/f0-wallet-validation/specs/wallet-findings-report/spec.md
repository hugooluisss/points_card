# Spec Delta

## Purpose

Definir el informe de hallazgos que cierra la fase F0 y que condiciona el inicio de F1: clasifica cada afirmación sobre Wallet, resume costos y requisitos, y emite una decisión explícita de continuar.

## ADDED Requirements

### Requirement: Classification of statements
The report SHALL label every statement about Wallet capabilities as a confirmed fact, an assumption or a hypothesis, and a confirmed fact MUST cite either official documentation or a recorded device test.

#### Scenario: Confirmed fact
- **WHEN** a statement is labeled as a confirmed fact
- **THEN** it references an official source with consultation date or an evidence file from a device test

#### Scenario: Unverified statement
- **WHEN** a statement has neither a source nor a test
- **THEN** it is labeled as an assumption or hypothesis

### Requirement: Viability traffic light
The report SHALL assign a viability level (green, yellow, red) to each capability required by the product: stamps, points, club, balance update, notifications and QR scanning by staff.

#### Scenario: Capability with viability
- **WHEN** the report is complete
- **THEN** every required capability has a level and a one-line justification

### Requirement: Pass type decision per mode
The report SHALL state the pass type to be used for stamps, points and club on each platform.

#### Scenario: Decision recorded
- **WHEN** the report is complete
- **THEN** each of the three modes lists the chosen pass type on Apple Wallet and on Google Wallet, or states that the mode is not viable there

### Requirement: Costs and account requirements
The report SHALL list the accounts, certificates, fees and review processes required to operate in production, and an estimated recurring cost per business and per card when the documentation allows it.

#### Scenario: Requirements listed
- **WHEN** the report is complete
- **THEN** it lists the Apple and Google accounts needed, their price, renewal period and approval steps

#### Scenario: Cost unknown
- **WHEN** a cost cannot be determined from documentation
- **THEN** it is marked as unknown and the way to obtain it is stated

### Requirement: Go decision for the next phase
The report SHALL end with an explicit decision for F1 (go, go with changes or stop) based on pass issuance and update results, and SHALL record separately the decision on notification-dependent scope (F6) once the notification validation is complete.

#### Scenario: Go with changes
- **WHEN** a pass capability is red or yellow
- **THEN** the decision names the product change (removed promise, plan B, platform priority) that F1 must reflect

#### Scenario: Notifications not yet validated
- **WHEN** the F1 decision is recorded and the notification validation is still pending
- **THEN** the report states that notification-dependent scope is unverified and that it only blocks F6

#### Scenario: Report delivered
- **WHEN** the phase is closed
- **THEN** the report exists as a document in the repository and the user has recorded the decision
