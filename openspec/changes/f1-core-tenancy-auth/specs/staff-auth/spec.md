# Spec Delta

## Purpose

Definir cómo se autentican y autorizan los usuarios de staff de un comercio y cómo se audita lo que hacen.

## ADDED Requirements

### Requirement: Staff sign-in
The system SHALL authenticate staff users with email and password and issue a session that expires.

#### Scenario: Valid credentials
- **WHEN** a staff user submits correct credentials
- **THEN** a session is issued that identifies the user, the business and the role

#### Scenario: Invalid credentials
- **WHEN** credentials are wrong
- **THEN** the sign-in fails with a generic message and repeated failures are rate limited

#### Scenario: Password storage
- **WHEN** a password is stored
- **THEN** only a salted slow hash is persisted, never the password

### Requirement: Roles and permissions
The system SHALL assign each staff user a role among owner, manager and cashier, and SHALL authorize each action according to the role.

#### Scenario: Cashier limits
- **WHEN** a cashier tries to change program configuration
- **THEN** the action is denied

#### Scenario: Owner manages staff
- **WHEN** an owner creates or disables a staff user of the same business
- **THEN** the change is applied and recorded

### Requirement: Branch assignment
The system SHALL allow restricting a staff user to specific branches.

#### Scenario: Out-of-branch operation
- **WHEN** a staff user restricted to branch X attempts an operation for branch Y
- **THEN** the operation is denied

### Requirement: Audit log
The system SHALL record administrative actions with actor, business, action, target, result and timestamp, and the log MUST NOT be editable through the API.

#### Scenario: Action recorded
- **WHEN** a staff user is created, disabled or has its role changed
- **THEN** an audit entry is stored with the actor and the target

#### Scenario: Log is read only
- **WHEN** any client tries to modify or delete an audit entry
- **THEN** the system provides no such operation
