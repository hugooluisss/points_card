# Spec Delta

## Purpose

Establecer cómo se verifica, en dispositivo real, qué avisos o notificaciones admite cada Wallet, y qué plan B se adopta para el Club de clientes si no son viables.

## ADDED Requirements

### Requirement: Deferred execution
The notification validation SHALL run after pass issuance and update have been validated on real devices, and it MUST NOT block the F1 decision.

#### Scenario: Pass validation completed first
- **WHEN** the notification validation is about to start
- **THEN** the pass issuance and update results for both platforms are already recorded

#### Scenario: Notification validation pending
- **WHEN** F1 is decided and notification validation has not run
- **THEN** F1 may start and notification results are required only before F6

### Requirement: Real-device notification test
For each platform, the validation SHALL attempt every notification or alert mechanism found in the official documentation and SHALL record the exact outcome observed on a physical device.

#### Scenario: Mechanism produces a visible alert
- **WHEN** a mechanism is triggered from the backend on a saved pass
- **THEN** the record states whether an alert appeared on the lock screen, the notification shelf or only inside the pass, with a screenshot and the delay

#### Scenario: Mechanism produces no alert
- **WHEN** a mechanism is triggered and no alert is observed
- **THEN** the record states that no alert was observed, the conditions tried, and the documented reason if one exists

### Requirement: Documented constraints
The validation SHALL record, with source and consultation date, the constraints that the official documentation imposes on each mechanism: eligibility, quotas, frequency, pass types, countries and required approvals.

#### Scenario: Constraint with source
- **WHEN** a constraint is added to the report
- **THEN** it includes the official URL and the date it was consulted

#### Scenario: Constraint not found in documentation
- **WHEN** a constraint cannot be confirmed in official documentation
- **THEN** it is labeled as an assumption and is not used as a basis for decisions

### Requirement: Notification consent boundary
The validation SHALL describe which messages sent through a Wallet are promotional and MUST treat them as requiring the customer's marketing consent, separate from the consent needed to operate the card.

#### Scenario: Promotional message classification
- **WHEN** a tested message advertises an offer
- **THEN** it is classified as promotional and the report states that it needs separate opt-in

### Requirement: Fallback for the club mode
If no promotional alert is viable on a platform, the validation SHALL define what the club mode still delivers on that platform and SHALL propose at least one alternative channel that is opt-in.

#### Scenario: Notifications not viable
- **WHEN** neither platform produces a reliable promotional alert
- **THEN** the report lists the value that the club mode keeps (identity and updated information) and the alternative channel proposed

#### Scenario: Notifications viable on one platform
- **WHEN** only one platform produces a reliable alert
- **THEN** the report states the limitation per platform so that the product does not promise an equal experience
