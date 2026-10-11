# Spec Delta

## Purpose

Definir la creación, programación y entrega de campañas promocionales y el registro de sus resultados, usando solo los canales validados.

## ADDED Requirements

### Requirement: Campaign creation
A manager SHALL be able to create a campaign with a message, an audience, a channel and a schedule.

#### Scenario: Draft campaign
- **WHEN** a manager saves a campaign
- **THEN** it is stored as a draft and nothing is sent

#### Scenario: Scheduled campaign
- **WHEN** a manager schedules a campaign
- **THEN** it is sent at the chosen time and its status changes to sending then completed

### Requirement: Validated channels only
The system SHALL offer only the channels whose behavior was confirmed on real devices, and MUST NOT promise a delivery the platform does not guarantee.

#### Scenario: Channel not validated
- **WHEN** a channel was not confirmed in the wallet findings
- **THEN** it is not selectable in the panel

### Requirement: Platform quotas
The system SHALL respect each platform quota and frequency limits and SHALL reject or defer sends that would exceed them.

#### Scenario: Quota reached
- **WHEN** a pass already received the maximum alerts of the period
- **THEN** the send for that pass is deferred or skipped and the reason is recorded

### Requirement: Delivery tracking
The system SHALL record the result of each delivery with status and error, and SHALL show totals per campaign.

#### Scenario: Partial failure
- **WHEN** some deliveries fail
- **THEN** the campaign shows sent and failed counts and the failed ones list their error

### Requirement: Alternative channel
If wallet alerts are not viable, the system SHALL support an opt-in alternative channel with the same audience rules.

#### Scenario: Email fallback
- **WHEN** a customer opted in to email
- **THEN** the campaign can reach that customer by email and the delivery is recorded
