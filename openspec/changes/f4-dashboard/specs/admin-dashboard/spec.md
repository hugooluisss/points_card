# Spec Delta

## Purpose

Definir la pantalla de inicio del panel con indicadores clave y la actividad reciente del comercio.

## ADDED Requirements

### Requirement: KPI cards
The home screen SHALL show cards with registered customers, saved passes, operations of the period and redemptions of the period, each with its change against the previous period.

#### Scenario: Period change
- **WHEN** the user selects a period
- **THEN** every KPI is recalculated for that period and shows the variation against the previous one

#### Scenario: No data
- **WHEN** a business has no activity
- **THEN** the cards show zero and an empty-state message guides the first step

### Requirement: Activity chart
The home screen SHALL show a chart of operations per day for the selected period.

#### Scenario: Chart values
- **WHEN** the chart is displayed
- **THEN** each bar equals the operations of that day for the business, and values are available as text for accessibility

### Requirement: Recent activity
The home screen SHALL list the latest operations with customer, operation, amount and status.

#### Scenario: Latest operations
- **WHEN** new operations occur
- **THEN** the list shows the most recent first and limits its length

### Requirement: Scope by branch and role
The data SHALL respect the business and, for branch-restricted users, only their branches.

#### Scenario: Restricted manager
- **WHEN** a manager restricted to one branch opens the home
- **THEN** all figures include only that branch
