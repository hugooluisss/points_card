# Spec Delta

## Purpose

Definir el armazón visual del panel web (acceso, navegación y diseño base) sobre el que las demás fases agregan pantallas.

## ADDED Requirements

### Requirement: Screens designed before built
Each screen SHALL have a mockup reviewed by the user before it is implemented in Angular, and the screen inventory MUST be documented.

#### Scenario: Inventory exists
- **WHEN** F1 UI work starts
- **THEN** a screen inventory lists login, registration, shell layout and home

#### Scenario: Mockup approved
- **WHEN** a screen is about to be implemented
- **THEN** its mockup has been approved by the user

### Requirement: Layout and navigation
The panel SHALL present a left sidebar with grouped menu entries and count badges, a header with the user menu and a content area, following the project visual reference.

#### Scenario: Navigation by role
- **WHEN** a user signs in
- **THEN** the sidebar shows only the entries the role may access

#### Scenario: Responsive layout
- **WHEN** the viewport is the width of a phone
- **THEN** the sidebar collapses into a menu and content stays readable without horizontal scroll

### Requirement: Access screens
The panel SHALL provide sign-in, business registration and sign-out screens that show clear validation and error messages in Spanish.

#### Scenario: Validation feedback
- **WHEN** a form is submitted with invalid data
- **THEN** each invalid field shows a message and no request is sent

#### Scenario: Unauthorized route
- **WHEN** a signed-out user opens a protected route
- **THEN** the user is redirected to sign-in

### Requirement: Accessibility basics
Interactive elements SHALL be reachable by keyboard and text MUST keep sufficient contrast.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates the sidebar and forms with the keyboard
- **THEN** every control can be focused and activated and the focus is visible
