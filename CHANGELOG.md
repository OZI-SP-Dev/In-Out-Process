# Changelog

All notable changes to this project will be documented in this file.
Include any required SharePoint changes that will be needed to deploy you PR
Update the version number in package.json when submitting your PR

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),

## [Unreleased]

- (Keep your changes here until you have a release version)

## [2.0.0-alpha.1] - 2023-05-XX

### Added

- Initial addition of the Out Processing capability
- Out Processing Request Form fields added
  - Employee, Employee Type, Supervisor, SAR, Sensitivity Code, Last Day w/ Org, Est Out processing begin date, Local/Remote, Remote Location, Office, Has DTS/GTC, Out-processing Reason, Gaining Organization, Special clearance accesses (i.e., SCI, SAP, etc)?
- Checklist Items on Request View are now sortable by column header

### Changed

- Updated @fluentui/react-components to 9.20.1
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
