import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleType } from "api/RolesApi";
import { ICheckListItem } from "./CheckListItemApi";

export enum templates {
  WelcomePackage = 1,
  IA_Training = 2,
  ObtainCACGov = 3,
  ObtainCACCtr = 4,
  InstallationInProcess = 5,
  GTC = 6, // TODO
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
}

const createInboundChecklistItems = (request: IInRequest) => {
  const [batchedSP, execute] = spWebContext.batched();

  const checklistItems = batchedSP.web.lists.getByTitle("CheckListItems");

  // Welcome Package -- required for all inbounds
  checklistItems.items.add({
    Title: "Send Welcome Package/Reference Guide",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.WelcomePackage,
    Active: true,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Reference%20Guide.docx">Send Welcome Package/Reference Guide</a></p>`,
  } as ICheckListItem);

  // IA Training -- Required for all inbounds
  checklistItems.items.add({
    Title: "IA Training Complete",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.IA_Training,
    Active: true,
    Description: `<div><p style="margin-top: 0px">Information Assurance (IA) Training is an annual requirement. It is accomplished by completing the Cyber Awareness Challenge. It is mandatory that each employee be current in this training. Below are links to both a public (non-CAC) method for obtaining IA Training as well as myLearning for those with CACs. <b>Supervisors should provide non-CAC new employees with appropriate public website (item #1 below) so employee may complete training prior to installation in-processing.</b> If you have previously taken IA Training as a government employee and would like to check your training currency, go to Air Force myLearning below and view your training transcript.</p> 
<p>1) No CAC - <a href="https://public.cyber.mil/training/cyber-awareness-challenge/">https://public.cyber.mil/training/cyber-awareness-challenge/</a><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Upon completing the Cyber Awareness Challenge, download the completion certificate as a PDF, and send it to your supervisor and to the AFLCMC/OZI Enterprise Tech Team &lt;<a href="mailto:AFLCMC.OZI.EnterpriseTechTeam@us.af.mil">AFLCMC.OZI.EnterpriseTechTeam@us.af.mil</a>&gt;</p> 
<p>2) CAC - Air Force myLearning (<a href="https://lms-jets.cce.af.mil/moodle/">https://lms-jets.cce.af.mil/moodle/</a>)<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Once within the website, click on the Total Force Awareness Training Button, then scroll down to the Cyber Awareness Challenge and select the training.</p>
</div>`,
  } as ICheckListItem);

  // Installation In Processing (required for new Mil/Civ)
  if (request.isNewCivMil === "yes") {
    checklistItems.items.add({
      Title: "Attend Installation In-processing",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.InstallationInProcess,
      Active: true,
      Description: `<div><p style="margin-top: 0px">Did you attend the 88FSS installation in-processing? </p></div>`,
    } as ICheckListItem);
  }

  // Obtain/Transfer CAC (Mil/Civ)
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    checklistItems.items.add({
      Title: "Obtain CAC (Mil/Civ)",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.ObtainCACGov,
      Active: !(request.isNewCivMil === "yes"),
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
    } as ICheckListItem);
  }

  // Obtain/Transfer CAC (Ctr)
  if (request.empType === EMPTYPES.Contractor) {
    checklistItems.items.add({
      Title: "Obtain/Transfer CAC (Ctr)",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.ObtainCACCtr,
      Active: true,
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
    } as ICheckListItem);
  }

  // Obtain building access -- Required for all inbounds
  checklistItems.items.add({
    Title: "Obtain building access",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.BuildingAccess,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Supervisor Coordination of 2875 -- Required for all inbounds
  checklistItems.items.add({
    Title: "Supervisor Coordination of 2875",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.SupervisorCoord2875,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Security Coordination of 2875 -- Required for all inbounds
  checklistItems.items.add({
    Title: "Security Coordination of 2875",
    Lead: RoleType.SECURITY,
    RequestId: request.Id,
    TemplateId: templates.SecurityCoord2875,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Provision/move AFNET account -- Required for all inbounds
  checklistItems.items.add({
    Title: "Provision/move AFNET account",
    Lead: RoleType.IT,
    RequestId: request.Id,
    TemplateId: templates.ProvisionAFNET,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Equipment Issue -- Required for all inbounds
  checklistItems.items.add({
    Title: "Equipment Issue",
    Lead: RoleType.IT,
    RequestId: request.Id,
    TemplateId: templates.EquipmentIssue,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Add to security groups -- Required for all inbounds
  checklistItems.items.add({
    Title: "Add to security groups",
    Lead: RoleType.IT,
    RequestId: request.Id,
    TemplateId: templates.AddSecurityGroups,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Complete security training
  checklistItems.items.add({
    Title: "Complete security training",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.SecurityTraining,
    Active: false,
    Description: `<p style="margin-top: 0px">Review the Mandatory initial training slides and ensure you complete the survey at the end to receive credit</p>
    <p>The slides can be found at <a href="https://usaf.dps.mil/:p:/r/teams/AFLCMCCSO/_layouts/15/Doc.aspx?sourcedoc=%7BC6E442DB-B72B-4AB6-9B80-1613F4281F48%7D&file=Initial%20CSO%20Training.pptx&action=edit&mobileredirect=true">https://usaf.dps.mil/:p:/r/teams/AFLCMCCSO/_layouts/15/Doc.aspx?sourcedoc=%7BC6E442DB-B72B-4AB6-9B80-1613F4281F48%7D&file=Initial%20CSO%20Training.pptx&action=edit&mobileredirect=true</p>`,
  } as ICheckListItem);

  // Verify Air Force myLearning account
  checklistItems.items.add({
    Title: "Verify Air Force myLearning account",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.VerifyMyLearn,
    Active: false,
    Description: `<div><p style="margin-top: 0px">As part of in-processing, all employees are to verify or register for an Air Force myLearning training account. This account is necessary for the completion of mandatory training requirements.</p>
<p><a href="https://lms-jets.cce.af.mil/moodle/">Air Force MyLearning</a></p></div>`,
  } as ICheckListItem);

  // Confirm Air Force myLearning account
  checklistItems.items.add({
    Title: "Confirm Air Force myLearning account",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.ConfirmMyLearn,
    Active: false,
    Description: `<div><p style="margin-top: 0px">Click here for link to Air Force myLearning account: <a href="https://lms-jets.cce.af.mil/moodle/">Air Force MyLearning</a></p></div>`,
  } as ICheckListItem);

  // Verify AFMC myETMS account - CIV/MIL only
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    checklistItems.items.add({
      Title: "Verify AFMC myETMS account",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.VerifyMyETMS,
      Active: false,
      Description: `<div><p style="margin-top: 0px">Click here for link to myETMS: <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">Air Force Materiel Command's myEducation and Training Management System</a></p></div>`,
    } as ICheckListItem);
  }

  // Confirm AFMC myETMS account - CIV/MIL Only
  if (
    request.empType === EMPTYPES.Civilian ||
    request.empType === EMPTYPES.Military
  ) {
    checklistItems.items.add({
      Title: "Confirm AFMC myETMS account",
      Lead: RoleType.SUPERVISOR,
      RequestId: request.Id,
      TemplateId: templates.ConfirmMyETMS,
      Active: false,
      Description: `<div><p style="margin-top: 0px">Click here for link to myETMS: <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">Air Force Materiel Command's myEducation and Training Management System</a></p></div>`,
    } as ICheckListItem);
  }

  // Mandatory training (all employees)
  checklistItems.items.add({
    Title: "Complete mandatory training",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.MandatoryTraining,
    Active: false,
    Description: `<div><p style="margin-top: 0px">The table below provides a course list of mandatory training for all employees. Employee status can be found for these courses in MyLearning and MyETMS. Course enrollment will be accomplished via MyLearning. Please confirm all training requirements are met prior to completing this checklist item.</p>
    <p><a href="https://lms-jets.cce.af.mil/moodle/course/index.php?categoryid=173">myLearning - Total Force Awareness Training (TFAT)</a><br/>
    <a href="https://myetms.wpafb.af.mil/myetmsasp/main.asp">myETMS - Training Requirements</a></p>
<b><u>Mandatory Training Courses</u></b>
<table valign=top border=1 cellspacing=0 cellpadding=0 width=0 style="border-collapse:collapse; border: 1px solid blue; vertical-align: top">
 <tr><td width="60%" align=center style="background:blue"><b><span style="color:white">Course Title</span></b></td><td width="40%" align=center style="background:blue"><b><span style="color:white">Frequency</span></b></td></tr>
 <tr><td>DAF-Operations Security Awareness Training (OPSEC)</td><td>Annual</td></tr>
 <tr><td>TFAT - Cyber Awareness Challenge (ZZ133098)</td><td>Annual</td></tr>
 <tr><td>Force Protection (ZZ133079)</td><td>Annual</td></tr>
 <tr><td>2022 Annual Ethics Training</td><td>Annual</td></tr>
 <tr><td>Notification and Federal Employee Antidiscrimination and Retaliation Act (No FEAR) Training V1.0</td><td>Initial training within 90 calendar days of the new employees' appointment; then every 24 months</td></tr>
 <tr><td>Controlled Unclassified Information (CUI) Training (ZZZ2021CUI)</td><td>Annual</td></tr>
 <tr><td>Religious Freedom Training (ZZ133109)</td><td>Every 3 years</td></tr>
</table></div>`,
  } as ICheckListItem);

  // Confirm Mandatory training (all employees)
  checklistItems.items.add({
    Title: "Confirm mandatory training complete",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.ConfirmMandatoryTraining,
    Active: false,
    Description: `<div><p style="margin-top: 0px">None</p></div>`,
  } as ICheckListItem);

  // Supervisor training (Supervisory positions only)
  if (request.isSupervisor === "yes") {
    checklistItems.items.add({
      Title: "Complete supervisor training",
      Lead: RoleType.EMPLOYEE,
      RequestId: request.Id,
      TemplateId: templates.SupervisorTraining,
      Active: true,
      Description: `<div><p style="margin-top: 0px">Please look for Air University to provide guidance (online training link) for the completion of all appropriate supervisor training requirements.</p></div>`,
    } as ICheckListItem);
  }

  // Set up phone system (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Set up phone system",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.PhoneSetup,
    Active: false,
    Description: `<p style="margin-top: 0px">See the following link for phone set up instructions: <a href="https://www.tsf.wpafb.af.mil/Doc/Getting%20Started%20with%20the%20UC%20Client.pdf">Getting started with the UC Client</a></p>`,
  } as ICheckListItem);

  // Watch Orientation Videos (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "View orientation videos",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.OrientationVideos,
    Active: false,
    Description: `<p style="margin-top: 0px">The orientation videos may be found within the following document: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
  } as ICheckListItem);

  // Bookmark SharePoint/Websites (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Bookmark key SharePoint / Website URLs",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.Bookmarks,
    Active: false,
    Description: `<p style="margin-top: 0px">Bookmark the links located in the document located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/New%20Employee%20Websites.docx">New Employee Websites.docx</a></p>`,
  } as ICheckListItem);

  // Newcomer Breifing (all Employees) -- requires user to have CAC first
  checklistItems.items.add({
    Title: "Review directorate newcomer brief",
    Lead: RoleType.EMPLOYEE,
    RequestId: request.Id,
    TemplateId: templates.NewcomerBrief,
    Active: false,
    Description: `<p style="margin-top: 0px">Review directorate newcomer brief located here: <a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/AFLCMC%20-%20XP-OZ%20Overview.pptx">AFLCMC - XP-OZ Overview.pptx</a></p>`,
  } as ICheckListItem);

  // Unit orientation conducted (all Employees)
  checklistItems.items.add({
    Title: "Unit orientation conducted",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.UnitOrientation,
    Active: true,
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
  } as ICheckListItem);

  // Create & brief 971 folder
  checklistItems.items.add({
    Title: "Create & brief 971 folder",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.Brief971Folder,
    Active: true,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Signed performance/contribution plan
  checklistItems.items.add({
    Title: "Signed performance/contribution plan",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.SignedPerformContribPlan,
    Active: false,
    Description: `<p style="margin-top: 0px">None</p>`,
  } as ICheckListItem);

  // Signed telework agreement
  checklistItems.items.add({
    Title: "Signed telework agreement",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.SignedTeleworkAgreement,
    Active: false,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/sites/22539/Docs%20Shared%20to%20All/XP%20InOut%20Processing%20Automation%20Links/Telework%20Agreement%20Form%20dd2946.pdf">Telework Agreement Form DD2946</a></p>`,
  } as ICheckListItem);

  // Telework status entered in WHAT
  checklistItems.items.add({
    Title: "Telework status entered in WHAT",
    Lead: RoleType.SUPERVISOR,
    RequestId: request.Id,
    TemplateId: templates.TeleworkAddedToWHAT,
    Active: false,
    Description: `<p style="margin-top: 0px"><a href="https://usaf.dps.mil/teams/10251/WHAT">Workforce Hybrid Analysis Tool (WHAT)</a></p>`,
  } as ICheckListItem);

  // Create/Update ATAAPS account - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "Create/Update ATAAPS account",
      Lead: RoleType.ATAAPS,
      RequestId: request.Id,
      TemplateId: templates.ATAAPS,
      Active: false,
      Description: `<p style="margin-top: 0px">None</p>`,
    } as ICheckListItem);
  }

  // Verify direct deposit active - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "Verify direct deposit active",
      Lead: RoleType.ATAAPS,
      RequestId: request.Id,
      TemplateId: templates.VerifyDirectDeposit,
      Active: false,
      Description: `<p style="margin-top: 0px">None</p>`,
    } as ICheckListItem);
  }

  // Verify tax status accurate - CIV only
  if (request.empType === EMPTYPES.Civilian) {
    checklistItems.items.add({
      Title: "Verify tax status accurate",
      Lead: RoleType.ATAAPS,
      RequestId: request.Id,
      TemplateId: templates.VerifyTaxStatus,
      Active: false,
      Description: `<p style="margin-top: 0px">None</p>`,
    } as ICheckListItem);
  }

  // Profile created/re-assigned in DTS -- CIV/MIL with Travel required
  if (
    request.isTraveler === "yes" &&
    (request.empType === EMPTYPES.Civilian ||
      request.empType === EMPTYPES.Military)
  ) {
    checklistItems.items.add({
      Title: "Profile created/re-assigned in DTS",
      Lead: RoleType.DTS,
      RequestId: request.Id,
      TemplateId: templates.DTS,
      Active: false,
      Description: `<p style="margin-top: 0px">None</p>`,
    } as ICheckListItem);
  }

  // Training In-processing
  // Security In-processing
  // Supervisor In-processing
  // ETT In-processing

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
