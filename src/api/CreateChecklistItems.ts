import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleType } from "api/RolesApi";
import { ICheckListItem } from "./CheckListItemApi";

enum templates {
  WelcomePackage = 1,
  IA_Training = 2,
  ObtainCACGov = 3,
  ObtainCACCtr = 4,
  InstallationInProcess = 5,
  GTC = 6,
  DTS = 7,
  ATAAPS = 8,
  VerifyMyLearn = 9,
  VerifyMyETMS = 10,
  MandatoryTraining = 11,
  PhoneSetup = 12,
  OrientationVideos = 13,
  Bookmarks = 14,
  NewcomerBrief = 15,
  SupervisorTraining = 16,
  ConfirmMandatoryTraining = 17,
  ConfirmMyLearn = 18,
  ConfirmMyETMS = 19,
  UnitOrientation = 20,
  Brief971Folder = 21,
  SignedPerformContribPlan = 22,
  SignedTeleworkAgreement = 23,
  TeleworkAddedToWHAT = 24,
  SupervisorCoord2875 = 25,
  SecurityCoord2875 = 26,
  ProvisionAFNET = 27,
  EquipmentIssue = 28,
  AddSecurityGroups = 29,
  BuildingAccess = 30,
  VerifyDirectDeposit = 31,
  VerifyTaxStatus = 32,
  SecurityTraining = 33,
  ConfirmSecurityTraining = 34,
  SecurityRequirements = 35,
  InitiateTASS = 36,
  CoordinateTASS = 37,
  SignedNDA = 38,
  SCIBilletNomination = 39,
  CoordGTCApplUpdate = 40,
}

// Active is a derived prop based on if there are Prereqs or not
// RequestId will be added when the template is used to create an item
// Id is not needed b/c SharePoint will assign one
// We add Prereqs as a required entry containing the Prequiste TemplateId(s)
type ICheckListItemTemplate = Omit<
  ICheckListItem,
  "Id" | "RequestId" | "Active"
> & {
  Prereqs: templates[];
};

