# Spec Delta

## Purpose

Definir cómo un comercio contrata y gestiona su suscripción mediante Stripe y cómo el estado de cobro se sincroniza de forma confiable con el sistema.

## ADDED Requirements

### Requirement: Subscription checkout
The system SHALL let the owner start a subscription through a Stripe-hosted checkout and SHALL NOT receive or store card data.

#### Scenario: Start subscription
- **WHEN** the owner chooses a plan
- **THEN** the owner is redirected to the Stripe checkout and returns to the panel afterwards

#### Scenario: Checkout abandoned
- **WHEN** the owner cancels the checkout
- **THEN** the business plan is unchanged

### Requirement: Billing portal
The owner SHALL be able to update the payment method, view invoices and cancel through the Stripe billing portal.

#### Scenario: Open portal
- **WHEN** the owner opens billing management
- **THEN** the owner is sent to the portal of that business customer only

### Requirement: Verified webhooks
The system SHALL accept Stripe events only with a valid signature and MUST process each event at most once.

#### Scenario: Invalid signature
- **WHEN** a webhook request has an invalid signature
- **THEN** it is rejected and nothing changes

#### Scenario: Duplicate event
- **WHEN** the same event is delivered twice
- **THEN** its effect is applied once

### Requirement: Subscription state
The system SHALL keep the business plan and billing state (trial, active, past due, canceled) aligned with Stripe events.

#### Scenario: Payment succeeds
- **WHEN** a payment succeeds
- **THEN** the business is active on the paid plan

#### Scenario: Payment fails
- **WHEN** a payment fails
- **THEN** the business becomes past due, the owner is notified in the panel and a grace period starts

#### Scenario: Grace period ends
- **WHEN** the grace period ends without payment
- **THEN** operations that create data are blocked while customer cards and balances stay readable

### Requirement: Cancellation
When a subscription is canceled the system SHALL keep data for a defined period and SHALL allow reactivation.

#### Scenario: Reactivation
- **WHEN** an owner resubscribes within the retention period
- **THEN** the business recovers access to its existing data
