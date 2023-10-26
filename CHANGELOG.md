# Changelog

All notable changes to this project will be documented in this file.
Include any required SharePoint changes that will be needed to deploy you PR
Update the version number in package.json when submitting your PR

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]

- (Keep your changes here until you have a release version)

### Changed

- Removal of DD2875 process from In Processing
- Added Job/Duty Title to In Processing
- Added Duty Phone # to In Processing

## [2.0.4] - 2023-09-28

### Changed

- Additional columns SupGovLead and Created added to Summary View report

- Add missing SupGovLead to the Out Processing Request View

### Fixed

- Bug where WHAT task for CTR didn't activate due to missing prerequisite task


## [2.0.3] - 2023-09-07

### Added

- New capability for required SSN input for In Processing

### Fixed

- vitest taking too long to run by switching to fireEvent instead of userEvent for FluentUI Combobox

- bad typing in handler to use IRequest

## [2.0.2] - 2023-08-17

### Changed

- Add backend SharePoint groups for roles that users are added/removed from besides just the Roles list

### Fixed

- Mock for deletion of Role entry to actually delete the Role entry

## [2.0.1] - 2023-08-15

### Changed

- No longer require CTR to have signed telework agreement task

## [2.0.0] - 2023-08-07 - MVCR Release of Out Processing

### Added

- Initial addition of the Out Processing capability
- Out Processing Request Form fields added
  - Employee, Employee Type, Supervisor, SAR, Sensitivity Code, Last Day w/ Org, Est Out processing begin date, Local/Remote, Remote Location, Office, Has DTS/GTC, Out-processing Reason, Gaining Organization, Special clearance accesses (i.e., SCI, SAP, etc)?
- Checklist Items on Request View are now sortable by column header
- Summary View Report - Report that shows Active, Cancelled, and Completed Requests
- Ability to add Alternate Email to a user, enables sending messages to Org box

### Changed

- Updated @fluentui/react-components to 9.20.1
- Updated vite from 4.2.1 to 4.2.3
- Update components to use v9 version (or replacement)
  - Dialog
  - CommandBar - replaced with just Buttons per Best Practice to not use Toolbar unless 3+ buttons
  - Toggle - replaced with Switch
  - Dropdown
  - Stack - Removed and replaced with general CSS flexbox
  - DetailList (partial upgrade -- still some remaining that use grouping) - Replaced with DataGrid
  - Removed the "Item" column from CheckListItem display
  - Removed the "Status" column from the My Requests
- Updated MyRequests component on homepage to display 2 separate areas for In-processing and Out-processing, and updated what data is shown from each request
- No longer CC supervisor when tasks become active
- User can no longer input request for themself
- Updated links for DD2875s and description in task
- People Picker now extends entire width of name

### Fixed

- Removed unused styles
- Removed form required warnings when values autoset based on another value

## [1.1.0] - 2023-04-12

### Changed

- Migrated from Create React App (CRA) to Vite

### Removed

- reportWebVitals

## [1.0.0] - 2023-04-06

### Added

- Initial release of the In/Out Processing Tool
- Features include abiity to In Process users within XP-OZ

### Types of changes

- Added for new features.
- Changed for changes in existing functionality.
- Deprecated for soon-to-be removed features.
- Removed for now removed features.
- Fixed for any bug fixes.
- Security in case of vulnerabilities.