/** The list of tasks and their prerequisite tasks */
export const checklistTemplates: ICheckListItemTemplate[] = [
  {
    Title: "Send Welcome Package/Reference Guide",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.WelcomePackage,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Reference%20Guide.docx">Send Welcome Package/Reference Guide</a></p>`,
    Prereqs: [],
  },
  {
    Title: "IA Training Complete",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.IA_Training,
    Description: `<div><p style="margin-top: 0px">Information Assurance (IA) Training is an annual requirement. It is accomplished by completing the Cyber Awareness Challenge. It is mandatory that each employee be current in this training. Below are links to both a public (non-CAC) method for obtaining IA Training as well as myLearning for those with CACs. <b>Supervisors should provide non-CAC new employees with appropriate public website (item #1 below) so employee may complete training prior to installation in-processing.</b> If you have previously taken IA Training as a government employee and would like to check your training currency, go to Air Force myLearning below and view your training transcript.</p> 
<p>1) No CAC - <a href="https://public.cyber.mil/training/cyber-awareness-challenge/">https://public.cyber.mil/training/cyber-awareness-challenge/</a><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Upon completing the Cyber Awareness Challenge, download the completion certificate as a PDF, and send it to your supervisor and to the AFLCMC/OZI Enterprise Tech Team &lt;<a href="mailto:AFLCMC.OZI.EnterpriseTechTeam@us.af.mil">AFLCMC.OZI.EnterpriseTechTeam@us.af.mil</a>&gt;</p> 
<p>2) CAC - Air Force myLearning (<a href="https://lms-jets.cce.af.mil/moodle/">https://lms-jets.cce.af.mil/moodle/</a>)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Once within the website, click on the Total Force Awareness Training Button, then scroll down to the Cyber Awareness Challenge and select the training.</p>
</div>`,
    Prereqs: [],
  },
  {
    Title: "Obtain CAC (Mil/Civ)",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.ObtainCACGov,
    Description: `<div><p style="margin-top: 0px"><b>Initial CAC for brand new employees</b><br/>
For brand new employees who have not yet obtained their CAC, please see 'Installation In-processing' as this task will address enrollment in the Defense Enrollment Eligibility Reporting System (DEERS) and provide guidance for scheduling a CAC appointment.</p>
<p><b>Replacement CAC</b><br/>
To schedule your CAC appointment see the following announcement:</p>
<p>The 88 Force Support ID Card Section is transitioning from RAPIDS to Setmore for scheduling ID card appointments. This includes all CAC, Retiree, Dependents, and DAV customers.<br/><br/>
Transition Timeframe: <br/>
-Beginning Nov 1, 2022, 60 day out appointments (Jan 1, 2023 and beyond) will be released on Setmore.<br />
-Weekly appointments will continue to be released on RAPIDS until Dec 27, 2022, from which all appointments will need to be booked on Setmore</p>
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
    Prereqs: [templates.InstallationInProcess],
  },
  {
    Title: "Obtain/Transfer CAC (Ctr)",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.ObtainCACCtr,
    Description: `<div><p style="margin-top: 0px"><b><u>CAC Transfer</u></b><br/>This applies to contractors who meet the following conditions:
<ol><li>Possess a CAC issued under a DoD contract</li><li>Changing contracts away from the one which authorized and is associated with the CAC</li><li>Remaining in the employment of the same contractor through whom the CAC was issued</li></ol></p>
<p>If you have current CAC issued under a government contract that you are changing and yet remaining with the same contractor, you may not be required to obtain a new CAC but may transfer the one you have. However, this requires working with your security office to coordinate the updating of your CAC to the appropriate contract.</p>
<p><b><u>Obtain New or Replacement CAC</u></b><br/>To schedule your CAC appointment see the following announcement:</p>
<p>The 88 Force Support ID Card Section is transitioning from RAPIDS to Setmore for scheduling ID card appointments. This includes all CAC, Retiree, Dependents, and DAV customers.<br/><br/>
Transition Timeframe: <br/>
-Beginning Nov 1, 2022, 60 day out appointments (Jan 1, 2023 and beyond) will be released on Setmore.<br />
-Weekly appointments will continue to be released on RAPIDS until Dec 27, 2022, from which all appointments will need to be booked on Setmore</p>
<p>Customers can continue to self-book services online 24/7 via our website, <a href="https://www.wrightpattfss.com/military-personnel">https://www.wrightpattfss.com/military-personnel</a>; or
customers can access Setmore/RAPIDS sites directly at the following links:<br/>
Setmore: <a href="https://88fss.setmore.com/88fss">https://88fss.setmore.com/88fss</a><br/>
RAPIDS website: <a href="https://idco.dmdc.os.mil/idco/">https://idco.dmdc.os.mil/idco/</a><br/></p></div>`,
    Prereqs: [templates.CoordinateTASS],
  },
  {
    Title: "Attend Installation In-processing",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.InstallationInProcess,
    Description: `<div><p style="margin-top: 0px">Did you attend the 88FSS installation in-processing? </p></div>`,
    Prereqs: [],
  },
  {
    Title: "Confirm travel card action (activate/transfer) complete",
    Lead: RoleType.GTC,
    TemplateId: templates.GTC,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.CoordGTCApplUpdate],
  },
  {
    Title: "Profile created/re-assigned in DTS",
    Lead: RoleType.DTS,
    TemplateId: templates.DTS,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.GTC],
  },
  {
    Title: "Create/Update ATAAPS account",
    Lead: RoleType.ATAAPS,
    TemplateId: templates.ATAAPS,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Verify Air Force myLearning account",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.VerifyMyLearn,
    Description: `<div><p style="margin-top: 0px">As part of in-processing, all employees are to verify or register for an Air Force myLearning training account. This account is necessary for the completion of mandatory training requirements.</p>
<p><a href="https://lms-jets.cce.af.mil/moodle/">Air Force MyLearning</a></p></div>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Verify AFMC myETMS account",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.VerifyMyETMS,
    Description: `<div><p style="margin-top: 0px">Click here for link to myETMS: <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">Air Force Materiel Command's myEducation and Training Management System</a></p></div>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Complete mandatory training",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.MandatoryTraining,
    Description: `<p style="margin-top: 0px">For a list of mandatory training requirements, please find the document titled "Mandatory Training" at the following link: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/Mandatory%20Training.docx">Mandatory Training.docx</a></p>`,
    Prereqs: [templates.VerifyMyETMS, templates.VerifyMyLearn],
  },
  {
    Title: "Set up phone system",
    Lead: RoleType.EMPLOYEE,

    TemplateId: templates.PhoneSetup,
    Description: `<p style="margin-top: 0px">See the following link for phone set up instructions: <a href="https://www.tsf.wpafb.af.mil/Doc/Getting%20Started%20with%20the%20UC%20Client.pdf">Getting started with the UC Client</a></p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "View orientation videos",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.OrientationVideos,
    Description: `<p style="margin-top: 0px">The orientation videos may be found within the following document: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Bookmark key SharePoint / Website URLs",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.Bookmarks,
    Description: `<p style="margin-top: 0px">Bookmark the links located in the document located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Review directorate newcomer brief",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.NewcomerBrief,
    Description: `<p style="margin-top: 0px">Review directorate newcomer brief located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/AFLCMC%20-%20XP-OZ%20Overview.pptx">AFLCMC - XP-OZ Overview.pptx</a></p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Complete supervisor training",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.SupervisorTraining,
    Description: `<div><p style="margin-top: 0px">Please look for Air University to provide guidance (online training link) for the completion of all appropriate supervisor training requirements.</p></div>`,
    Prereqs: [],
  },
  {
    Title: "Confirm mandatory training complete",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.ConfirmMandatoryTraining,
    Description: `<div><p style="margin-top: 0px">None</p></div>`,
    Prereqs: [templates.MandatoryTraining],
  },
  {
    Title: "Confirm Air Force myLearning account",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.ConfirmMyLearn,
    Description: `<div><p style="margin-top: 0px">Click here for link to Air Force myLearning account: <a href="https://lms-jets.cce.af.mil/moodle/">Air Force MyLearning</a></p></div>`,
    Prereqs: [templates.VerifyMyLearn],
  },
  {
    Title: "Confirm AFMC myETMS account",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.ConfirmMyETMS,
    Description: `<div><p style="margin-top: 0px">Click here for link to myETMS: <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">Air Force Materiel Command's myEducation and Training Management System</a></p></div>`,
    Prereqs: [templates.VerifyMyETMS],
  },
  {
    Title: "Unit orientation conducted",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.UnitOrientation,
    Description: `<p style="margin-top: 0px">Please ensure employee are briefed in the following key areas:
<ul>
<li>Explain the unit Chain of Command</li>
<li>Explain the role of the CSF and OSF, if applicable (ref: AFMCI 36-2645)</li>
<li>Explain the unit mission and how it fits into the Center’s mission</li>
<li>Explain your role and responsibilities and expectations within the unit.</li>
<li>Discuss staff meeting schedules, unit organization activities and social opportunities</li>
<li>Introductions and tour of office</li>
<li>Introduce new employee to co-workers</li>
<li>Introduce to other key personnel/POCs in org (i.e., training manager, GTC POC, DTS POC, safety manager)</li>
<li>If new employee is a supervisor, introduce him/her to direct reports</li>
<li>Tour of work area, restrooms, break areas, conference rooms, points of interest on base</li>
<li>Discuss organizational chart and key personnel in the unit (e.g., Commander/Director, Unit Training Monitor, Personnel Liaison, Security Manager, DTS/GPC representative, Safety Representative, Admin POC)</li>
<li>Obtain recall roster information</li>
<li>Discuss welcome package / reference guide</li>
</ul></p>`,
    Prereqs: [],
  },
  {
    Title: "Create & brief 971 folder",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.Brief971Folder,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [],
  },
  {
    Title: "Signed performance/contribution plan",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.SignedPerformContribPlan,
    Description: `<p style="margin-top: 0px">Provide the new employee with a copy of applicable position documents (e.g., Position Description, Core Doc, Performance/Contribution Plan, Position Requirements Document)</p>
<p>Reminder: Performance plans must be completed within 60 days of assignment</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Signed telework agreement",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.SignedTeleworkAgreement,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/Telework%20Agreement%20Form%20dd2946.pdf">Telework Agreement Form DD2946</a></p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Telework status entered in WHAT",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.TeleworkAddedToWHAT,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/teams/10251/WHAT">Workforce Hybrid Analysis Tool (WHAT)</a></p>`,
    Prereqs: [templates.SignedTeleworkAgreement],
  },
  {
    Title: "Supervisor Coordination of 2875",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.SupervisorCoord2875,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Security Coordination of 2875",
    Lead: RoleType.SECURITY,
    TemplateId: templates.SecurityCoord2875,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.SupervisorCoord2875],
  },
  {
    Title: "Provision/move AFNET account",
    Lead: RoleType.IT,
    TemplateId: templates.ProvisionAFNET,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.SecurityCoord2875],
  },
  {
    Title: "Equipment Issue",
    Lead: RoleType.IT,
    TemplateId: templates.EquipmentIssue,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.SecurityCoord2875],
  },
  {
    Title: "Add to security groups",
    Lead: RoleType.IT,
    TemplateId: templates.AddSecurityGroups,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ProvisionAFNET],
  },
  {
    Title: "Obtain building access",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.BuildingAccess,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Verify direct deposit active",
    Lead: RoleType.ATAAPS,
    TemplateId: templates.VerifyDirectDeposit,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Verify tax status accurate",
    Lead: RoleType.ATAAPS,
    TemplateId: templates.VerifyTaxStatus,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Complete security training",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.SecurityTraining,
    Description: `<p style="margin-top: 0px">Review the Mandatory initial training slides and ensure you complete the survey at the end to receive credit</p>
    <p>The slides can be found at <a href="https://usaf.dps.mil/:p:/r/teams/AFLCMCCSO/_layouts/15/Doc.aspx?sourcedoc=%7BC6E442DB-B72B-4AB6-9B80-1613F4281F48%7D&file=Initial%20CSO%20Training.pptx&action=edit&mobileredirect=true">https://usaf.dps.mil/:p:/r/teams/AFLCMCCSO/_layouts/15/Doc.aspx?sourcedoc=%7BC6E442DB-B72B-4AB6-9B80-1613F4281F48%7D&file=Initial%20CSO%20Training.pptx&action=edit&mobileredirect=true</p>`,
    Prereqs: [templates.ProvisionAFNET],
  },
  {
    Title: "Confirm security training complete",
    Lead: RoleType.SECURITY,
    TemplateId: templates.ConfirmSecurityTraining,
    Description: `<p style="margin-top: 0px">Confirm member has taken required initial security training by reviewing survey results </p>`,
    Prereqs: [templates.SecurityTraining],
  },
  {
    Title: "Security requirements & access",
    Lead: RoleType.SECURITY,
    TemplateId: templates.SecurityRequirements,
    Description: `<p style="margin-top: 0px">Review the members, Security Access Requirement (SAR) Code, Position Sensitivity Code, and Clearance Eligibility and update appropriate access level</p>
      <p>Establish a servicing or owning relationship with the member in the Defense Information System for Security (DISS)</p>`,
    Prereqs: [templates.ObtainCACCtr, templates.ObtainCACGov],
  },
  {
    Title: "Initiate Trusted Associate Sponsorship System (TASS Form 1)",
    Lead: RoleType.SUPERVISOR,
    TemplateId: templates.InitiateTASS,
    Description: `<p style="margin-top: 0px">You can obtain a blank TASS document here:  <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/Blank%20TASS%20Form1.pdf">Blank TASS Form1.pdf</a></p>
<p>For coordination with the Security office, send the TASS Form 1 to <a href="mailto:AFLCMC.Cnsldtd.Security_Office@us.af.mil">AFLCMC.Cnsldtd.Security_Office@us.af.mil</a></p>
<p><b>TASS Form 1 coordination instructions:</b>
<ol><li>Applicant coordinates with Government Sponsor, COR or TA for sponsorship. Applicant completes and submits the request form to the appropriate Employment Representative, Government Sponsor, or COR. To allow for maximum use of digital signatures, request should be initiated/completed using a computer that utilizes ADOBE Acrobat reader/software.</li>
<li>Employment Representative, Government Sponsor, COR, submits the request to the Security Manager for NACI Background check. The Security Manager digitally signs and dates the form.</li>
<li>The Security Manager returns the form to the Employment Representative, Government Sponsor, COR for submission to the TA for TASS entry and CAC approval.</li>
<li>TA verifies proper vetting of applicant as outlined in current DoDI 5200.46 and DoDM 1000.13. TA signs and dates the request.</li>
<li>Applicant visits servicing DEERS/RAPIDs Office for CAC issuance.</li></ol></p>`,
    Prereqs: [],
  },
  {
    Title: "Coordinate Trusted Associate Sponsorship System (TASS Form 1)",
    Lead: RoleType.SECURITY,
    TemplateId: templates.CoordinateTASS,
    Description: `<p style="margin-top: 0px">None</p>`,
    Prereqs: [templates.InitiateTASS],
  },
  {
    Title: "Signed Non-Disclosure Agreement (SF312)",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.SignedNDA,
    Description: `<p style="margin-top: 0px">If you are brand new to the government, or had a two-year break in service, schedule a time with your supervisor to sign an NDA (SF312) (link below) Download the form in order to obtain a fillable copy. Once signed, return the SF312 to the Consolidated Security Office workflow at <a href="mailto:AFLCMC.Cnsldtd.Security_Office@us.af.mil">AFLCMC.Cnsldtd.Security_Office@us.af.mil</a></p>
<p><a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/SF312-NDA.pdf">SF312.NDA.pdf</a></p>`,
    Prereqs: [templates.ObtainCACGov],
  },
  {
    Title: "SCI Billet Nomination",
    Lead: RoleType.SECURITY,
    TemplateId: templates.SCIBilletNomination,
    Description: `<p style="margin-top: 0px">Verify member's Security Access.  Requirement (SAR) Code is a 5 and their Position Sensitivity is a 4 - Special Sensitive</p>
<p>If verified, initiate the billet nomination process and work with the respective Special Security Office to have the member indoc'd </p>`,
    Prereqs: [],
  },
  {
    Title: "Coordinate travel card application/update",
    Lead: RoleType.EMPLOYEE,
    TemplateId: templates.CoordGTCApplUpdate,
    Description: `<p style="margin-top: 0px"><b><u>For Civilian and Military who have an existing Government Travel Card (GTC)</u></b></p>
<p>Provide your Agency/Organization Program Coordinator (AOPC) with the following information/documentation:</p>
<ul><li>Travel card account number</li>
<li>Statement of Understanding</li>
<ul><li>Must be less than three years old or you should complete a new one (see link below)</li></ul>
<li>GTC Training Cert (less than three years old)</li>
<ul><li>Must be less than three years old or you should complete a new one (see link below)</li></ul>
</ul>
<p><b><u>Civilian or Military with no existing Government Travel Card (GTC) - Need new account</u></b></p>
<ol><li>Does member need a standard or restricted card?</li>
<ol type="a"><li>There are two types of IBAs, Standard and Restricted. Standard cards are issued to individuals with a FICO credit score above 659. The default limits are $7,500 for credit, $250 for cash, and $250 for retail purchases. Restricted cards are issued to individuals with a FICO credit score below 660 or those who do not want their credit pulled (i.e. in the process of buying a house)</li></ol>
<li>Member completes training and Statement of Understanding (signed by member's supervisor)</li>
<li>Send training cert, SOU, and type of card desired to <a href="mailto:aflcmc.xp1@us.af.mil">aflcmc.xp1@us.af.mil</a></li></ol>
<p><b><u>INSTRUCTIONS TO COMPLETE GTC TRAINING AND STATEMENT OF UNDERSTANDING (SOU):</u></b></p>
<p><a href="https://usaf.dps.mil//sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/Government%20Travel%20Card%20(GTC)/INSTRUCTIONS%20TO%20COMPLETE%20GTC%20TRAINING%20AND%20STATEMENT%20OF%20UNDERSTANDING%20(SOU).docx">Click here</a> to access the instructions</p>
<p>The following outlines the steps in the card application process:</p>
<ol><li>Member sends training cert, SOU, and type of card desired to <a href="mailto:aflcmc.xp1@us.af.mil">aflcmc.xp1@us.af.mil</a></li>
<li>Unit AOPC initiates application</li><li>Member completes application</li><li>Supervisor approves application</li><li>Unit AOPC approves application</li><li>Citibank processes application</li><li>Card arrives via mail approx. 2 weeks</li><li>Activate Card</li><li>Report to AOPC card has been received and activated</li></ol>
</p>`,
    Prereqs: [templates.ObtainCACGov],
  },
];

