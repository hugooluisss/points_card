# Spec Delta

## Purpose

Definir los comercios, sus sucursales y el aislamiento de datos entre ellos, de modo que ningún comercio pueda leer ni modificar datos de otro.

## ADDED Requirements

### Requirement: Business registration
The system SHALL allow a new business to register with a name, owner credentials and contact data, creating the business with an initial plan and an active status.

#### Scenario: Successful registration
- **WHEN** a person submits valid business and owner data
- **THEN** the business is created with status active and the person becomes its owner

#### Scenario: Duplicate owner email
- **WHEN** the owner email is already registered
- **THEN** the registration is rejected with an error that does not reveal other account data

### Requirement: Branches
The system SHALL let a business manage one or more branches, and every business MUST have at least one branch.

#### Scenario: Default branch
- **WHEN** a business is created
- **THEN** a default branch is created for it

#### Scenario: Branch belongs to one business
- **WHEN** a branch is created
- **THEN** it is bound to exactly one business and cannot be moved to another

### Requirement: Tenant isolation
The system SHALL scope every read and write of business data to the business of the authenticated user, and MUST NOT return or modify data of another business.

#### Scenario: Cross-tenant read attempt
- **WHEN** a user of business A requests a resource that belongs to business B
- **THEN** the system responds as if the resource did not exist

#### Scenario: Cross-tenant write attempt
- **WHEN** a user of business A sends an update for a resource of business B
- **THEN** nothing is modified and the attempt is recorded in the audit log

### Requirement: Business status
The system SHALL support suspending a business, and a suspended business MUST NOT be able to operate cards or sign in staff.

#### Scenario: Suspended business
- **WHEN** a business is suspended
- **THEN** its staff cannot sign in and its operations are rejected until it is reactivated