const createInboundChecklistItems = (request: IInRequest) => {
  const [batchedSP, execute] = spWebContext.batched();
  const checklistItems = batchedSP.web.lists.getByTitle("CheckListItems");

  /**
   * Function to call the PnPJS function to create the item
   * @param templateId The ID of the template to use for creating the Checklist Item
   */
  const addChecklistItem = (templateId: templates) => {
    const itemTemplate = checklistTemplates.find(
      (item2) => item2.TemplateId === templateId
    );
    if (itemTemplate) {
      checklistItems.items.add({
        Title: itemTemplate.Title,
        Lead: itemTemplate.Lead,
        RequestId: request.Id,
        TemplateId: itemTemplate.TemplateId,
        Active:
          // Special case for ObtainCacGov where we set to true if they are not a new Civ/Mil as then there is no prereq
          itemTemplate.TemplateId === templates.ObtainCACGov &&
          request.isNewCivMil === "no"
            ? true
            : itemTemplate.Prereqs.length === 0,
        Description: itemTemplate.Description,
      } as ICheckListItem);
    }
  };

  // Welcome Package -- required for all inbounds
  addChecklistItem(templates.WelcomePackage);

  // SCI Billet Nomination - Only if SAR = 5 and sensitivityCode = 4 (Special Sensitive)
  if (request.SAR === 5 && request.sensitivityCode === 4)
    addChecklistItem(templates.SCIBilletNomination);

  // IA Training -- Required for all inbounds
  addChecklistItem(templates.IA_Training);

  // Installation In Processing (required for new Mil/Civ)
  if (request.isNewCivMil === "yes") {
    addChecklistItem(templates.InstallationInProcess);
  }

  // Initiate and Coordinate Trusted Associate Sponsorship System (TASS Form 1) tasks -- CTR Only
  if (request.empType === EMPTYPES.Contractor) {
    addChecklistItem(templates.InitiateTASS);
    addChecklistItem(templates.CoordinateTASS);
  }

  // Obtain/Transfer CAC (Mil/Civ)
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    addChecklistItem(templates.ObtainCACGov);
  }

  // Obtain/Transfer CAC (Ctr)
  if (request.empType === EMPTYPES.Contractor) {
    addChecklistItem(templates.ObtainCACCtr);
  }

  // Obtain building access -- Required for all inbounds
  addChecklistItem(templates.BuildingAccess);

  // Supervisor Coordination of 2875 -- Required for all inbounds
  addChecklistItem(templates.SupervisorCoord2875);

  // Security Coordination of 2875 -- Required for all inbounds
  addChecklistItem(templates.SecurityCoord2875);

  // Provision/move AFNET account -- Required for all inbounds
  addChecklistItem(templates.ProvisionAFNET);

  // Equipment Issue -- Required for all inbounds
  addChecklistItem(templates.EquipmentIssue);

  // Add to security groups -- Required for all inbounds
  addChecklistItem(templates.AddSecurityGroups);

  // Signed Non-Disclosure Agreement (SF312) - Civ/Mil Only
  addChecklistItem(templates.SignedNDA);

  // Complete security training
  addChecklistItem(templates.SecurityTraining);

  // Confirm security training complete
  addChecklistItem(templates.ConfirmSecurityTraining);

  // Verify Air Force myLearning account
  addChecklistItem(templates.VerifyMyLearn);

  // Confirm Air Force myLearning account
  addChecklistItem(templates.ConfirmMyLearn);

  // Verify AFMC myETMS account - CIV/MIL only
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    addChecklistItem(templates.VerifyMyETMS);
  }

  // Confirm AFMC myETMS account - CIV/MIL Only
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    addChecklistItem(templates.ConfirmMyETMS);
  }

  // Mandatory training (all employees)
  addChecklistItem(templates.MandatoryTraining);

  // Confirm Mandatory training (all employees)
  addChecklistItem(templates.ConfirmMandatoryTraining);

  // Supervisor training (Supervisory positions only)
  if (request.isSupervisor === "yes") {
    addChecklistItem(templates.SupervisorTraining);
  }

  // Set up phone system (all Employees) -- requires user to have CAC first
  addChecklistItem(templates.PhoneSetup);

  // Watch Orientation Videos (all Employees) -- requires user to have CAC first
  addChecklistItem(templates.OrientationVideos);

  // Bookmark SharePoint/Websites (all Employees) -- requires user to have CAC first
  addChecklistItem(templates.Bookmarks);

  // Newcomer Breifing (all Employees) -- requires user to have CAC first
  addChecklistItem(templates.NewcomerBrief);

  // Unit orientation conducted (all Employees)
  addChecklistItem(templates.UnitOrientation);

  // Create & brief 971 folder
  addChecklistItem(templates.Brief971Folder);

  // Signed performance/contribution plan
  addChecklistItem(templates.SignedPerformContribPlan);

  // Signed telework agreement
  addChecklistItem(templates.SignedTeleworkAgreement);

  // Telework status entered in WHAT
  addChecklistItem(templates.TeleworkAddedToWHAT);

  // Create/Update ATAAPS account - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    addChecklistItem(templates.ATAAPS);
  }

  // Verify direct deposit active - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    addChecklistItem(templates.VerifyDirectDeposit);
  }

  // Verify tax status accurate - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    addChecklistItem(templates.VerifyTaxStatus);
  }

  // Security requirements & access
  addChecklistItem(templates.SecurityRequirements);

  // Add the tasks related to travel -- CIV/MIL with Travel required
  if (
    request.isTraveler === "yes" &&
    (request.empType === EMPTYPES.Civilian ||
      request.empType === EMPTYPES.Military)
  ) {
    addChecklistItem(templates.CoordGTCApplUpdate);
    addChecklistItem(templates.GTC);
    addChecklistItem(templates.DTS);
  }

  return execute();
};

export const useAddTasks = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ["checklist"],
    (newRequest: IInRequest) => {
      return createInboundChecklistItems(newRequest);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};
